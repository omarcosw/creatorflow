'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('cf_logged_in') === 'true';
    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (!isLoggedIn && !isPublic) {
      router.replace('/login');
      return;
    }

    if (isLoggedIn && (pathname === '/login' || pathname === '/signup')) {
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
