'use client';

import { motion } from 'framer-motion';
import { Lightbulb, Cpu, Rocket } from 'lucide-react';
import SectionLabel from './ui/SectionLabel';

const steps = [
  {
    number: '01',
    title: 'Descreva sua ideia',
    description: 'Conte para IA o que voc\u00ea quer produzir: um v\u00eddeo, roteiro, post, campanha ou qualquer pe\u00e7a criativa.',
    bullets: ['Roteiros e v\u00eddeos', 'Legendas e thumbnails', 'Or\u00e7amento e produ\u00e7\u00e3o'],
    icon: Lightbulb,
  },
  {
    number: '02',
    title: 'A IA trabalha para voc\u00ea',
    description: 'Nosso time de agentes de IA analisa, cria e entrega seu conte\u00fado pronto em segundos.',
    bullets: ['Processamento r\u00e1pido', 'M\u00faltiplos formatos', 'Conte\u00fado sob medida'],
    icon: Cpu,
  },
  {
    number: '03',
    title: 'Refine e publique',
    description: 'Edite os resultados ao seu gosto, combine cria\u00e7\u00f5es e publique nas suas plataformas.',
    bullets: ['Ajuste fino', 'Edi\u00e7\u00e3o interativa', 'Exporta\u00e7\u00e3o f\u00e1cil'],
    icon: Rocket,
  },
];

export default function WorkflowSection() {
  return (
    <section id="fluxo" className="relative py-24 px-6 lg:px-12 overflow-hidden">
      {/* Subtle background differentiation */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0d0d0d] to-[#0A0A0A]" />

      <div className="relative mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <SectionLabel>Fluxo de Trabalho</SectionLabel>
          <h2 className="font-display text-3xl md:text-[42px] font-bold text-white leading-tight">
            Do conceito ao conte&uacute;do<br />
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#C026D3] bg-clip-text text-transparent">
              em 3 passos simples
            </span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="space-y-24 lg:space-y-32">
          {steps.map((step, i) => {
            const isEven = i % 2 === 1;
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className={`flex flex-col gap-10 lg:gap-16 ${
                  isEven ? 'lg:flex-row-reverse' : 'lg:flex-row'
                } items-center`}
              >
                {/* Text side */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? 30 : -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.7 }}
                  className="flex-1"
                >
                  {/* Number */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="font-display text-6xl md:text-7xl font-extrabold bg-gradient-to-br from-[#7C3AED] to-[#C026D3] bg-clip-text text-transparent leading-none">
                      {step.number}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#8B5CF6]/30 to-transparent" />
                  </div>

                  <h3 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                    {step.title}
                  </h3>
                  <p className="text-base text-[#A0A0A0] leading-relaxed mb-6 max-w-md">
                    {step.description}
                  </p>

                  {/* Bullets */}
                  <ul className="space-y-3">
                    {step.bullets.map((b) => (
                      <li key={b} className="flex items-center gap-3 text-sm text-white/70">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-[#8B5CF6]/30 bg-[#8B5CF6]/10">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#8B5CF6]" />
                        </span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Visual side */}
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.7, delay: 0.15 }}
                  className="flex-1 w-full"
                >
                  <div className="relative aspect-[4/3] rounded-2xl border border-white/[0.08] bg-[#111111] overflow-hidden">
                    {/* Background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/8 via-transparent to-[#C026D3]/5" />
                    {/* Grid pattern */}
                    <div
                      className="absolute inset-0 opacity-[0.025]"
                      style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                        backgroundSize: '32px 32px',
                      }}
                    />
                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#C026D3]/20 border border-[#8B5CF6]/20">
                        <Icon className="h-10 w-10 text-[#A78BFA]" />
                      </div>
                    </div>
                    {/* Step badge */}
                    <div className="absolute top-4 left-4 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 px-3 py-1">
                      <span className="text-xs font-semibold text-[#A78BFA] tracking-wide">PASSO {step.number}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Sparkle decorations */}
        <div className="pointer-events-none absolute top-1/4 left-[5%] text-[#8B5CF6]/20 text-xl select-none">&#10022;</div>
        <div className="pointer-events-none absolute top-2/3 right-[8%] text-[#C026D3]/20 text-base select-none">&#10022;</div>
        <div className="pointer-events-none absolute bottom-20 left-1/3 text-[#A78BFA]/15 text-sm select-none">&#10022;</div>
      </div>
    </section>
  );
}
