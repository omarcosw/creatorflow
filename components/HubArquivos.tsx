'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  HardDrive,
  Film,
  ChevronRight,
  ChevronLeft,
  X,
  Calendar,
  StickyNote,
  Check,
  Archive,
  Link,
  FileText,
  Camera,
  Aperture,
  Mic,
  Lightbulb,
  AlertTriangle,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Client, HDD, Recording, StudioProfile } from '@/types';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface HubArquivosProps {
  hdds: HDD[];
  recordings: Recording[];
  studioProfile: StudioProfile;
  onSaveHDD: (hdd: HDD) => void;
  onDeleteHDD: (id: string) => void;
  onSaveRecording: (recording: Recording) => void;
  onDeleteRecording: (id: string) => void;
  onBack: () => void;
}

// ─────────────────────────────────────────────
// Quiz state — maps 1:1 to Recording fields
// ─────────────────────────────────────────────
interface QuizForm {
  // Passo 0 — O que foi gravado
  title: string;
  clientName: string;
  clientId: string;   // ID do cliente vinculado (opcional)
  summary: string;
  // Passo 1 — Quando
  recordedAt: string;
  // Passo 2 — Roteiro
  scriptLocation: 'external' | 'creatorflow' | null; // null = sem roteiro
  scriptUrl: string;
  scriptId: string;
  // Passo 3 — HDs
  selectedHddIds: string[];
  // Passo 4 — Câmeras e mídia
  mediaDevices: string[];
  cameraModels: string;
  otherEquipmentDetails: string;
  // Passo 5 — Obs. técnicas
  technicalNotes: string;
  // Passo 6 — Pendências
  hasPendingTakes: boolean | null; // null = não respondido ainda
  pendingTakesDescription: string;
}

const INITIAL_FORM: QuizForm = {
  title: '',
  clientName: '',
  clientId: '',
  summary: '',
  recordedAt: new Date().toISOString().split('T')[0],
  scriptLocation: null,
  scriptUrl: '',
  scriptId: '',
  selectedHddIds: [],
  mediaDevices: [],
  cameraModels: '',
  otherEquipmentDetails: '',
  technicalNotes: '',
  hasPendingTakes: null,
  pendingTakesDescription: '',
};

const TOTAL_STEPS = 8; // 0 → 7

const STEP_LABELS = [
  'O que foi gravado?',
  'Quando foi gravado?',
  'Tem roteiro vinculado?',
  'Onde está salvo?',
  'Câmeras e Mídia',
  'Obs. Técnicas',
  'Faltou gravar algo?',
  'Resumo Final',
];

const STEP_ICONS = ['🎬', '📅', '📋', '💾', '🎥', '📝', '⚠️', '✅'];

const DEVICE_LABELS: Record<string, string> = {
  camera_a: 'Câm-A',
  camera_b: 'Câm-B',
  drone: 'Drone',
  audio_externo: 'Áudio Ext.',
  outros: 'Outros',
};

