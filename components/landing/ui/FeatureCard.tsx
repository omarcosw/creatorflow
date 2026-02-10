'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

export default function FeatureCard({ icon: Icon, title, description, index = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="group relative rounded-xl bg-[#161616]/80 backdrop-blur-sm p-5 transition-all duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.12)] overflow-hidden"
    >
      {/* Animated gradient border */}
      <div className="absolute inset-0 rounded-xl border border-white/[0.08] transition-all duration-500 group-hover:border-transparent" />
      <div
        className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(192,38,211,0.4), rgba(139,92,246,0.4))',
          backgroundSize: '200% 200%',
          animation: 'borderGlow 2s ease-in-out infinite',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
        }}
      />

      {/* Content */}
      <div className="relative flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#C026D3] shadow-[0_0_12px_rgba(139,92,246,0.2)] transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(139,92,246,0.35)]">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-display text-sm font-bold text-white mb-1">{title}</h3>
          <p className="text-xs leading-relaxed text-[#A0A0A0]">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}
