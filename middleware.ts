import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory rate limit store (resets on server restart — good enough without Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count };
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --- Rate limiting for API routes ---
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(request);
    const { allowed, remaining } = checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    // Reject oversized request bodies (50MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Requisição muito grande.' },
        { status: 413 }
      );
    }

    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', String(RATE_LIMIT_MAX));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    return addSecurityHeaders(response);
  }

  // --- Security headers for all other routes ---
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS protection (legacy browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HTTPS enforcement
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );

  // Restrict browser features
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), camera=(), accelerometer=(), gyroscope=()'
  );

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://images.unsplash.com https://cdn.pixabay.com https://upload.wikimedia.org",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
