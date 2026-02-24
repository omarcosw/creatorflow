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
  ChevronDown,
  Calendar,
  Star,
  ThumbsUp,
  MessageSquare,
  X,
  Play,
  Check,
  Send,
} from 'lucide-react';
import { Client } from '@/types';

// ─────────────────────────────────────────────
// Shared types
// ─────────────────────────────────────────────
type PortalTab   = 'dashboard' | 'roteiros' | 'videos' | 'reunioes' | 'financeiro';
type ReviewStatus = 'aguardando' | 'aprovado' | 'alteracao';

const REVIEW_STATUS_CONFIG: Record<ReviewStatus, { label: string; badge: string }> = {
  aguardando: { label: 'Aguardando Aprovação', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  aprovado:   { label: 'Aprovado',             badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  alteracao:  { label: 'Alteração Solicitada', badge: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
};

// ─────────────────────────────────────────────
// Portal script type + mock data
// ─────────────────────────────────────────────
interface PortalScript {
  id: string;
  title: string;
  theme: string;
  sentAt: string;
  status: ReviewStatus;
  feedback?: string;
  body: { scene: number; visual: string; audio: string }[];
  caption: string;
  hashtags: string;
}

const MOCK_SCRIPTS: PortalScript[] = [
  {
    id: 's1',
    title: '5 Erros que Destroem Seu Resultado (e Como Evitar)',
    theme: 'Educacional · Reels',
    sentAt: '22 Fev',
    status: 'aguardando',
    feedback: undefined,
    body: [
      { scene: 1, visual: 'Close no rosto — expressão surpresa', audio: '"Você está cometendo esses 5 erros SEM perceber…"' },
      { scene: 2, visual: 'Texto animado na tela com ícone de X vermelho', audio: 'Erro 1: Postar sem estratégia. Quantidade não é qualidade.' },
      { scene: 3, visual: 'Infográfico rápido com 5 pontos', audio: 'Erro 2: Ignorar a análise de métricas semanalmente.' },
      { scene: 4, visual: 'Câmera na altura dos olhos, fundo neutro', audio: '"Agora que você sabe o que evitar — clica aqui pra saber o que fazer de verdade."' },
    ],
    caption: 'Você comete algum desses erros? 😱 Salva esse vídeo antes de postar o próximo! 👇',
    hashtags: '#marketingdigital #erroscomuns #crescimentonoinstagram #contentcreator',
  },
  {
    id: 's2',
    title: 'Bastidores: Como é um Dia na Nossa Produção',
    theme: 'Bastidores · Carrossel',
    sentAt: '20 Fev',
    status: 'aguardando',
    feedback: undefined,
    body: [
      { scene: 1, visual: 'Timelapse da setup de iluminação', audio: '"Você sabe o que acontece antes de ligar a câmera?"' },
      { scene: 2, visual: 'Câmera na mão — tour pelo estúdio', audio: 'Aqui você vê todo o processo, do início ao fim.' },
      { scene: 3, visual: 'Equipe reunida, sorrindo', audio: '"Cada detalhe é pensado para você. Esse é o nosso compromisso."' },
    ],
    caption: 'Tudo isso pra te entregar o melhor conteúdo 💜 Qual parte te surpreendeu?',
    hashtags: '#bastidores #producaodeconteudo #vidadeagencia #bastidoresdaproducao',
  },
  {
    id: 's3',
    title: 'Receita Rápida: Brigadeiro Gourmet em 10 Minutos',
    theme: 'Tutorial · Reels',
    sentAt: '18 Fev',
    status: 'aprovado',
    feedback: undefined,
    body: [
      { scene: 1, visual: 'Mesa farta com ingredientes — câmera de cima (flat lay)', audio: '"Brigadeiro gourmet em 10 minutos? Sim, é possível!"' },
      { scene: 2, visual: 'Mãos misturando na panela — close', audio: 'Passo 1: misture o leite condensado com o cacau em pó em fogo baixo.' },
      { scene: 3, visual: 'Enrolando os brigadeiros em câmera lenta', audio: 'O segredo está no ponto: quando desgrudar da panela, está no lugar certo.' },
    ],
    caption: 'Qual sabor de brigadeiro você quer aprender a fazer? Comenta aqui! 🍫',
    hashtags: '#confeitaria #brigadeiro #receitarapida #docesgourmet',
  },
];

// ─────────────────────────────────────────────
// Portal video type + mock data
// ─────────────────────────────────────────────
interface PortalVideo {
  id: string;
  title: string;
  type: string;
  duration: string;
  sentAt: string;
  status: ReviewStatus;
  rating?: number;
  feedback?: string;
}

const MOCK_VIDEOS: PortalVideo[] = [
  { id: 'v1', title: '5 Erros que Destroem Seu Resultado', type: 'Reels', duration: '0:58', sentAt: '24 Fev', status: 'aguardando' },
  { id: 'v2', title: 'Bastidores: Um Dia na Nossa Produção',  type: 'Carrossel', duration: '1:22', sentAt: '22 Fev', status: 'aprovado', rating: 5 },
  { id: 'v3', title: 'Receita Rápida: Brigadeiro Gourmet',   type: 'Reels',     duration: '0:47', sentAt: '19 Fev', status: 'alteracao', feedback: 'O áudio ficou um pouco baixo no começo. Por favor ajustar a partir dos 3 segundos.' },
];

// ─────────────────────────────────────────────
// Production stepper
// ─────────────────────────────────────────────
const PRODUCTION_STAGES = ['Briefing', 'Roteirização', 'Aprovação', 'Gravação', 'Edição', 'Pronto'] as const;
const CURRENT_STAGE_IDX = 4;

const ProductionStepper: React.FC = () => (
  <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
    <div className="px-6 py-5 border-b border-gray-800">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status Atual</p>
      <h2 className="text-base font-black text-white mt-0.5">Produção do Pacote</h2>
    </div>
    <div className="px-6 py-6">
      <div className="flex items-start">
        {PRODUCTION_STAGES.map((stage, idx) => {
          const isCompleted = idx < CURRENT_STAGE_IDX;
          const isCurrent   = idx === CURRENT_STAGE_IDX;
          return (
            <React.Fragment key={stage}>
              <div className="flex flex-col items-center flex-shrink-0 w-10 sm:w-14">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                  isCompleted ? 'bg-violet-600 border-violet-500 text-white'
                  : isCurrent ? 'bg-gray-950 border-violet-500 text-violet-400 shadow-lg shadow-violet-500/30 animate-pulse'
                  : 'bg-gray-950 border-gray-700 text-gray-600'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={`mt-2 text-[8px] sm:text-[9px] font-black text-center leading-tight ${
                  isCurrent ? 'text-violet-400' : isCompleted ? 'text-gray-400' : 'text-gray-600'
                }`}>{stage}</span>
              </div>
              {idx < PRODUCTION_STAGES.length - 1 && (
                <div className={`flex-1 h-0.5 mt-3.5 sm:mt-4 transition-colors ${idx < CURRENT_STAGE_IDX ? 'bg-violet-600' : 'bg-gray-800'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse flex-shrink-0" />
        <div>
          <p className="text-sm font-black text-violet-300">Etapa atual: {PRODUCTION_STAGES[CURRENT_STAGE_IDX]}</p>
          <p className="text-xs text-gray-500 mt-0.5">Seus vídeos estão sendo editados pela equipe. Previsão: 3 dias úteis.</p>
        </div>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Achievements
// ─────────────────────────────────────────────
const ACHIEVEMENTS = [
  { icon: <Flame className="w-5 h-5" />,      iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',   hover: 'hover:border-amber-700/50',   value: '30',   label: 'Vídeos Produzidos' },
  { icon: <TrendingUp className="w-5 h-5" />, iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', hover: 'hover:border-emerald-700/50', value: '+15%', label: 'Crescimento no Instagram' },
  { icon: <Trophy className="w-5 h-5" />,     iconBg: 'bg-violet-500/10 border-violet-500/20 text-violet-400', hover: 'hover:border-violet-700/50',  value: '10k',  label: 'Views no último Reels' },
] as const;

const AchievementsGrid: React.FC = () => (
  <section>
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Marcos da Nossa Parceria</p>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {ACHIEVEMENTS.map(a => (
        <div key={a.label} className={`bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3 transition-colors ${a.hover}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${a.iconBg}`}>{a.icon}</div>
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
// Pending actions
// ─────────────────────────────────────────────
const PENDING_ACTIONS = [
  { bg: 'bg-amber-500/10 border-amber-500/20', icon: 'text-amber-400', text: 'text-amber-300', title: '2 Roteiros aguardando sua aprovação', sub: 'Prazo: até 28 Fev' },
  { bg: 'bg-red-500/10 border-red-500/20',     icon: 'text-red-400',   text: 'text-red-300',   title: 'Fatura Fev/2026 em aberto',          sub: 'Vencimento: 01 Mar' },
];

const PendingActions: React.FC = () => (
  <section>
    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4">Ações Pendentes</p>
    <div className="space-y-2">
      {PENDING_ACTIONS.map(action => (
        <div key={action.title} className={`flex items-center gap-4 p-4 rounded-2xl border ${action.bg}`}>
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
// Star Rating
// ─────────────────────────────────────────────
interface StarRatingProps { value: number; onChange: (v: number) => void; readonly?: boolean; }

const StarRating: React.FC<StarRatingProps> = ({ value, onChange, readonly }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          disabled={readonly}
          onClick={() => !readonly && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className="transition-transform hover:scale-110 disabled:cursor-default"
        >
          <Star
            className="w-5 h-5"
            style={{
              fill:   n <= (hovered || value) ? '#f59e0b' : 'transparent',
              stroke: n <= (hovered || value) ? '#f59e0b' : '#4b5563',
            }}
          />
        </button>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// Script Review Modal
// ─────────────────────────────────────────────
interface ScriptReviewModalProps {
  script: PortalScript;
  onClose: () => void;
  onApprove: (id: string) => void;
  onRequestChange: (id: string, text: string) => void;
}

const ScriptReviewModal: React.FC<ScriptReviewModalProps> = ({ script, onClose, onApprove, onRequestChange }) => {
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [sent, setSent]                 = useState(false);

  const cfg = REVIEW_STATUS_CONFIG[script.status];

  const handleApprove = () => { onApprove(script.id); onClose(); };
  const handleSendFeedback = () => {
    if (!feedbackText.trim()) return;
    onRequestChange(script.id, feedbackText.trim());
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 animate-in slide-in-from-bottom-4 duration-300">

      {/* ── Modal header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-gray-800 bg-gray-950/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/20">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white leading-tight line-clamp-1">{script.title}</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">{script.theme} · Enviado em {script.sentAt}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg border hidden sm:inline-flex ${cfg.badge}`}>
            {cfg.label}
          </span>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-xl text-gray-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-8 max-w-3xl mx-auto w-full">

        {/* Approved feedback block */}
        {script.status === 'aprovado' && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-sm font-bold text-emerald-300">Roteiro aprovado. Obrigado pelo feedback!</p>
          </div>
        )}

        {/* Script body */}
        <div className="space-y-6">
          {script.body.map(scene => (
            <div key={scene.scene} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-violet-600/20 text-violet-400 text-[10px] font-black flex items-center justify-center border border-violet-500/30">
                  {scene.scene}
                </span>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Cena {scene.scene}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">🎥 Visual</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{scene.visual}</p>
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">🎙️ Áudio / Texto</p>
                  <p className="text-sm text-gray-200 italic leading-relaxed">&ldquo;{scene.audio}&rdquo;</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Caption + Hashtags */}
        <div className="space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">📝 Legenda</p>
            <p className="text-sm text-gray-200 leading-relaxed">{script.caption}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2"># Hashtags</p>
            <p className="text-sm text-violet-300 font-bold">{script.hashtags}</p>
          </div>
        </div>

        {/* Bottom spacer for sticky footer */}
        <div className="h-32" />
      </div>

      {/* ── Sticky footer ── */}
      {script.status === 'aguardando' && (
        <div className="flex-shrink-0 border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm px-4 sm:px-8 py-4">
          <div className="max-w-3xl mx-auto space-y-3">
            {!feedbackMode ? (
              <div className="flex gap-3">
                <button
                  onClick={() => setFeedbackMode(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-orange-500/40 text-orange-300 text-sm font-black hover:bg-orange-500/10 transition-all"
                >
                  <MessageSquare className="w-4 h-4" /> Solicitar Alteração
                </button>
                <button
                  onClick={handleApprove}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.01] active:scale-100"
                >
                  <ThumbsUp className="w-4 h-4" /> Aprovar Roteiro
                </button>
              </div>
            ) : (
              <div className="space-y-3 animate-in fade-in duration-200">
                <textarea
                  autoFocus
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Descreva o que deve ser alterado…"
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none transition-all"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => { setFeedbackMode(false); setFeedbackText(''); }}
                    className="px-4 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-xs font-black hover:bg-gray-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSendFeedback}
                    disabled={!feedbackText.trim() || sent}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sent ? <><Check className="w-4 h-4" /> Enviado!</> : <><Send className="w-4 h-4" /> Enviar Feedback</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alteracao footer */}
      {script.status === 'alteracao' && script.feedback && (
        <div className="flex-shrink-0 border-t border-gray-800 bg-gray-950/95 backdrop-blur-sm px-4 sm:px-8 py-4">
          <div className="max-w-3xl mx-auto flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <MessageSquare className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Seu feedback</p>
              <p className="text-sm text-gray-300">{script.feedback}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Roteiros tab
// ─────────────────────────────────────────────
const PortalRoteirosTab: React.FC = () => {
  const [scripts, setScripts]       = useState<PortalScript[]>(MOCK_SCRIPTS);
  const [openScript, setOpenScript] = useState<PortalScript | null>(null);

  const handleApprove = (id: string) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, status: 'aprovado' } : s));
  };

  const handleRequestChange = (id: string, text: string) => {
    setScripts(prev => prev.map(s => s.id === id ? { ...s, status: 'alteracao', feedback: text } : s));
  };

  const pendingCount = scripts.filter(s => s.status === 'aguardando').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white">Roteiros para Revisão</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {pendingCount > 0 ? `${pendingCount} aguardando sua aprovação` : 'Todos os roteiros foram revisados'}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Script cards */}
      <div className="space-y-3">
        {scripts.map(script => {
          const cfg = REVIEW_STATUS_CONFIG[script.status];
          return (
            <button
              key={script.id}
              onClick={() => setOpenScript(script)}
              className="w-full text-left bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-violet-700/60 hover:bg-gray-900/80 transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-black text-white leading-tight group-hover:text-violet-300 transition-colors line-clamp-2">
                    {script.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{script.theme} · Enviado em {script.sentAt}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-violet-400 transition-colors" />
                </div>
              </div>
              {script.feedback && (
                <div className="mt-3 flex items-start gap-2 text-xs text-gray-400 bg-orange-500/5 border border-orange-500/15 rounded-xl px-3 py-2">
                  <MessageSquare className="w-3 h-3 text-orange-400 flex-shrink-0 mt-0.5" />
                  <p className="line-clamp-1">{script.feedback}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Modal */}
      {openScript && (
        <ScriptReviewModal
          script={scripts.find(s => s.id === openScript.id) ?? openScript}
          onClose={() => setOpenScript(null)}
          onApprove={handleApprove}
          onRequestChange={handleRequestChange}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Videos tab
// ─────────────────────────────────────────────
const PortalVideosTab: React.FC = () => {
  const [videos, setVideos]                     = useState<PortalVideo[]>(MOCK_VIDEOS);
  const [feedbackOpen, setFeedbackOpen]          = useState<string | null>(null);
  const [feedbackTexts, setFeedbackTexts]        = useState<Record<string, string>>({});
  const [feedbackSent, setFeedbackSent]          = useState<string | null>(null);

  const handleApprove = (id: string) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, status: 'aprovado', rating: v.rating ?? 0 } : v));
  };

  const handleRate = (id: string, rating: number) => {
    setVideos(prev => prev.map(v => v.id === id ? { ...v, rating } : v));
  };

  const handleSendFeedback = (id: string) => {
    const text = feedbackTexts[id]?.trim();
    if (!text) return;
    setVideos(prev => prev.map(v => v.id === id ? { ...v, status: 'alteracao', feedback: text } : v));
    setFeedbackSent(id);
    setTimeout(() => { setFeedbackSent(null); setFeedbackOpen(null); }, 1800);
  };

  const pendingCount = videos.filter(v => v.status === 'aguardando').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-white">Vídeos para Revisão</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {pendingCount > 0 ? `${pendingCount} aguardando sua aprovação` : 'Todos os vídeos foram revisados'}
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Video cards */}
      <div className="space-y-4">
        {videos.map(video => {
          const cfg = REVIEW_STATUS_CONFIG[video.status];
          const isFeedbackOpen = feedbackOpen === video.id;

          return (
            <div
              key={video.id}
              className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition-all"
            >
              {/* ── Player placeholder ── */}
              <div className="relative bg-gray-950 aspect-video flex items-center justify-center border-b border-gray-800 group cursor-pointer">
                {/* Fake thumbnail gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-900/30 to-gray-950" />
                {/* Play button */}
                <div className="relative z-10 w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-white/20 transition-all shadow-2xl">
                  <Play className="w-6 h-6 text-white ml-1" style={{ fill: 'white' }} />
                </div>
                {/* Duration badge */}
                <span className="absolute bottom-3 right-3 text-[10px] font-black px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm">
                  {video.duration}
                </span>
                {/* Type badge */}
                <span className="absolute top-3 left-3 text-[10px] font-black px-2 py-0.5 rounded-md bg-violet-600/80 text-white backdrop-blur-sm">
                  {video.type}
                </span>
              </div>

              {/* ── Card body ── */}
              <div className="p-5 space-y-4">
                {/* Title + status */}
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-black text-white leading-tight">{video.title}</h3>
                  <span className={`flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-md border ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>

                <p className="text-xs text-gray-500">Enviado em {video.sentAt}</p>

                {/* Feedback block (alteracao) */}
                {video.status === 'alteracao' && video.feedback && (
                  <div className="flex items-start gap-2 text-xs text-gray-300 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-3">
                    <MessageSquare className="w-3.5 h-3.5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <p>{video.feedback}</p>
                  </div>
                )}

                {/* Approved: star rating */}
                {video.status === 'aprovado' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <p className="text-xs font-bold text-emerald-300 flex-1">Aprovado!</p>
                    </div>
                    <div className="flex items-center gap-3 px-1">
                      <p className="text-xs text-gray-500 font-bold">Avaliação:</p>
                      <StarRating
                        value={video.rating ?? 0}
                        onChange={rating => handleRate(video.id, rating)}
                        readonly={!!video.rating && video.rating > 0}
                      />
                      {video.rating && video.rating > 0 && (
                        <span className="text-xs font-black text-amber-400">{video.rating}/5</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Pending: action buttons */}
                {video.status === 'aguardando' && !isFeedbackOpen && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFeedbackOpen(video.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-orange-500/40 text-orange-300 text-xs font-black hover:bg-orange-500/10 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Solicitar Alteração
                    </button>
                    <button
                      onClick={() => handleApprove(video.id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> Aprovar
                    </button>
                  </div>
                )}

                {/* Feedback textarea */}
                {isFeedbackOpen && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <textarea
                      autoFocus
                      value={feedbackTexts[video.id] ?? ''}
                      onChange={e => setFeedbackTexts(prev => ({ ...prev, [video.id]: e.target.value }))}
                      placeholder="Descreva o que deve ser alterado…"
                      rows={3}
                      className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 resize-none transition-all"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => { setFeedbackOpen(null); setFeedbackTexts(prev => ({ ...prev, [video.id]: '' })); }}
                        className="px-4 py-2 rounded-xl border border-gray-700 text-gray-400 text-xs font-black hover:bg-gray-800 transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSendFeedback(video.id)}
                        disabled={!feedbackTexts[video.id]?.trim() || feedbackSent === video.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-black transition-all disabled:opacity-50"
                      >
                        {feedbackSent === video.id
                          ? <><Check className="w-3.5 h-3.5" /> Enviado!</>
                          : <><Send className="w-3.5 h-3.5" /> Enviar Feedback</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Reuniões tab (read-only portal view)
// ─────────────────────────────────────────────
interface PortalMeetingNextStep {
  id: string;
  text: string;
  assignedTo: 'agencia' | 'cliente';
  done: boolean;
}

interface PortalMeeting {
  id: string;
  title: string;
  date: string;
  executiveSummary: string;
  decisions: string[];
  nextSteps: PortalMeetingNextStep[];
  createdAt: number;
}

const PortalReunioeTab: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [meetings] = useState<PortalMeeting[]>(() => {
    try {
      const s = localStorage.getItem(`creator_flow_meetings_${clientId}`);
      return s ? JSON.parse(s) : [];
    } catch { return []; }
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-');
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  };

  if (meetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-200">
        <div className="text-4xl mb-4">🤝</div>
        <h2 className="text-base font-black text-gray-400 mb-1">Nenhuma reunião registrada</h2>
        <p className="text-sm text-gray-600">Os resumos das suas reuniões aparecerão aqui assim que a equipe os registrar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Header */}
      <div>
        <h2 className="text-base font-black text-white">Resumos de Reuniões</h2>
        <p className="text-xs text-gray-500 mt-0.5">{meetings.length} reunião{meetings.length > 1 ? 'ões' : ''} registrada{meetings.length > 1 ? 's' : ''}</p>
      </div>

      {/* Meeting cards */}
      <div className="space-y-3">
        {meetings.map(meeting => {
          const isExpanded  = expandedId === meeting.id;
          const clientSteps = meeting.nextSteps.filter(s => s.assignedTo === 'cliente');
          const agencySteps = meeting.nextSteps.filter(s => s.assignedTo === 'agencia');

          return (
            <div key={meeting.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition-all">

              {/* Card header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-base select-none">
                    🤝
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">{meeting.title}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {formatDate(meeting.date)}
                      {clientSteps.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 text-[10px] font-black border border-emerald-500/25">
                          {clientSteps.length} tarefa{clientSteps.length > 1 ? 's' : ''} sua{clientSteps.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Expanded body */}
              {isExpanded && (
                <div className="border-t border-gray-800 px-5 py-5 space-y-6">

                  {/* 1. Resumo Executivo */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> 📝 Resumo Executivo
                    </p>
                    <p className="text-sm text-gray-300 leading-relaxed">{meeting.executiveSummary}</p>
                  </div>

                  {/* 2. Decisões Tomadas */}
                  {meeting.decisions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
                        <Users className="w-3 h-3" /> 🤝 Decisões Tomadas
                      </p>
                      <ul className="space-y-2">
                        {meeting.decisions.map((d, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                            <span className="w-4 h-4 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5 border border-violet-500/25">
                              {i + 1}
                            </span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 3. Próximos Passos */}
                  {meeting.nextSteps.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> ✅ Próximos Passos
                      </p>
                      <div className="space-y-4">

                        {/* Client tasks — highlighted */}
                        {clientSteps.length > 0 && (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-[10px] font-black text-emerald-400 mb-2.5">👤 Suas Tarefas</p>
                            <ul className="space-y-2">
                              {clientSteps.map(s => (
                                <li key={s.id} className="flex items-start gap-2 text-sm text-emerald-200">
                                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                  {s.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Agency tasks */}
                        {agencySteps.length > 0 && (
                          <div>
                            <p className="text-[10px] font-black text-violet-400 mb-2.5">🏢 Equipe CreatorFlow</p>
                            <ul className="space-y-2">
                              {agencySteps.map(s => (
                                <li key={s.id} className="flex items-start gap-2 text-sm text-gray-400">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-violet-500 flex-shrink-0 mt-0.5" />
                                  {s.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Placeholder for remaining tabs
// ─────────────────────────────────────────────
const TabPlaceholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in duration-200">
    <div className="text-4xl mb-4">🚧</div>
    <h2 className="text-base font-black text-gray-400 mb-1">Em breve</h2>
    <p className="text-sm text-gray-600">Esta seção está sendo preparada pela equipe.</p>
  </div>
);

// ─────────────────────────────────────────────
// Portal nav tabs config
// ─────────────────────────────────────────────
const PORTAL_TABS: { id: PortalTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard',  label: 'Dashboard',  icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
  { id: 'roteiros',   label: 'Roteiros',   icon: <FileText        className="w-3.5 h-3.5" /> },
  { id: 'videos',     label: 'Vídeos',     icon: <Video           className="w-3.5 h-3.5" /> },
  { id: 'reunioes',   label: 'Reuniões',   icon: <Users           className="w-3.5 h-3.5" /> },
  { id: 'financeiro', label: 'Financeiro', icon: <DollarSign      className="w-3.5 h-3.5" /> },
];

// ─────────────────────────────────────────────
// ClientPortalView (root)
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
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Sair
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white select-none">
              CF
            </div>
            <span className="text-xs font-black text-gray-500 hidden sm:block tracking-widest uppercase">CreatorFlow</span>
          </div>
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

          {activeTab === 'roteiros' && <PortalRoteirosTab />}

          {activeTab === 'videos' && <PortalVideosTab />}

          {activeTab === 'reunioes' && <PortalReunioeTab clientId={client.id} />}

          {activeTab === 'financeiro' && <TabPlaceholder />}

        </div>
      </main>
    </div>
  );
};

export default ClientPortalView;
