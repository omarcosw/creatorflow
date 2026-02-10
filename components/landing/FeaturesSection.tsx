'use client';

import { motion } from 'framer-motion';
import { FileText, Sparkles, Film, MessageSquare, Calculator, Search, Play } from 'lucide-react';
import FeatureCard from './ui/FeatureCard';
import GradientButton from './ui/GradientButton';

const features = [
  { icon: FileText, title: 'Gerador de Roteiro', description: 'Crie roteiros profissionais com IA para qualquer formato de v\u00eddeo.' },
  { icon: Sparkles, title: 'F\u00e1brica de Conte\u00fado', description: 'Ideias de conte\u00fado ilimitadas baseadas em tend\u00eancias e nicho.' },
  { icon: Film, title: 'Storyboard Visual', description: 'Visualize suas cenas com imagens geradas por IA.' },
  { icon: MessageSquare, title: 'Legendas Inteligentes', description: 'Legendas otimizadas para engajamento em todas as redes.' },
  { icon: Calculator, title: 'Or\u00e7amento AI', description: 'Calcule custos de produ\u00e7\u00e3o de forma r\u00e1pida e precisa.' },
  { icon: Search, title: 'Otimiza\u00e7\u00e3o SEO', description: 'T\u00edtulos, tags e descri\u00e7\u00f5es que rankeiam no YouTube.' },
];

// Decorative waveform bars
function Waveform() {
  return (
    <div className="flex items-end gap-[2px] h-8">
      {Array.from({ length: 32 }).map((_, i) => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-[#7C3AED] to-[#C026D3]"
          animate={{ height: [4, 8 + Math.random() * 20, 4] }}
          transition={{ duration: 0.8 + Math.random() * 0.6, repeat: Infinity, delay: i * 0.05 }}
        />
      ))}
    </div>
  );
}

export default function FeaturesSection() {
  return (
    <section id="ferramenta" className="relative py-24 px-6 lg:px-12">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-[#8B5CF6]/20 to-transparent" />

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <p className="text-base text-[#A0A0A0] mb-1">Ferramentas que te auxiliam da</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#C026D3] bg-clip-text text-transparent">Pr&eacute;</span> a{' '}
            <span className="bg-gradient-to-r from-[#C026D3] to-[#8B5CF6] bg-clip-text text-transparent">P&oacute;s</span>-Produ&ccedil;&atilde;o
          </h2>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Enhanced video player */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7 }}
            className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden"
          >
            {/* Video area */}
            <div className="relative flex-1 flex items-center justify-center aspect-video">
              <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/10 via-transparent to-[#C026D3]/5" />
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              {/* Play button */}
              <button type="button" aria-label="Assistir demonstração" className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#C026D3] shadow-[0_0_40px_rgba(139,92,246,0.35)] transition-transform duration-300 group-hover:scale-110 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]">
                <Play className="h-7 w-7 text-white fill-white ml-1" aria-hidden="true" />
              </button>
              {/* REC indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-bold text-red-400/80 uppercase tracking-wider">Rec</span>
              </div>
              {/* Badge */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/25 px-3 py-1">
                <Sparkles className="h-3.5 w-3.5 text-[#A78BFA]" />
                <span className="text-xs font-medium text-[#A78BFA]">IA Criativa</span>
              </div>
            </div>
            {/* Timeline bar + waveform */}
            <div className="border-t border-white/[0.06] px-4 py-3 bg-[#0e0e0e]">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] text-white/30 font-mono">00:00</span>
                <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#C026D3]" />
                </div>
                <span className="text-[10px] text-white/30 font-mono">03:24</span>
              </div>
              <Waveform />
            </div>
          </motion.div>

          {/* Feature cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 text-center"
        >
          <GradientButton href="#precos" variant="solid" size="lg">
            Ver Pre&ccedil;os
          </GradientButton>
        </motion.div>
      </div>
    </section>
  );
}
