import type { Metadata } from 'next';
import Link from 'next/link';
import { Kanban, PenTool, Briefcase, Music, Image, MessageSquare, Youtube, Sparkles, ChevronRight } from 'lucide-react';
import Footer from '@/components/landing/Footer';
import Navbar from '@/components/landing/Navbar';

export const metadata: Metadata = {
  title: 'CreatorFlow — Sistema Operacional para o Audiovisual',
  description:
    'Do briefing à aprovação final do cliente. Gerencie equipe, orçamentos, roteiros e aprovações em um único ecossistema premium para produtoras e creators.',
  keywords:
    'ERP audiovisual, gestão de produção, portal do cliente, orçamento audiovisual, freelancers, roteiro, storyboard, produtora',
  openGraph: {
    title: 'CreatorFlow — Sistema Operacional para o Audiovisual',
    description:
      'Do briefing à aprovação final. Ecossistema premium para produtoras e creators.',
    url: 'https://creatorflowia.com',
    siteName: 'CreatorFlow',
    type: 'website',
  },
};

export default function LandingPage() {
  return (
    <main className="bg-[#050505] text-white min-h-screen overflow-x-hidden">
      {/* Navbar */}
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-40 pb-24 text-center overflow-hidden">
        {/* Radial glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full" />
        <div className="pointer-events-none absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-500/10 blur-[100px] rounded-full" />

        {/* Badge */}
        <div className="relative z-10 mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-gray-300 tracking-wide">Creator Flow 2.0 — A nova era da produção</span>
        </div>

        {/* Headline */}
        <h1 className="relative z-10 max-w-4xl text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
          O Sistema Operacional das{' '}
          <span className="bg-gradient-to-r from-violet-400 to-purple-300 bg-clip-text text-transparent">
            Produtoras de Elite.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="relative z-10 max-w-2xl text-base md:text-lg text-gray-400 leading-relaxed mb-10">
          Do primeiro briefing à entrega final. Substitua o caos de dezenas de abas e mensagens perdidas no WhatsApp por um único hub de criação, gestão e inteligência artificial.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link
            href="/signup"
            className="flex items-center gap-2 rounded-xl bg-white px-7 py-3 text-sm font-semibold text-black hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
          >
            Começar Agora
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="#planos"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            Ver Planos
          </Link>
        </div>

        {/* App Mockup */}
        <div className="relative z-10 w-full max-w-5xl mx-auto">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/50">
            {/* Mockup top bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/20">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="flex-1 mx-4 h-6 rounded-md bg-white/5 flex items-center justify-center">
                <span className="text-[11px] text-gray-600">app.creatorflow.ai/dashboard</span>
              </div>
            </div>
            {/* Mockup body */}
            <div className="flex items-center justify-center h-64 md:h-80 bg-gradient-to-b from-[#0a0a0a] to-[#050505]">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                </div>
                <p className="text-sm text-gray-500">Sua produtora centralizada aqui</p>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 bg-violet-600/15 blur-3xl rounded-full" />
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <section id="funcionalidades" className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          {/* Section title */}
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-3">Arsenal Completo</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Tudo que você precisa. Em um só lugar.
            </h2>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Card 1 — Destaque (2 colunas) */}
            <div className="md:col-span-2 group relative rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] p-8 overflow-hidden transition-all duration-300 hover:border-white/15">
              <div className="pointer-events-none absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full" />
              <div className="p-2.5 rounded-xl bg-emerald-900/25 border border-emerald-800/30 w-fit mb-5">
                <Kanban className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Hub de Gestão & CRM</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                Visão Kanban, Sistema de Entregas Premium e um Cofre de Ideias Infinitas para você nunca mais travar na hora de criar.
              </p>
              <div className="mt-6 flex items-center gap-2 text-emerald-400 text-xs font-bold group-hover:gap-3 transition-all">
                Explorar <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 2 — Central de Criação */}
            <div className="group relative rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] p-8 overflow-hidden transition-all duration-300 hover:border-white/15">
              <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full" />
              <div className="p-2.5 rounded-xl bg-violet-900/25 border border-violet-800/30 w-fit mb-5">
                <PenTool className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Central de Criação</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Roteiros, iluminação, storyboards e listas de gravação perfeitamente alinhados.
              </p>
              <div className="mt-6 flex items-center gap-2 text-violet-400 text-xs font-bold group-hover:gap-3 transition-all">
                Explorar <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 3 — Assistente Executivo */}
            <div className="group relative rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] p-8 overflow-hidden transition-all duration-300 hover:border-white/15">
              <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
              <div className="p-2.5 rounded-xl bg-blue-900/25 border border-blue-800/30 w-fit mb-5">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Assistente Executivo</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Calculadora de lucros e precificação para garantir a margem da sua agência.
              </p>
              <div className="mt-6 flex items-center gap-2 text-blue-400 text-xs font-bold group-hover:gap-3 transition-all">
                Explorar <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 4 — Creator Stock (destaque visual) */}
            <div className="group relative rounded-2xl border border-amber-900/40 bg-gradient-to-b from-amber-900/10 to-transparent hover:border-amber-700/50 p-8 overflow-hidden transition-all duration-300">
              <div className="pointer-events-none absolute top-0 right-0 w-40 h-40 bg-amber-500/8 blur-3xl rounded-full" />
              {/* Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1 rounded-full border border-amber-800/50 bg-amber-900/30 px-2.5 py-1">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Beta Exclusivo</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-900/25 border border-amber-800/30 w-fit mb-5">
                <Music className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Creator Stock</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Sound design e trilhas cinematográficas em acesso antecipado.
              </p>
              <div className="mt-6 flex items-center gap-2 text-amber-400 text-xs font-bold group-hover:gap-3 transition-all">
                Acessar Beta <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Card 5 — IA Integrada (2 colunas) */}
            <div className="md:col-span-2 group relative rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.05] p-8 overflow-hidden transition-all duration-300 hover:border-white/15">
              <div className="pointer-events-none absolute bottom-0 left-0 w-64 h-32 bg-purple-500/8 blur-3xl rounded-full" />
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 rounded-xl bg-purple-900/25 border border-purple-800/30">
                  <Image className="w-5 h-5 text-purple-400" />
                </div>
                <div className="p-2.5 rounded-xl bg-purple-900/25 border border-purple-800/30">
                  <MessageSquare className="w-5 h-5 text-purple-400" />
                </div>
                <div className="p-2.5 rounded-xl bg-purple-900/25 border border-purple-800/30">
                  <Youtube className="w-5 h-5 text-purple-400" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Inteligência Artificial Integrada</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-md">
                Gerador de imagens, engenharia de prompts, SEO para YouTube e máquina de legendas. Tudo treinado para o universo audiovisual.
              </p>
              <div className="mt-6 flex items-center gap-2 text-purple-400 text-xs font-bold group-hover:gap-3 transition-all">
                Ver Agentes <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA Final ── */}
      <section className="relative px-6 py-24 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[600px] h-[300px] bg-violet-600/10 blur-[100px] rounded-full" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para operar como uma elite?
          </h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Junte-se a produtoras que já substituíram o caos por um sistema que trabalha por elas.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-black hover:bg-gray-100 transition-colors shadow-lg shadow-white/10"
          >
            Criar Conta Grátis
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
