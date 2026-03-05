'use client';

import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useIara } from '@/components/IaraContext';

export default function GlobalIaraButton() {
  const { isOpen, open } = useIara();
  const pathname = usePathname();
  const isHomePage = pathname === '/dashboard';

  if (isHomePage || isOpen) return null;

  return (
    <button
      onClick={open}
      aria-label="Abrir IARA"
      className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#1A1A1A]/90 hover:bg-[#2A2A2A] border border-white/10 text-white px-4 py-2.5 rounded-full shadow-2xl backdrop-blur-md transition-all cursor-pointer z-40"
    >
      <Sparkles className="w-4 h-4 text-purple-400" />
      <span className="text-sm font-medium">IARA</span>
    </button>
  );
}
