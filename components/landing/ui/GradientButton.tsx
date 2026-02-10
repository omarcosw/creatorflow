'use client';

import Link from 'next/link';

interface GradientButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: 'solid' | 'outline' | 'outline-white';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export default function GradientButton({
  children,
  href,
  variant = 'solid',
  size = 'md',
  className = '',
  onClick,
}: GradientButtonProps) {
  const sizeClasses = {
    sm: 'px-5 py-2 text-[13px]',
    md: 'px-7 py-3 text-sm',
    lg: 'px-9 py-4 text-base',
  };

  const variantClasses = {
    solid:
      'bg-gradient-to-r from-[#7C3AED] to-[#C026D3] text-white shadow-[0_0_24px_rgba(139,92,246,0.25)] hover:shadow-[0_0_36px_rgba(139,92,246,0.4)] hover:scale-[1.03]',
    outline:
      'border border-[#8B5CF6] text-white hover:bg-[#8B5CF6]/10 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]',
    'outline-white':
      'border border-white/20 text-white hover:border-white/40 hover:bg-white/5',
  };

  const base = `inline-flex items-center justify-center rounded-full font-semibold tracking-wide uppercase transition-all duration-300 cursor-pointer ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={base}>
      {children}
    </button>
  );
}
