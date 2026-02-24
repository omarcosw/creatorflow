'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  Flame,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Video,
  Users,
  DollarSign,
  LayoutDashboard,
  ChevronRight,
} from 'lucide-react';
import { Client } from '@/types';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type PortalTab = 'dashboard' | 'roteiros' | 'videos' | 'reunioes' | 'financeiro';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const PRODUCTION_STAGES = [
  'Briefing',
  'Roteirização',
  'Aprovação',
  'Gravação',
  'Edição',
  'Pronto',
] as const;

const CURRENT_STAGE_IDX = 4; // "Edição" — mock value, Phase 2 will wire this to real data

const PORTAL_TABS: { id: PortalTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: 'roteiros',   label: 'Roteiros',   icon: <FileText        className="w-3.5 h-3.5" /> },
  { id: 'videos',     label: 'Vídeos',     icon: <Video           className="w-3.5 h-3.5" /> },
  { id: 'reunioes',   label: 'Reuniões',   icon: <Users           className="w-3.5 h-3.5" /> },
  { id: 'financeiro', label: 'Financeiro', icon: <DollarSign      className="w-3.5 h-3.5" /> },
];

// ─────────────────────────────────────────────
// Production Stepper
// ─────────────────────────────────────────────
const ProductionStepper: React.FC = () => (
  <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
    <div className="px-6 py-5 border-b border-gray-800">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status Atual</p>
      <h2 className="text-base font-black text-white mt-0.5">Produção do Pacote</h2>
    </div>

    <div className="px-6 py-6">
      {/* ── Circles + connector lines ── */}
      <div className="flex items-start">
        {PRODUCTION_STAGES.map((stage, idx) => {
          const isCompleted = idx < CURRENT_STAGE_IDX;
          const isCurrent   = idx === CURRENT_STAGE_IDX;

          return (
            <React.Fragment key={stage}>
              {/* Node */}
              <div className="flex flex-col items-center flex-shrink-0 w-10 sm:w-14">
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                    isCompleted
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : isCurrent
                        ? 'bg-gray-950 border-violet-500 text-violet-400 shadow-lg shadow-violet-500/30 animate-pulse'
                        : 'bg-gray-950 border-gray-700 text-gray-600'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span
                  className={`mt-2 text-[8px] sm:text-[9px] font-black text-center leading-tight ${
                    isCurrent ? 'text-violet-400' : isCompleted ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
                  {stage}
                </span>
              </div>

              {/* Connector line */}
              {idx < PRODUCTION_STAGES.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mt-3.5 sm:mt-4 transition-colors ${
                    idx < CURRENT_STAGE_IDX ? 'bg-violet-600' : 'bg-gray-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── Current stage callout ── */}
      <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse flex-shrink-0" />
        <div>
          <p className="text-sm font-black text-violet-300">
            Etapa atual: {PRODUCTION_STAGES[CURRENT_STAGE_IDX]}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Seus vídeos estão sendo editados pela equipe. Previsão: 3 dias úteis.
          </p>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Achievements Grid
// ─────────────────────────────────────────────
const ACHIEVEMENTS = [
  {
    icon: <Flame      className="w-5 h-5" />,
    iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    hover:  'hover:border-amber-700/50',
    value:  '30',
    label:  'Vídeos Produzidos',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    hover:  'hover:border-emerald-700/50',
    value:  '+15%',
    label:  'Crescimento no Instagram',
  },
  {
    icon: <Trophy     className="w-5 h-5" />,
    iconBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
    hover:  'hover:border-violet-700/50',
    value:  '10k',
    label:  'Views no último Reels',
  },
] as const;

const AchievementsGrid: React.FC = () => (
  <section>
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
      Marcos da Nossa Parceria
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {ACHIEVEMENTS.map(a => (
        <div
          key={a.label}
          className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 transition-colors ${a.hover}`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${a.iconBg}`}>
            {a.icon}
          </div>
          <div>
            <p className="text-2xl font-black text-white">{a.value}</p>
            <p className="text-xs font-bold text-gray-400 mt-0.5">{a.label}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────────
// Pending Actions
// ─────────────────────────────────────────────
const PENDING_ACTIONS = [
  {
    color: 'amber' as const,
    bg:    'bg-amber-500/10 border-amber-500/20',
    icon:  'text-amber-400',
    text:  'text-amber-300',
    title: '2 Roteiros aguardando sua aprovação',
    sub:   'Prazo: até 28 Fev',
  },
  {
    color: 'red' as const,
    bg:    'bg-red-500/10 border-red-500/20',
    icon:  'text-red-400',
    text:  'text-red-300',
    title: 'Fatura Fev/2026 em aberto',
    sub:   'Vencimento: 01 Mar',
  },
];

const PendingActions: React.FC = () => (
  <section>
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">
      Ações Pendentes
    </p>
    <div className="space-y-2">
      {PENDING_ACTIONS.map(action => (
        <div
          key={action.title}
          className={`flex items-center gap-4 p-4 rounded-2xl border ${action.bg}`}
        >
          <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${action.icon}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-bold ${action.text}`}>{action.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{action.sub}</p>
          </div>
          <button className={`flex-shrink-0 flex items-center gap-1 text-xs font-black ${action.icon} hover:opacity-70 transition-opacity`}>
            Ver <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  </section>
);

// ─────────────────────────────────────────────
// Tab placeholder
// ─────────────────────────────────────────────
const TabPlaceholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-200">
    <div className="text-4xl mb-4">🚧</div>
    <h2 className="text-base font-black text-gray-400 mb-1">Em breve</h2>
    <p className="text-sm text-gray-600">Esta seção está sendo preparada pela equipe.</p>
  </div>
);

// ─────────────────────────────────────────────
// ClientPortalView
// ─────────────────────────────────────────────
interface ClientPortalViewProps {
  client: Client;
  onBack: () => void;
}

const ClientPortalView: React.FC<ClientPortalViewProps> = ({ client, onBack }) => {
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard');

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-white animate-in fade-in duration-300">

      {/* ══ Header ══ */}
      <header className="sticky top-0 z-20 px-4 sm:px-6 py-3.5 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

          {/* Back (agency-side shortcut) */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Sair
          </button>

          {/* Agency logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white select-none">
              CF
            </div>
            <span className="text-xs font-black text-gray-500 hidden sm:block tracking-widest uppercase">
              CreatorFlow
            </span>
          </div>

          {/* Greeting */}
          <p className="text-sm font-bold text-gray-300">
            Olá, <span className="text-violet-400 font-black">{client.brandName}</span> 👋
          </p>
        </div>
      </header>

      {/* ══ Navigation tabs ══ */}
      <nav className="sticky top-[57px] z-10 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
            {PORTAL_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-black whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-400'
                    : 'border-transparent text-gray-600 hover:text-gray-400 hover:border-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ══ Content ══ */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <ProductionStepper />
              <AchievementsGrid />
              <PendingActions />
            </div>
          )}

          {activeTab !== 'dashboard' && <TabPlaceholder />}

        </div>
      </main>
    </div>
  );
};

export default ClientPortalView;