const DEVICE_EMOJIS: Record<string, string> = {
  camera_a: '📷',
  camera_b: '📷',
  drone: '🚁',
  audio_externo: '🎙️',
  outros: '🎛️',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const HubArquivos: React.FC<HubArquivosProps> = ({
  hdds,
  recordings,
  studioProfile,
  onSaveHDD,
  onDeleteHDD,
  onSaveRecording,
  onDeleteRecording,
  onBack,
}) => {
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [quizForm, setQuizForm] = useState<QuizForm>(INITIAL_FORM);
  const [isAddHDDOpen, setIsAddHDDOpen] = useState(false);
  const [newHDDName, setNewHDDName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  // ── Clients — read from shared localStorage (same key as ClientsHub) ──
  const [clients] = useState<Client[]>(() => {
    try {
      const stored = localStorage.getItem('creator_flow_clients');
      return stored ? (JSON.parse(stored) as Client[]) : [];
    } catch { return []; }
  });

  // ── Quiz controls ──────────────────────────
  const openQuiz = () => {
    setQuizForm({ ...INITIAL_FORM, recordedAt: new Date().toISOString().split('T')[0] });
    setCurrentStep(0);
    setIsQuizOpen(true);
  };

  const closeQuiz = () => setIsQuizOpen(false);

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) setCurrentStep(p => p + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(p => p - 1);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: return quizForm.title.trim().length > 0;
      case 1: return quizForm.recordedAt.trim().length > 0;
      case 2: return true;  // roteiro é opcional
      case 3: return quizForm.selectedHddIds.length > 0;
      case 4: return true;  // mídia é opcional
      case 5: return true;  // obs técnicas são opcionais
      case 6: return quizForm.hasPendingTakes !== null; // obrigatório Sim ou Não
      default: return true;
    }
  };

  const saveRecording = () => {
    const linkedClient = clients.find(c => c.id === quizForm.clientId);
    const rec: Recording = {
      id: crypto.randomUUID(),
      title: quizForm.title.trim(),
      clientName: linkedClient?.brandName ?? (quizForm.clientName.trim() || undefined),
      clientId: quizForm.clientId || undefined,
      summary: quizForm.summary.trim() || undefined,
      recordedAt: quizForm.recordedAt,
      scriptLocation: quizForm.scriptLocation ?? undefined,
      scriptUrl: quizForm.scriptUrl.trim() || undefined,
      scriptId: quizForm.scriptId.trim() || undefined,
      hddIds: quizForm.selectedHddIds,
      mediaDevices: quizForm.mediaDevices.length > 0 ? quizForm.mediaDevices : undefined,
      cameraModels: quizForm.cameraModels.trim() || undefined,
      otherEquipmentDetails: quizForm.otherEquipmentDetails.trim() || undefined,
      technicalNotes: quizForm.technicalNotes.trim() || undefined,
      hasPendingTakes: quizForm.hasPendingTakes ?? undefined,
      pendingTakesDescription: quizForm.pendingTakesDescription.trim() || undefined,
      createdAt: Date.now(),
    };
    onSaveRecording(rec);
    closeQuiz();
  };

  // ── Helpers ───────────────────────────────
  const toggleHDD = (id: string) =>
    setQuizForm(p => ({
      ...p,
      selectedHddIds: p.selectedHddIds.includes(id)
        ? p.selectedHddIds.filter(x => x !== id)
        : [...p.selectedHddIds, id],
    }));

  const toggleDevice = (id: string) =>
    setQuizForm(p => ({
      ...p,
      mediaDevices: p.mediaDevices.includes(id)
        ? p.mediaDevices.filter(x => x !== id)
        : [...p.mediaDevices, id],
    }));

  const getHDDNames = (ids: string[]) =>
    ids.map(id => hdds.find(h => h.id === id)?.name ?? 'HD Desconhecido').join(', ');

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const addHDD = () => {
    if (!newHDDName.trim()) return;
    onSaveHDD({ id: crypto.randomUUID(), name: newHDDName.trim(), addedAt: Date.now() });
    setNewHDDName('');
    setIsAddHDDOpen(false);
  };

  const hasInventory =
    studioProfile.equipment.cameras.length > 0 ||
    studioProfile.equipment.lenses.length > 0 ||
    studioProfile.equipment.audio.length > 0 ||
    studioProfile.equipment.lighting.length > 0;

  const renderEquipGroup = (
    label: string,
    icon: React.ReactNode,
    items: string[],
    emoji: string,
  ) => {
    if (items.length === 0) return null;
    return (
      <div key={label}>
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
          {icon} {label}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {items.map(name => {
            const sel = quizForm.mediaDevices.includes(name);
            return (
              <button
                key={name}
                onClick={() => toggleDevice(name)}
                className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                  sel
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? 'bg-violet-600 border-violet-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
                  {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className="text-base">{emoji}</span>
                <span className={`font-bold text-sm truncate flex-1 ${sel ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const isEmpty = recordings.length === 0 && hdds.length === 0;

  const filteredRecordings = [...recordings].reverse().filter(rec => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rec.title.toLowerCase().includes(q) ||
      (rec.clientName?.toLowerCase().includes(q) ?? false) ||
      (rec.summary?.toLowerCase().includes(q) ?? false) ||
      (rec.technicalNotes?.toLowerCase().includes(q) ?? false) ||
      (rec.cameraModels?.toLowerCase().includes(q) ?? false) ||
      (rec.otherEquipmentDetails?.toLowerCase().includes(q) ?? false) ||
      (rec.mediaDevices?.some(d => (DEVICE_LABELS[d] ?? d).toLowerCase().includes(q)) ?? false) ||
      rec.recordedAt.includes(q) ||
      rec.hddIds.some(id => (hdds.find(h => h.id === id)?.name ?? '').toLowerCase().includes(q))
    );
  });

  // ── Shared input classes ──────────────────
  const inputCls =
    'w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm';

  const labelCls = 'text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block';

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-300">

      {/* ══ Header ══ */}
      <header className="sticky top-0 z-10 px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 -ml-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-xl border border-violet-500/20">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                  Gestor de Acervo e HDs
                </h1>
                <p className="text-xs text-zinc-400 hidden sm:block">
                  {recordings.length} {recordings.length === 1 ? 'ingest' : 'ingests'} &middot; {hdds.length}{' '}
                  {hdds.length === 1 ? 'HD' : 'HDs'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={openQuiz}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/30 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-100"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nova Gravação (Ingest)</span>
            <span className="sm:hidden">Ingest</span>
          </button>
        </div>
      </header>

      {/* ══ Main ══ */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10">

          {/* Empty state */}
          {isEmpty && (
            <div className="rounded-3xl border-2 border-dashed border-violet-200 dark:border-violet-900/40 bg-violet-50/40 dark:bg-violet-950/10 p-10 text-center">
              <div className="text-5xl mb-4">💾</div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Seu acervo está vazio</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto mb-6">
                Cadastre seus HDs e registre seus primeiros ingests. Nunca mais perca rastro do seu material!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setIsAddHDDOpen(true)}
                  className="px-5 py-2.5 rounded-xl border border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 font-bold text-sm hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-all"
                >
                  💾 Adicionar Primeiro HD
                </button>
                <button
                  onClick={openQuiz}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-violet-500/20 hover:opacity-90 transition-all"
                >
                  🎬 Registrar Primeira Gravação
                </button>
              </div>
            </div>
          )}

          {/* ── Seção 1: Meus HDs ── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-violet-500" />
                <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Meus HDs</h2>
              </div>
              <button
                onClick={() => setIsAddHDDOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar HD
              </button>
            </div>

            {hdds.length === 0 ? (
              <button
                onClick={() => setIsAddHDDOpen(true)}
                className="w-full flex items-center justify-center gap-3 p-5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-500 transition-all group"
              >
                <HardDrive className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm">Cadastrar primeiro HD</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {hdds.map(hdd => {
                  const usedIn = recordings.filter(r => r.hddIds.includes(hdd.id)).length;
                  return (
                    <div key={hdd.id} className="group flex items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-violet-300 dark:hover:border-violet-800 transition-all">
                      <div className="w-10 h-10 flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 text-lg rounded-xl flex-shrink-0">💾</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{hdd.name}</p>
                        <p className="text-xs text-zinc-400">{usedIn} {usedIn === 1 ? 'ingest' : 'ingests'}</p>
                      </div>
                      <button
                        onClick={() => { if (confirm(`Remover "${hdd.name}"?`)) onDeleteHDD(hdd.id); }}
                        className="p-1.5 text-zinc-300 dark:text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setIsAddHDDOpen(true)}
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:border-violet-400 hover:text-violet-500 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-bold">Novo HD</span>
                </button>
              </div>
            )}
          </section>

          {/* ── Seção 2: Últimos Ingests ── */}
          {recordings.length > 0 && (
            <section>
              {/* Header + search bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Film className="w-4 h-4 text-violet-500" />
                  <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                    Últimos Ingests
                  </h2>
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {filteredRecordings.length}
                  </span>
                </div>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar por cliente, HD, equipamento, data…"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Cards */}
              {filteredRecordings.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Nenhum ingest encontrado para "{searchQuery}"</p>
                  <button onClick={() => setSearchQuery('')} className="mt-2 text-xs text-violet-600 dark:text-violet-400 font-bold hover:underline">
                    Limpar busca
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRecordings.map(rec => (
                    <div
                      key={rec.id}
                      onClick={() => setSelectedRecording(rec)}
                      className="group relative flex flex-col gap-3 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl hover:border-violet-300 dark:hover:border-violet-800 transition-all hover:shadow-lg cursor-pointer"
                    >
                      {/* Top row: badges + delete */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {rec.hasPendingTakes && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> Pendências
                            </span>
                          )}
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); if (confirm(`Excluir "${rec.title}"?`)) onDeleteRecording(rec.id); }}
                          className="p-1.5 text-zinc-300 dark:text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 -mr-1 -mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Title + optional subtitle */}
                      <div>
                        <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-tight">
                          {rec.clientName || rec.title}
                        </h3>
                        {rec.clientName && (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">{rec.title}</p>
                        )}
                      </div>

                      {/* Date + HD badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(rec.recordedAt)}
                        </span>
                        {rec.hddIds.map(id => {
                          const hdd = hdds.find(h => h.id === id);
                          if (!hdd) return null;
                          return (
                            <span key={id} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-full font-medium border border-violet-100 dark:border-violet-900/40">
                              💾 {hdd.name}
                            </span>
                          );
                        })}
                      </div>

                      {/* Device badges */}
                      {rec.mediaDevices && rec.mediaDevices.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {rec.mediaDevices.map(d => (
                            <span key={d} className="text-xs px-2 py-0.5 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 rounded-full font-medium border border-sky-100 dark:border-sky-900/40">
                              {DEVICE_EMOJIS[d] || '📷'} {DEVICE_LABELS[d] ?? d}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Technical notes preview */}
                      {rec.technicalNotes && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 line-clamp-1 flex items-center gap-1">
                          <StickyNote className="w-3 h-3 flex-shrink-0" />
                          {rec.technicalNotes}
                        </p>
                      )}

                      {/* "Ver detalhes" hint */}
                      <div className="absolute bottom-4 right-5 text-[10px] font-bold text-zinc-300 dark:text-zinc-700 opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest">
                        Ver detalhes →
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* ── FAB Mobile ── */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <button
          onClick={openQuiz}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-sm shadow-2xl shadow-violet-500/40 hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" /> Ingest
        </button>
      </div>

      {/* ══════════════════════════════════════
          MODAL: Cadastrar HD
      ══════════════════════════════════════ */}
      {isAddHDDOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">💾 Cadastrar HD</h3>
              <button onClick={() => setIsAddHDDOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nome do HD</label>
                <input
                  autoFocus type="text" value={newHDDName}
                  onChange={e => setNewHDDName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addHDD()}
                  placeholder="Ex: HD-01 Samsung T7 2TB"
                  className={inputCls}
                />
                <p className="text-xs text-zinc-400 mt-2">"SSD-02 Sandisk 1TB Vermelho" ou "HD Backup Escritório"</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsAddHDDOpen(false)} className="flex-1 px-4 py-3 text-zinc-500 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors">Cancelar</button>
                <button
                  onClick={addHDD} disabled={!newHDDName.trim()}
                  className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-violet-500/20 py-3 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Salvar HD
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL: Detalhes do Ingest
      ══════════════════════════════════════ */}
      {selectedRecording && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">

            {/* Header */}
            <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-violet-50 dark:bg-violet-900/20 text-lg rounded-xl flex-shrink-0">🎬</div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-white leading-tight truncate">
                      {selectedRecording.clientName || selectedRecording.title}
                    </h3>
                    {selectedRecording.clientName && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{selectedRecording.title}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecording(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedRecording.hasPendingTakes && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    Ingest com pendências de gravação
                    {selectedRecording.pendingTakesDescription && ` — ${selectedRecording.pendingTakesDescription}`}
                  </p>
                </div>
              )}
            </div>

            {/* Body (scrollable) */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

              {/* Datas e Sumário */}
              <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden text-sm">
                <div className="px-4 py-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 w-20 flex-shrink-0">Data</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">{formatDate(selectedRecording.recordedAt)}</span>
                </div>
                {selectedRecording.summary && (
                  <div className="px-4 py-3 flex items-start gap-2">
                    <FileText className="w-4 h-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 block mb-1">Resumo</span>
                      <p className="text-zinc-600 dark:text-zinc-400">{selectedRecording.summary}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* HDs */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-violet-500" /> Armazenamento
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedRecording.hddIds.map(id => {
                    const hdd = hdds.find(h => h.id === id);
                    return (
                      <span key={id} className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 rounded-xl font-medium border border-violet-100 dark:border-violet-900/40">
                        💾 {hdd?.name ?? 'HD Desconhecido'}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Roteiro */}
              {selectedRecording.scriptLocation && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-violet-500" /> Roteiro
                  </p>
                  {selectedRecording.scriptLocation === 'external' && selectedRecording.scriptUrl ? (
                    <a
                      href={selectedRecording.scriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline break-all"
                    >
                      <ExternalLink className="w-4 h-4 flex-shrink-0" />
                      {selectedRecording.scriptUrl}
                    </a>
                  ) : selectedRecording.scriptLocation === 'external' ? (
                    <p className="text-sm text-zinc-500">🔗 Link externo (sem URL registrada)</p>
                  ) : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">🗂️ Salvo no CreatorFlow</p>
                  )}
                </div>
              )}

              {/* Câmeras e Equipamentos */}
              {(selectedRecording.mediaDevices?.length || selectedRecording.cameraModels || selectedRecording.otherEquipmentDetails) && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-sky-500" /> Câmeras e Equipamentos
                  </p>
                  {selectedRecording.mediaDevices && selectedRecording.mediaDevices.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {selectedRecording.mediaDevices.map(d => (
                        <span key={d} className="text-sm px-3 py-1.5 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 rounded-xl font-medium border border-sky-100 dark:border-sky-900/40">
                          {DEVICE_EMOJIS[d] || '📷'} {DEVICE_LABELS[d] ?? d}
                        </span>
                      ))}
                    </div>
                  )}
                  {selectedRecording.cameraModels && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Modelos:</span>
                      {selectedRecording.cameraModels}
                    </p>
                  )}
                  {selectedRecording.otherEquipmentDetails && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Outros:</span>
                      {selectedRecording.otherEquipmentDetails}
                    </p>
                  )}
                </div>
              )}

              {/* Obs. Técnicas */}
              {selectedRecording.technicalNotes && (
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-amber-500" /> Obs. Técnicas
                  </p>
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 px-4 py-3">
                    <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-line">{selectedRecording.technicalNotes}</p>
                  </div>
                </div>
              )}

              {/* Status de Gravação */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Status de Gravação</p>
                {selectedRecording.hasPendingTakes === false && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm font-bold rounded-xl border border-emerald-100 dark:border-emerald-900/40">
                    ✅ Tudo gravado!
                  </span>
                )}
                {selectedRecording.hasPendingTakes === true && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm font-bold rounded-xl border border-amber-100 dark:border-amber-900/40">
                    ⚠️ Pendências registradas
                  </span>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex gap-3 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
              <button
                onClick={() => setSelectedRecording(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  if (confirm(`Excluir "${selectedRecording.title}"?`)) {
                    onDeleteRecording(selectedRecording.id);
                    setSelectedRecording(null);
                  }
                }}
                className="px-4 py-3 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/10 transition-all flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL: Quiz de Ingest (8 passos)
      ══════════════════════════════════════ */}
      {isQuizOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">

            {/* ── Quiz: Header (fixo) ── */}
            <div className="px-6 pt-6 pb-4 flex-shrink-0">
              {/* Barra de progresso */}
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
                />
              </div>

              {/* Indicadores de passo */}
              <div className="flex items-center gap-1 mb-4">
                {STEP_LABELS.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentStep
                        ? 'w-6 bg-violet-500'
                        : idx < currentStep
                        ? 'w-1.5 bg-violet-300 dark:bg-violet-700'
                        : 'w-1.5 bg-zinc-200 dark:bg-zinc-700'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1 block">
                    Passo {currentStep + 1} de {TOTAL_STEPS}
                  </span>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <span>{STEP_ICONS[currentStep]}</span>
                    {STEP_LABELS[currentStep]}
                  </h3>
                </div>
                <button onClick={closeQuiz} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors -mt-1 flex-shrink-0">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ── Quiz: Body (scrollável) ── */}
            <div className="px-6 overflow-y-auto flex-1">

              {/* ─── Passo 0: O que foi gravado ─── */}
              {currentStep === 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-2">
                  <div>
                    <label className={labelCls}>Título do Projeto *</label>
                    <input
                      autoFocus type="text" value={quizForm.title}
                      onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Ex: Reels Café Especial – Março 2025"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      Cliente Relacionado{' '}
                      <span className="normal-case font-normal">(opcional)</span>
                    </label>
                    {clients.length > 0 ? (
                      <select
                        value={quizForm.clientId}
                        onChange={e => setQuizForm(p => ({ ...p, clientId: e.target.value, clientName: '' }))}
                        className={inputCls}
                      >
                        <option value="">— Sem cliente vinculado —</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.brandName}</option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <input
                          type="text" value={quizForm.clientName}
                          onChange={e => setQuizForm(p => ({ ...p, clientName: e.target.value }))}
                          placeholder="Ex: Padaria Dois Irmãos, Startup XYZ"
                          className={inputCls}
                        />
                        <p className="text-xs text-zinc-400 mt-2">Cadastre clientes no Hub de Clientes para vincular aqui.</p>
                      </>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>
                      Resumo das Cenas{' '}
                      <span className="normal-case font-normal">(opcional)</span>
                    </label>
                    <textarea
                      value={quizForm.summary}
                      onChange={e => setQuizForm(p => ({ ...p, summary: e.target.value }))}
                      placeholder="Ex: Abertura com drone, depoimento do cliente, close nos produtos..."
                      className={`${inputCls} h-24 resize-none`}
                    />
                  </div>
                </div>
              )}

              {/* ─── Passo 1: Data ─── */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-2">
                  <label className={labelCls}>Data da Gravação *</label>
                  <input
                    autoFocus type="date" value={quizForm.recordedAt}
                    onChange={e => setQuizForm(p => ({ ...p, recordedAt: e.target.value }))}
                    className={inputCls}
                  />
                  <p className="text-xs text-zinc-400 mt-3 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Quando foi feita essa gravação?
                  </p>
                </div>
              )}

              {/* ─── Passo 2: Roteiro ─── */}
              {currentStep === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 pb-2">
                  <p className="text-xs text-zinc-400">Existe um roteiro para esse projeto?</p>

                  {/* Radio-style buttons */}
                  <div className="space-y-2">
                    {/* Opção: Link Externo */}
                    <button
                      onClick={() => setQuizForm(p => ({ ...p, scriptLocation: 'external' }))}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        quizForm.scriptLocation === 'external'
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${quizForm.scriptLocation === 'external' ? 'border-violet-600 bg-violet-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
                        {quizForm.scriptLocation === 'external' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <Link className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-zinc-900 dark:text-white">Link Externo</p>
                        <p className="text-xs text-zinc-400">Notion, Google Docs, Frame.io…</p>
                      </div>
                    </button>

                    {/* Opção: No CreatorFlow */}
                    <button
                      onClick={() => setQuizForm(p => ({ ...p, scriptLocation: 'creatorflow' }))}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        quizForm.scriptLocation === 'creatorflow'
                          ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${quizForm.scriptLocation === 'creatorflow' ? 'border-violet-600 bg-violet-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
                        {quizForm.scriptLocation === 'creatorflow' && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <FileText className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-zinc-900 dark:text-white">No CreatorFlow</p>
                        <p className="text-xs text-zinc-400">Roteiro salvo no app</p>
                      </div>
                    </button>

                    {/* Opção: Sem roteiro */}
                    <button
                      onClick={() => setQuizForm(p => ({ ...p, scriptLocation: null, scriptUrl: '', scriptId: '' }))}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        quizForm.scriptLocation === null
                          ? 'border-zinc-400 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/60'
                          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${quizForm.scriptLocation === null ? 'border-zinc-500 bg-zinc-500' : 'border-zinc-300 dark:border-zinc-600'}`}>
                        {quizForm.scriptLocation === null && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-zinc-400 text-sm flex-shrink-0">—</span>
                      <div>
                        <p className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Sem Roteiro</p>
                        <p className="text-xs text-zinc-400">Gravação sem script formal</p>
                      </div>
                    </button>
                  </div>

                  {/* Campo extra: URL externa */}
                  {quizForm.scriptLocation === 'external' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className={labelCls}>URL do Roteiro</label>
                      <input
                        autoFocus type="url" value={quizForm.scriptUrl}
                        onChange={e => setQuizForm(p => ({ ...p, scriptUrl: e.target.value }))}
                        placeholder="https://notion.so/meu-roteiro"
                        className={inputCls}
                      />
                    </div>
                  )}

                  {/* Campo extra: Select CreatorFlow (placeholder fase futura) */}
                  {quizForm.scriptLocation === 'creatorflow' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className={labelCls}>Roteiro Salvo</label>
                      <div className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-400 text-sm flex items-center justify-between cursor-not-allowed">
                        <span>Selecionar roteiro… (em breve)</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-zinc-200 dark:bg-zinc-700 text-zinc-500 px-2 py-0.5 rounded-full">Em breve</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2">Esta integração estará disponível na Fase 4 do app.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ─── Passo 3: HDs ─── */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-2">
                  {hdds.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <div className="text-4xl mb-3">💾</div>
                      <p className="text-sm text-zinc-500 mb-4">Nenhum HD cadastrado ainda.</p>
                      <button
                        onClick={() => { closeQuiz(); setIsAddHDDOpen(true); }}
                        className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-bold"
                      >
                        Cadastrar HD agora
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-400 mb-3">Marque todos os HDs onde o material foi salvo (backup múltiplo):</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {hdds.map(hdd => {
                          const sel = quizForm.selectedHddIds.includes(hdd.id);
                          return (
                            <button
                              key={hdd.id} onClick={() => toggleHDD(hdd.id)}
                              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${sel ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700'}`}
                            >
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? 'bg-violet-600 border-violet-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                              </div>
                              <span className="text-base">💾</span>
                              <span className={`font-bold text-sm flex-1 ${sel ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{hdd.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      {quizForm.selectedHddIds.length > 0 && (
                        <p className="text-xs text-violet-600 dark:text-violet-400 font-bold pt-1">
                          ✓ {quizForm.selectedHddIds.length} HD{quizForm.selectedHddIds.length > 1 ? 's' : ''} selecionado{quizForm.selectedHddIds.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ─── Passo 4: Câmeras e Mídia ─── */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-2">

                  {/* Fallback: inventário vazio */}
                  {!hasInventory ? (
                    <div className="text-center py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                      <p className="text-sm text-zinc-400 italic mb-1">
                        Nenhum equipamento cadastrado no Meu Estúdio.
                      </p>
                      <p className="text-xs text-zinc-400">
                        Configure seu inventário em{' '}
                        <span className="font-bold text-violet-600 dark:text-violet-400">Meu Estúdio</span>
                        {' '}para agilizar futuros ingests.
                      </p>
                    </div>
                  ) : (
                    <>
                      {renderEquipGroup('Câmeras', <Camera className="w-3.5 h-3.5" />, studioProfile.equipment.cameras, '📷')}
                      {renderEquipGroup('Lentes', <Aperture className="w-3.5 h-3.5" />, studioProfile.equipment.lenses, '🔭')}
                      {renderEquipGroup('Áudio', <Mic className="w-3.5 h-3.5" />, studioProfile.equipment.audio, '🎙️')}
                      {renderEquipGroup('Iluminação', <Lightbulb className="w-3.5 h-3.5" />, studioProfile.equipment.lighting, '💡')}
                    </>
                  )}

                  {/* Outros — sempre disponível */}
                  {hasInventory && <div className="h-px bg-zinc-100 dark:bg-zinc-800" />}
                  <button
                    onClick={() => toggleDevice('outros')}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                      quizForm.mediaDevices.includes('outros')
                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-violet-300 dark:hover:border-violet-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${quizForm.mediaDevices.includes('outros') ? 'bg-violet-600 border-violet-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
                      {quizForm.mediaDevices.includes('outros') && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-base">🎛️</span>
                    <span className={`font-bold text-sm ${quizForm.mediaDevices.includes('outros') ? 'text-violet-700 dark:text-violet-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      Outros Equipamentos
                    </span>
                  </button>

                  {/* Campo condicional: aparece apenas quando "Outros" está marcado */}
                  {quizForm.mediaDevices.includes('outros') && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className={labelCls}>Descreva os outros equipamentos</label>
                      <input
                        autoFocus
                        type="text"
                        value={quizForm.otherEquipmentDetails}
                        onChange={e => setQuizForm(p => ({ ...p, otherEquipmentDetails: e.target.value }))}
                        placeholder="Ex: GoPro, Gimbal Ronin, Iluminação Amaran..."
                        className={inputCls}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ─── Passo 5: Obs. Técnicas ─── */}
              {currentStep === 5 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-2">
                  <label className={labelCls}>
                    Observações Técnicas{' '}
                    <span className="normal-case font-normal">(opcional)</span>
                  </label>
                  <textarea
                    autoFocus value={quizForm.technicalNotes}
                    onChange={e => setQuizForm(p => ({ ...p, technicalNotes: e.target.value }))}
                    placeholder="Ex: Câmera B sem áudio, material em 4K 120fps, bateria morreu na 3ª cena…"
                    className={`${inputCls} h-36 resize-none`}
                  />
                  <p className="text-xs text-zinc-400 mt-2 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5" /> Problemas técnicos, specs, alertas para a edição…
                  </p>
                </div>
              )}

              {/* ─── Passo 6: Pendências ─── */}
              {currentStep === 6 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-2">
                  {/* Destaque visual */}
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 p-4 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm text-amber-800 dark:text-amber-300 mb-0.5">
                        Faltou gravar algum take importante?
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Registre agora para não perder o raciocínio. Isso gerará alertas futuros no Dashboard.
                      </p>
                    </div>
                  </div>

                  {/* Sim / Não */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setQuizForm(p => ({ ...p, hasPendingTakes: true }))}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 font-bold text-sm transition-all ${
                        quizForm.hasPendingTakes === true
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-amber-300 dark:hover:border-amber-700'
                      }`}
                    >
                      <span className="text-2xl">😬</span>
                      Sim, faltou
                    </button>
                    <button
                      onClick={() => setQuizForm(p => ({ ...p, hasPendingTakes: false, pendingTakesDescription: '' }))}
                      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 font-bold text-sm transition-all ${
                        quizForm.hasPendingTakes === false
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <span className="text-2xl">✅</span>
                      Tudo gravado!
                    </button>
                  </div>

                  {/* Textarea condicional */}
                  {quizForm.hasPendingTakes === true && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className={labelCls}>O que faltou gravar?</label>
                      <textarea
                        autoFocus value={quizForm.pendingTakesDescription}
                        onChange={e => setQuizForm(p => ({ ...p, pendingTakesDescription: e.target.value }))}
                        placeholder="Ex: Close na embalagem do produto, depoimento da Maria, cena da abertura com luz natural…"
                        className={`${inputCls} h-28 resize-none`}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ─── Passo 7: Resumo Final ─── */}
              {currentStep === 7 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-right-4 duration-300 pb-2">
                  <p className="text-xs text-zinc-400 uppercase tracking-widest font-bold mb-1">Confira antes de salvar:</p>

                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden text-sm">

                    {/* Projeto + Cliente */}
                    <div className="px-4 py-3">
                      <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 block mb-1">Projeto</span>
                      <p className="font-bold text-zinc-900 dark:text-white">🎬 {quizForm.title}</p>
                      {quizForm.clientName && <p className="text-xs text-violet-600 dark:text-violet-400 mt-0.5">Cliente: {quizForm.clientName}</p>}
                      {quizForm.summary && <p className="text-xs text-zinc-500 mt-1">{quizForm.summary}</p>}
                    </div>

                    {/* Data */}
                    <div className="px-4 py-3">
                      <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 block mb-1">Data</span>
                      <p className="text-zinc-700 dark:text-zinc-300">📅 {formatDate(quizForm.recordedAt)}</p>
                    </div>

                    {/* Roteiro */}
                    {quizForm.scriptLocation && (
                      <div className="px-4 py-3">
                        <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 block mb-1">Roteiro</span>
                        {quizForm.scriptLocation === 'external' && (
                          <p className="text-zinc-700 dark:text-zinc-300 truncate">🔗 {quizForm.scriptUrl || '(sem URL)'}</p>
                        )}
                        {quizForm.scriptLocation === 'creatorflow' && (
                          <p className="text-zinc-700 dark:text-zinc-300">🗂️ No CreatorFlow</p>
                        )}
                      </div>
                    )}

                    {/* HDs */}
                    <div className="px-4 py-3">
                      <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 block mb-1">HDs ({quizForm.selectedHddIds.length})</span>
                      <p className="text-violet-600 dark:text-violet-400 font-medium">💾 {getHDDNames(quizForm.selectedHddIds)}</p>
                    </div>

                    {/* Câmeras */}
                    {(quizForm.mediaDevices.length > 0 || quizForm.cameraModels) && (
                      <div className="px-4 py-3">
                        <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 block mb-1">Câmeras e Mídia</span>
                        {quizForm.mediaDevices.length > 0 && (
                          <p className="text-sky-600 dark:text-sky-400">🎥 {quizForm.mediaDevices.map(d => DEVICE_LABELS[d] ?? d).join(' · ')}</p>
                        )}
                        {quizForm.cameraModels && <p className="text-zinc-500 text-xs mt-0.5">Modelos: {quizForm.cameraModels}</p>}
                      </div>
                    )}

                    {/* Obs. técnicas */}
                    {quizForm.technicalNotes && (
                      <div className="px-4 py-3">
                        <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 block mb-1">Obs. Técnicas</span>
                        <p className="text-amber-600 dark:text-amber-400">📝 {quizForm.technicalNotes}</p>
                      </div>
                    )}

                    {/* Pendências */}
                    <div className="px-4 py-3">
                      <span className="text-[10px] uppercase tracking-widest font-black text-zinc-400 block mb-1">Pendências</span>
                      {quizForm.hasPendingTakes === false && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-medium">✅ Tudo gravado!</p>
                      )}
                      {quizForm.hasPendingTakes === true && (
                        <>
                          <p className="text-amber-600 dark:text-amber-400 font-medium">⚠️ Sim — faltou gravar</p>
                          {quizForm.pendingTakesDescription && (
                            <p className="text-xs text-zinc-500 mt-1">{quizForm.pendingTakesDescription}</p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── Quiz: Footer (fixo) ── */}
            <div className="px-6 py-4 flex gap-3 border-t border-zinc-100 dark:border-zinc-800 flex-shrink-0">
              {currentStep > 0 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Voltar
                </button>
              ) : (
                <div className="flex-1" />
              )}

              {currentStep < TOTAL_STEPS - 1 ? (
                <button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/20 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próximo <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={saveRecording}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/30 hover:opacity-90 transition-all"
                >
                  <Check className="w-4 h-4" /> Salvar no Acervo
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default HubArquivos;
