'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap, Sparkles, Rocket, Building2, Check, ShieldCheck } from 'lucide-react';
import SectionLabel from './ui/SectionLabel';
import GradientButton from './ui/GradientButton';
import TiltCard from './ui/TiltCard';

function AnimatedPrice({ value, decimals, inView }: { value: number; decimals: number; inView: boolean }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1200;
    const startTime = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return <>{display}<span className="text-2xl font-bold">,{decimals.toString().padStart(2, '0')}</span></>;
}

const plans = [
  {
    name: 'Solo',
    key: 'solo',
    icon: Zap,
    description: 'Para começar a criar com IA',
    price: 49,
    decimals: 90,
    highlighted: false,
    features: [
      '10 mensagens por dia',
      '3 agentes IA',
      'Modelo Flash',
      '1 sessão salva',
      'Suporte por email',
    ],
  },
  {
    name: 'Maker',
    key: 'maker',
    icon: Sparkles,
    description: 'Para criadores independentes',
    price: 67,
    decimals: 90,
    highlighted: false,
    features: [
      '30 mensagens por dia',
      '10 agentes IA',
      'Modelo Flash',
      '5 sessões salvas',
      'Suporte por email',
    ],
  },
  {
    name: 'Studio',
    key: 'studio',
    icon: Rocket,
    description: 'Para criadores em crescimento',
    price: 197,
    decimals: 90,
    highlighted: true,
    badge: 'Mais Popular',
    features: [
      '100 mensagens por dia',
      'Todos os 24 agentes IA',
      'Modelos Flash + Pro',
      '20 imagens storyboard',
      'Sessões ilimitadas',
      'Shot List Manager',
      'Suporte prioritário',
    ],
  },
  {
    name: 'Agency',
    key: 'agency',
    icon: Building2,
    description: 'Para equipes e agências',
    price: 497,
    decimals: 90,
    highlighted: false,
    features: [
      'Mensagens ilimitadas',
      'Todos os 24 agentes IA',
      'Modelos Flash + Pro',
      'Storyboard ilimitado',
      'Sessões ilimitadas',
      'Shot List Manager',
      'Brand Kit',
      'Suporte dedicado',
    ],
  },
];

export default function PricingSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section id="precos" ref={sectionRef} className="relative py-24 px-6 lg:px-12 overflow-hidden">
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 bg-gradient-to-r from-transparent via-[#8B5CF6]/20 to-transparent" />

      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <SectionLabel>Nossos Planos</SectionLabel>
          <h2 className="font-display text-3xl md:text-[42px] font-bold text-white leading-tight">
            Escolha o plano ideal para<br />
            <span className="bg-gradient-to-r from-[#8B5CF6] to-[#C026D3] bg-clip-text text-transparent">
              a sua criatividade:
            </span>
          </h2>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <TiltCard
                  className={`group relative rounded-2xl p-7 h-full ${
                    plan.highlighted
                      ? 'border border-[#8B5CF6]/60 bg-gradient-to-b from-[#8B5CF6]/[0.06] to-[#161616] shadow-[0_0_50px_rgba(139,92,246,0.12)]'
                      : 'border border-white/[0.08] bg-[#161616]'
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-[#7C3AED] to-[#C026D3] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_0_16px_rgba(139,92,246,0.3)]">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#C026D3]/20 border border-[#8B5CF6]/20 mb-4">
                    <Icon className="h-5 w-5 text-[#A78BFA]" />
                  </div>

                  <h3 className="font-display text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-[#A0A0A0] mb-5">{plan.description}</p>

                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-sm font-medium text-[#A0A0A0]">R$</span>
                    <span className="font-display text-[42px] font-extrabold leading-none text-white">
                      <AnimatedPrice value={plan.price} decimals={plan.decimals} inView={inView} />
                    </span>
                    <span className="text-sm font-medium text-[#666666]">/m&ecirc;s</span>
                  </div>

                  <div className="h-px w-full bg-white/[0.06] mb-5" />

                  <ul className="space-y-2.5 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-white/75">
                        <Check className="h-4 w-4 shrink-0 mt-0.5 text-[#8B5CF6]" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <GradientButton
                    href={plan.key === 'agency' ? 'https://wa.me/5527999210071' : `/signup?plan=${plan.key}`}
                    variant={plan.highlighted ? 'solid' : 'outline'}
                    size="md"
                    className="w-full"
                  >
                    {plan.key === 'agency' ? 'Falar com Vendas' : plan.highlighted ? 'Começar Agora' : 'Assinar'}
                  </GradientButton>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex items-center justify-center gap-2 text-sm text-[#666666]"
        >
          <ShieldCheck className="h-4 w-4 text-[#8B5CF6]/60" />
          Garantia de 7 dias ou seu dinheiro de volta
        </motion.div>
      </div>
    </section>
  );
}
