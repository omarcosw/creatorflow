'use client';

import React, { useState } from 'react';
import { X, Sparkles, PenLine, Loader2, User, Target, Megaphone } from 'lucide-react';
import { Client } from '@/types';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface ClientOnboardingModalProps {
  isOpen: boolean;
  onSave: (client: Client) => void;
  onClose: () => void;
}

// ─────────────────────────────────────────────
// Form draft
// ─────────────────────────────────────────────
interface FormDraft {
  brandName: string;
  niche: string;
  subniche: string;
  idealClient: string;
  mainPains: string;
  mainDesires: string;
  voiceTone: Client['voiceTone'];
  visualStyle: string;
  defaultCta: string;
}

const INITIAL_DRAFT: FormDraft = {
  brandName: '',
  niche: '',
  subniche: '',
  idealClient: '',
  mainPains: '',
  mainDesires: '',
  voiceTone: 'Descontraído',
  visualStyle: '',
  defaultCta: '',
};

// Placeholder preenchido pela IA simulada
const AI_MOCK: FormDraft = {
  brandName: 'Studio Nova',
  niche: 'Gastronomia',
  subniche: 'Confeitaria Artesanal',
  idealClient: 'Mulheres de 25–40 anos que valorizam produtos artesanais e presentes personalizados',
  mainPains: 'Dificuldade de encontrar confeiteiros confiáveis para datas comemorativas',
  mainDesires: 'Confeitaria pontual, visual profissional para redes sociais e qualidade consistente',
  voiceTone: 'Descontraído',
  visualStyle: 'Tons pastel, iluminação natural, styling clean e feminino',
  defaultCta: 'Encomende agora e surpreenda quem você ama',
};

