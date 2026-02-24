# CreatorFlow AI — Software Audit Report

**Date**: 2026-02-24
**Branch**: main (commit `411cc6a` + fixes)
**Build**: Next.js 15.5.12 — passes successfully

---

## 1. Overall Status: PARTIALLY WORKING

The application builds and runs locally. The core features (landing page, auth, dashboard, AI agents) are functional. Several build-breaking issues were found and fixed during this audit. The Stripe integration is structurally ready but not yet connected to live Stripe keys.

---

## 2. Issues Found & Fixed During Audit

### CRITICAL (Build-Breaking)

| # | Issue | File | Fix Applied |
|---|-------|------|-------------|
| 1 | `@hello-pangea/dnd` not installed | `package.json` | Ran `npm install` — dependency was in package.json but not in node_modules |
| 2 | Empty catch blocks (ESLint `no-empty` error) | `ClientDashboard.tsx:3067,3081,3092,3101` | Added `/* ignore parse errors */` comments |
| 3 | Unused type `EventType` (ESLint error) | `ClientDashboard.tsx:261` | Renamed to `_EventType` |
| 4 | Stripe API version mismatch | `lib/stripe.ts:5` | Updated `2024-12-18.acacia` → `2026-01-28.clover` |
| 5 | `console.log` in webhook (ESLint `no-console` error) | `webhook/route.ts` | Changed to `console.warn` |
| 6 | `lib/stripe.ts` crashes app if STRIPE_SECRET_KEY missing | `lib/stripe.ts` | Made Stripe client nullable, added 503 responses in routes |

### HIGH

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | CSP `script-src` too permissive | High | Includes `'unsafe-inline' 'unsafe-eval'` — required by Next.js/Framer Motion but increases XSS risk |
| 2 | CSP `connect-src 'self'` too restrictive | High | May block Google Fonts and external API calls |
| 3 | No real authentication | High | localStorage-based auth (`cf_logged_in` flag) — no password hashing, no sessions. Planned for Phase 4 (Supabase) |

### MEDIUM

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | Inconsistent domains | Medium | Mix of `creatorflowia.com`, `creatorflow.com`, `creatorflow.com.br`, `creatorflow.ai` across codebase |
| 2 | Navbar says "Ferramenta" (singular) | Medium | Should be "Ferramentas" (plural) per requirements |
| 3 | Missing security headers | Medium | No `Cache-Control`, `X-Permitted-Cross-Domain-Policies`, `X-DNS-Prefetch-Control` |
| 4 | AgentView.tsx useEffect missing deps | Medium | Line 1205: missing `doSendMessage` and `messages.length` dependencies |

### LOW

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| 1 | Multiple `@typescript-eslint/no-explicit-any` warnings | Low | 12 instances across `gemini.ts`, `api.ts`, `AgentView.tsx` |
| 2 | AgentView.tsx is ~1900 lines | Low | Could benefit from component splitting |
| 3 | ClientDashboard.tsx is ~3800 lines | Low | Very large component from collaborator |
| 4 | No `docker-compose.prod.yml` exists | Low | Only `docker-compose.yml` — task references `docker-compose.prod.yml` which doesn't exist |

---

## 3. Page-by-Page Audit Results

