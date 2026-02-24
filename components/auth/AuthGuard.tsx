'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

function isSessionValid(): boolean {
  const loggedIn = localStorage.getItem('cf_logged_in') === 'true';
  if (!loggedIn) return false;

  const sessionStart = localStorage.getItem('cf_session_start');
  if (!sessionStart) return false;

  const elapsed = Date.now() - parseInt(sessionStart);
  if (elapsed > SESSION_MAX_AGE) {
    // Session expired — clear all auth data
    localStorage.removeItem('cf_logged_in');
    localStorage.removeItem('cf_email');
    localStorage.removeItem('cf_name');
    localStorage.removeItem('cf_pass_hash');
    localStorage.removeItem('cf_session_start');
    return false;
  }

  return true;
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const valid = isSessionValid();
    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (!valid && !isPublic) {
      router.replace('/login');
      return;
    }

    if (valid && (pathname === '/login' || pathname === '/signup')) {
      router.replace('/dashboard');
      return;
    }

    setChecked(true);
  }, [pathname, router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#8B5CF6] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