const VOICE_TONE_OPTIONS: Client['voiceTone'][] = [
  'Autoritário',
  'Descontraído',
  'Educacional',
  'Agressivo',
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const ClientOnboardingModal: React.FC<ClientOnboardingModalProps> = ({
  isOpen,
  onSave,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draft, setDraft] = useState<FormDraft>(INITIAL_DRAFT);

  if (!isOpen) return null;

  const handleAnalyze = () => {
    if (!aiTranscript.trim() || isAnalyzing) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setDraft(AI_MOCK);
      setIsAnalyzing(false);
      setActiveTab('manual');
    }, 2000);
  };

  const handleClose = () => {
    setDraft(INITIAL_DRAFT);
    setAiTranscript('');
    setIsAnalyzing(false);
    setActiveTab('ai');
    onClose();
  };

  const handleSave = () => {
    if (!draft.brandName.trim()) return;
    onSave({
      id: crypto.randomUUID(),
      brandName: draft.brandName.trim(),
      niche: draft.niche.trim(),
      subniche: draft.subniche.trim(),
      idealClient: draft.idealClient.trim(),
      mainPains: draft.mainPains.trim(),
      mainDesires: draft.mainDesires.trim(),
      voiceTone: draft.voiceTone,
      visualStyle: draft.visualStyle.trim(),
      defaultCta: draft.defaultCta.trim(),
      createdAt: Date.now(),
    });
    handleClose();
  };

  const set = (key: keyof FormDraft, value: string) =>
    setDraft(p => ({ ...p, [key]: value }));

  const inputCls =
    'w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-zinc-400';
  const textareaCls = `${inputCls} resize-none`;
  const labelCls = 'text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block';

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 w-full max-w-xl rounded-3xl shadow-2xl border border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-zinc-800">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-900/20 text-emerald-400 rounded-xl border border-emerald-900/40">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">
                  Novo Cliente
                </h2>
                <p className="text-xs text-zinc-400">Onboarding & Briefing Estratégico</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-zinc-800/80 rounded-xl">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'ai'
                  ? 'bg-zinc-900 text-violet-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Extrair com IA
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'manual'
                  ? 'bg-zinc-900 text-violet-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <PenLine className="w-3.5 h-3.5" /> Preenchimento Manual
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Tab: Extrair com IA */}
          {activeTab === 'ai' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cole abaixo a transcrição da sua reunião de briefing. A IA vai identificar os dados relevantes e preencher o formulário automaticamente.
              </p>
              <div>
                <label className={labelCls}>Transcrição da Reunião / Call</label>
                <textarea
                  autoFocus
                  value={aiTranscript}
                  onChange={e => setAiTranscript(e.target.value)}
                  placeholder="Cole aqui a transcrição bruta da call, mensagens do WhatsApp, anotações da reunião…"
                  className={`${textareaCls} h-48`}
                />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!aiTranscript.trim() || isAnalyzing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analisando transcrição…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analisar e Preencher
                  </>
                )}
              </button>
              {isAnalyzing && (
                <p className="text-xs text-zinc-400 text-center animate-pulse">
                  Extraindo identidade, público-alvo e comunicação da transcrição…
                </p>
              )}
            </div>
          )}

          {/* Tab: Preenchimento Manual */}
          {activeTab === 'manual' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Identidade */}
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                  <User className="w-3.5 h-3.5 text-emerald-500" /> Identidade
                </p>
                <div>
                  <label className={labelCls}>Nome do Cliente / Marca *</label>
                  <input
                    autoFocus
                    type="text"
                    value={draft.brandName}
                    onChange={e => set('brandName', e.target.value)}
                    placeholder="Ex: Studio Nova, Padaria Dois Irmãos"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Nicho</label>
                    <input
                      type="text"
                      value={draft.niche}
                      onChange={e => set('niche', e.target.value)}
                      placeholder="Ex: Gastronomia"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Subnicho</label>
                    <input
                      type="text"
                      value={draft.subniche}
                      onChange={e => set('subniche', e.target.value)}
                      placeholder="Ex: Confeitaria"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              {/* O Alvo */}
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                  <Target className="w-3.5 h-3.5 text-sky-500" /> O Alvo
                </p>
                <div>
                  <label className={labelCls}>Cliente Ideal</label>
                  <textarea
                    value={draft.idealClient}
                    onChange={e => set('idealClient', e.target.value)}
                    placeholder="Ex: Mulheres de 25–40 anos que valorizam produtos artesanais…"
                    className={`${textareaCls} h-20`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Maiores Dores</label>
                  <textarea
                    value={draft.mainPains}
                    onChange={e => set('mainPains', e.target.value)}
                    placeholder="Ex: Dificuldade de encontrar fornecedores confiáveis…"
                    className={`${textareaCls} h-20`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Maiores Desejos</label>
                  <textarea
                    value={draft.mainDesires}
                    onChange={e => set('mainDesires', e.target.value)}
                    placeholder="Ex: Visibilidade nas redes, crescimento orgânico…"
                    className={`${textareaCls} h-20`}
                  />
                </div>
              </div>

              <div className="h-px bg-zinc-800" />

              {/* Comunicação */}
              <div className="space-y-4">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-400">
                  <Megaphone className="w-3.5 h-3.5 text-amber-500" /> Comunicação
                </p>
                <div>
                  <label className={labelCls}>Tom de Voz</label>
                  <div className="grid grid-cols-2 gap-2">
                    {VOICE_TONE_OPTIONS.map(tone => (
                      <button
                        key={tone}
                        onClick={() => set('voiceTone', tone)}
                        className={`py-2.5 px-3 rounded-xl border-2 text-sm font-bold transition-all ${
                          draft.voiceTone === tone
                            ? 'border-emerald-500 bg-emerald-900/20 text-emerald-300'
                            : 'border-zinc-800 text-zinc-400 hover:border-emerald-700'
                        }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Estilo Visual Principal</label>
                  <input
                    type="text"
                    value={draft.visualStyle}
                    onChange={e => set('visualStyle', e.target.value)}
                    placeholder="Ex: Minimalista, tons neutros, iluminação natural"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>CTA Padrão</label>
                  <input
                    type="text"
                    value={draft.defaultCta}
                    onChange={e => set('defaultCta', e.target.value)}
                    placeholder="Ex: Clique e conheça nossa linha completa!"
                    className={inputCls}
                  />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 flex gap-3 border-t border-zinc-800 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-5 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-bold text-sm hover:bg-zinc-800 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!draft.brandName.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Salvar Cliente
          </button>
        </div>

      </div>
    </div>
  );
};

export default ClientOnboardingModal;