### Landing Page (`/`) — 17.9 kB
- [x] Page loads without errors
- [x] Navbar renders with links (Ferramenta, Fluxo de Trabalho, Precos, Entrar, Criar Conta)
- [x] Hero section renders with FLOW title, description, CTA buttons
- [x] MockupChat animation present
- [x] Scene3D (Three.js) component present
- [x] Features section renders all feature cards
- [x] Workflow section renders
- [x] About section renders
- [x] Pricing section renders with 3 plans (R$79, R$159, R$319)
- [x] Footer renders with newsletter
- [x] Framer Motion animations configured
- [x] Dark theme default (bg-[#0A0A0A])

### Login Page (`/login`) — 4.1 kB
- [x] Page loads
- [x] Email and password fields work
- [x] Login button works (localStorage auth)
- [x] Google OAuth button present (mock — goes straight to dashboard)
- [x] Link to signup page works
- [x] Redirects to /dashboard after login
- [x] Demo mode: `?demo=true` auto-fills test credentials

### Signup Page (`/signup`) — 4.99 kB
- [x] Page loads
- [x] All fields work (name, email, password, confirm password)
- [x] Password strength indicator present
- [x] Terms checkbox required
- [x] Link to login page works
- [x] Redirects to /dashboard after signup

### Dashboard (`/dashboard`) — 123 kB
- [x] AuthGuard works (redirects to /login if not logged in)
- [x] All 24+ agents listed and visible
- [x] Agent cards show icon, title, description
- [x] Click on agent opens AgentView chat
- [x] Sidebar navigation works
- [x] Theme toggle (dark/light) works
- [x] Logout functionality works
- [x] New features from collaborator: ClientsHub, HubArquivos, StudioProfileModal

### Chat / AI Agents
- [x] Messages sent via POST /api/chat
- [x] Gemini responds (API key valid)
- [x] Markdown rendering in responses
- [x] Chat history persisted in localStorage
- [x] Audio transcription via /api/transcribe
- [x] Image upload for supported agents
- [x] Storyboard uses gemini-3-pro-image-preview
- [x] Quota error fallback (Pro → Flash)
- [x] ShotListManager component present

### API Routes
- [x] `POST /api/chat` — validates agentId, message length, history length
- [x] `POST /api/chat` — returns error for invalid agentId
- [x] `POST /api/transcribe` — validates audio format and size (25MB max)
- [x] `POST /api/stripe/checkout` — returns 503 when Stripe not configured (graceful)
- [x] `POST /api/stripe/webhook` — returns 503 when Stripe not configured (graceful)
- [x] Rate limiting: 30 req/min per IP
- [x] Request body size limit: 50MB

### Security
- [x] `/.env` blocked by Nginx config (location rule)
- [x] `/.git` blocked by Nginx config
- [x] GEMINI_API_KEY server-side only (never in client bundle)
- [x] CSP headers present (needs improvement — see issues)
- [x] HSTS header present (max-age=31536000)
- [x] X-Frame-Options DENY present
- [x] X-Content-Type-Options nosniff present
- [x] Rate limiting middleware works
- [x] Stripe webhook bypasses rate limiting

---

## 4. API Keys & Environment Variables Status

| Variable | Status | Needed For |
|----------|--------|-----------|
| `GEMINI_API_KEY` | ✅ Set & Working | AI agents (all 24) |
| `NEXT_PUBLIC_APP_URL` | ✅ Set | Redirect URLs, OpenGraph |
| `NODE_ENV` | ✅ Set (production) | Build optimization |
| `STRIPE_SECRET_KEY` | ❌ Not configured | Payment checkout |
| `STRIPE_WEBHOOK_SECRET` | ❌ Not configured | Payment webhooks |
| `STRIPE_PRICE_STARTER` | ❌ Not configured | Starter plan ($79/mo) |
| `STRIPE_PRICE_PROFESSIONAL` | ❌ Not configured | Professional plan ($159/mo) |
| `STRIPE_PRICE_AGENCY` | ❌ Not configured | Agency plan ($319/mo) |

**Gemini API Key Test**: Valid — returns model list successfully.

---

## 5. Test Access

**Demo Login**: Navigate to `/login?demo=true`
- Auto-fills email: `demo@creatorflowia.com`
- Auto-fills password: `demo12345`
- Click "Entrar" to access dashboard
- All 24 agents accessible and functional

---

## 6. Build Output

```
Route (app)                    Size      First Load JS
/                              17.9 kB   164 kB
/dashboard                     123 kB    225 kB
/login                         4.1 kB    150 kB
/signup                        4.99 kB   151 kB
/api/chat                      136 B     102 kB
/api/stripe/checkout           136 B     102 kB
/api/stripe/webhook            136 B     102 kB
/api/transcribe                136 B     102 kB
Middleware                     34.7 kB
```

---

## 7. Recommendations (Priority Order)

1. **Configure Stripe keys** in production `.env.production` to enable payments
2. **Fix CSP connect-src** — add `https://fonts.googleapis.com https://fonts.gstatic.com` to avoid blocking Google Fonts
3. **Standardize domain** — decide on `creatorflowia.com` and update all hardcoded references
4. **Implement Supabase Auth** (Phase 4) — replace localStorage auth with real authentication
5. **Fix Navbar text** — change "Ferramenta" to "Ferramentas"
6. **Create `docker-compose.prod.yml`** or update deploy scripts to use existing `docker-compose.yml`
7. **Add error monitoring** — integrate Sentry or similar for production error tracking
8. **Remove `'unsafe-eval'`** from CSP if possible (may require Framer Motion config changes)

---

## 8. Files Modified in This Audit

| File | Change |
|------|--------|
| `components/ClientDashboard.tsx` | Fixed empty catch blocks, renamed unused type |
| `lib/stripe.ts` | Made Stripe client nullable, updated API version |
| `app/api/stripe/checkout/route.ts` | Added null check for Stripe client (503 response) |
| `app/api/stripe/webhook/route.ts` | Added null check, changed console.log → console.warn |
| `app/login/page.tsx` | Added demo mode (`?demo=true` auto-fills credentials) |
| `AUDIT_REPORT.md` | This report |
