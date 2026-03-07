'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchUserData, saveUserData } from '@/lib/clients-api';
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
  FolderPlus,
  History,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Client, HDD, Recording, StudioProfile } from '@/types';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface HubArquivosProps {
  hdds: HDD[];
  recordings: Recording[];
  studioProfile: StudioProfile;
  clients: Client[];
  onSaveHDD: (hdd: HDD) => void;
  onDeleteHDD: (id: string) => void;
  onRestoreHDD: (id: string) => void;
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
  clients,
  onSaveHDD,
  onDeleteHDD,
  onRestoreHDD,
  onSaveRecording,
  onDeleteRecording,
  onBack,
}) => {
  const HDD_ARCHIVE_RETENTION_MS = 15 * 24 * 60 * 60 * 1000;
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3500); };
  const [showHDDArchiveModal, setShowHDDArchiveModal] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [quizForm, setQuizForm] = useState<QuizForm>(INITIAL_FORM);
  const [isAddHDDOpen, setIsAddHDDOpen] = useState(false);
  const [newHDDName, setNewHDDName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  // ── "Continuar Backup" mode ────────────────
  const [quizMode, setQuizMode]                 = useState<'novo' | 'continuar' | null>(null);
  const [continueTargetId, setContinueTargetId] = useState('');
  const [continueNotes, setContinueNotes]       = useState('');
  const [continueSizeGB, setContinueSizeGB]     = useState('');
  const [continueNewHddIds, setContinueNewHddIds] = useState<string[]>([]);
  const [continuePendingDone, setContinuePendingDone] = useState<boolean | null>(null);

  // ── Internal state that overrides props once API data loads ────
  const [localHdds, setLocalHdds]             = useState<HDD[]>(hdds);
  const [localRecordings, setLocalRecordings] = useState<Recording[]>(recordings);
  const [dataLoading, setDataLoading]         = useState(true);

  // On mount: fetch fresh data from API. If API is empty but props have data, migrate props→API.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [apiHdds, apiRec] = await Promise.all([
          fetchUserData<HDD[]>('hdds'),
          fetchUserData<Recording[]>('recordings'),
        ]);

        if (cancelled) return;

        const hasApiHdds = Array.isArray(apiHdds) && apiHdds.length > 0;
        const hasApiRec  = Array.isArray(apiRec)  && apiRec.length  > 0;

        // Prefer API data; fall back to props; migrate props→API if API is empty
        if (hasApiHdds) {
          setLocalHdds(apiHdds);
        } else if (hdds.length > 0) {
          setLocalHdds(hdds);
          saveUserData('hdds', hdds).catch(() => {});
        }

        if (hasApiRec) {
          setLocalRecordings(apiRec);
        } else if (recordings.length > 0) {
          setLocalRecordings(recordings);
          saveUserData('recordings', recordings).catch(() => {});
        }
      } catch {
        /* keep props data on error */
        if (!cancelled) { setLocalHdds(hdds); setLocalRecordings(recordings); }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Keep local state in sync when parent props change (new saves) ─
  useEffect(() => { if (!dataLoading) setLocalHdds(hdds); }, [hdds, dataLoading]);
  useEffect(() => { if (!dataLoading) setLocalRecordings(recordings); }, [recordings, dataLoading]);

  // ── Quiz controls ──────────────────────────
  const openQuiz = () => {
    setQuizForm({ ...INITIAL_FORM, recordedAt: new Date().toISOString().split('T')[0] });
    setCurrentStep(0);
    setQuizMode(null);
    setContinueTargetId('');
    setContinueNotes('');
    setContinueSizeGB('');
    setContinueNewHddIds([]);
    setContinuePendingDone(null);
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

  const toggleContinueHdd = (id: string) =>
    setContinueNewHddIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );

  const continueBackup = () => {
    const target = localRecordings.find(r => r.id === continueTargetId);
    if (!target) return;
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    const appendedNotes = continueNotes.trim()
      ? `${target.technicalNotes ? target.technicalNotes + '\n' : ''}[${today}] ${continueNotes.trim()}`
      : target.technicalNotes;
    const mergedHdds = continueNewHddIds.length > 0
      ? [...new Set([...target.hddIds, ...continueNewHddIds])]
      : target.hddIds;
    const updated: Recording = {
      ...target,
      technicalNotes: appendedNotes,
      sizeGB: continueSizeGB ? parseFloat(continueSizeGB) : target.sizeGB,
      lastUpdated: Date.now(),
      hddIds: mergedHdds,
      hasPendingTakes: continuePendingDone === false ? false : target.hasPendingTakes,
      pendingTakesDescription: continuePendingDone === false ? undefined : target.pendingTakesDescription,
    };
    onSaveRecording(updated);
    showToast('Backup atualizado com sucesso!');
    closeQuiz();
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
    showToast('Backup registrado com sucesso!');
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
    ids.map(id => localHdds.find(h => h.id === id)?.name ?? 'HD Desconhecido').join(', ');

  const formatDate = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

  const addHDD = () => {
    if (!newHDDName.trim()) return;
    onSaveHDD({ id: crypto.randomUUID(), name: newHDDName.trim(), addedAt: Date.now() });
    showToast('HD cadastrado com sucesso!');
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

  // Use localHdds/localRecordings (API-loaded, falls back to props)
  const activeHdds    = localHdds.filter(h => !h.isArchived);
  const archivedHdds  = localHdds.filter(h => h.isArchived && h.archivedAt &&
    Date.now() - new Date(h.archivedAt).getTime() <= HDD_ARCHIVE_RETENTION_MS);
  const isEmpty = !dataLoading && localRecordings.length === 0 && activeHdds.length === 0;

  // Enrich recordings with clientName resolved from the clients prop
  const enrichedRecordings = localRecordings.map(rec => {
    if (rec.clientId && !rec.clientName) {
      const client = clients.find(c => c.id === rec.clientId);
      return client ? { ...rec, clientName: client.brandName } : rec;
    }
    return rec;
  });

  const filteredRecordings = [...enrichedRecordings].reverse().filter(rec => {
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
      rec.hddIds.some(id => (localHdds.find(h => h.id === id)?.name ?? '').toLowerCase().includes(q))
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

      {/* ── Success Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[500] flex items-center gap-2.5 px-5 py-3 bg-emerald-600 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap">
          <Check className="w-4 h-4 text-white flex-shrink-0" />
          <p className="text-sm font-bold text-white">{toast}</p>
        </div>
      )}

      {/* ── HDD Archive Modal ── */}
      {showHDDArchiveModal && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">
            <div className="px-6 pt-6 pb-4 flex-shrink-0 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Archive className="w-4 h-4 text-violet-500" />
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">HDs Arquivados</h2>
                  <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                    Itens na lixeira são excluídos permanentemente após 15 dias.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowHDDArchiveModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {archivedHdds.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-center">
                  <Archive className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mb-3" />
                  <p className="text-sm text-zinc-500">Nenhum HD arquivado.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {archivedHdds.map(hdd => {
                    const archivedDate = hdd.archivedAt ? new Date(hdd.archivedAt) : null;
                    const daysLeft = archivedDate
                      ? Math.ceil((HDD_ARCHIVE_RETENTION_MS - (Date.now() - archivedDate.getTime())) / (24 * 60 * 60 * 1000))
                      : null;
                    const usedIn = localRecordings.filter(r => r.hddIds.includes(hdd.id)).length;
                    return (
                      <div key={hdd.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                        <div className="text-xl flex-shrink-0">💾</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 truncate">{hdd.name}</p>
                          <p className="text-xs text-zinc-400 mt-0.5">{usedIn} ingest{usedIn !== 1 ? 's' : ''}</p>
                          {archivedDate && (
                            <p className={`text-[10px] mt-0.5 font-bold ${daysLeft !== null && daysLeft <= 3 ? 'text-red-400' : 'text-zinc-400'}`}>
                              Arquivado em {archivedDate.toLocaleDateString('pt-BR')} · {daysLeft}d restante{daysLeft !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => { onRestoreHDD(hdd.id); }}
                          className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-violet-200 dark:border-violet-800/50 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
                        >
                          <RotateCcw className="w-3 h-3" /> Restaurar
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                  {localRecordings.length} {localRecordings.length === 1 ? 'ingest' : 'ingests'} &middot; {activeHdds.length}{' '}
                  {activeHdds.length === 1 ? 'HD' : 'HDs'}
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

          {/* Loading skeleton */}
          {dataLoading && (
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full w-24" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl" />
                ))}
              </div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full w-32 mt-6" />
              {[1, 2].map(i => (
                <div key={i} className="h-28 bg-zinc-100 dark:bg-zinc-800/60 rounded-2xl" />
              ))}
            </div>
          )}

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
              <div className="flex items-center gap-2">
                {archivedHdds.length > 0 && (
                  <button
                    onClick={() => setShowHDDArchiveModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 hover:border-violet-300 dark:hover:border-violet-700 transition-all"
                  >
                    <Archive className="w-3 h-3" />
                    Ver Arquivados
                    <span className="px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-[10px] font-black">{archivedHdds.length}</span>
                  </button>
                )}
                <button
                  onClick={() => setIsAddHDDOpen(true)}
                  className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar HD
                </button>
              </div>
            </div>

            {activeHdds.length === 0 ? (
              <button
                onClick={() => setIsAddHDDOpen(true)}
                className="w-full flex items-center justify-center gap-3 p-5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-500 transition-all group"
              >
                <HardDrive className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm">Cadastrar primeiro HD</span>
              </button>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeHdds.map(hdd => {
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
          {localRecordings.length > 0 && (
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
                          {rec.clientName && (
                            <span className="text-[10px] font-black px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full border border-violet-200 dark:border-violet-800/50">
                              👤 {rec.clientName}
                            </span>
                          )}
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
                          const hdd = localHdds.find(h => h.id === id);
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
                {selectedRecording.lastUpdated && (
                  <div className="px-4 py-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 w-20 flex-shrink-0">Atualizado</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {new Date(selectedRecording.lastUpdated).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}
                {selectedRecording.sizeGB && (
                  <div className="px-4 py-3 flex items-center gap-2">
                    <Archive className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400 w-20 flex-shrink-0">Tamanho</span>
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{selectedRecording.sizeGB} GB</span>
                  </div>
                )}
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
                    const hdd = localHdds.find(h => h.id === id);
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
          MODAL: Quiz de Ingest (8 passos) + Continuar Backup
      ══════════════════════════════════════ */}
      {isQuizOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300">

            {/* ── Quiz: Header (fixo) ── */}
            <div className="px-6 pt-6 pb-4 flex-shrink-0">

              {/* Mode = null: seleção de tipo */}
              {quizMode === null && (
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1 block">
                      Registrar Ingest
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                      Tipo de Operação
                    </h3>
                  </div>
                  <button onClick={closeQuiz} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors -mt-1 flex-shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Mode = 'continuar': header simples */}
              {quizMode === 'continuar' && (
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1 block">
                      Backup Existente
                    </span>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-violet-500" />
                      Continuar Backup
                    </h3>
                  </div>
                  <button onClick={closeQuiz} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors -mt-1 flex-shrink-0">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Mode = 'novo': header com progresso */}
              {quizMode === 'novo' && (
                <>
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
                </>
              )}
            </div>

            {/* ── Quiz: Body (scrollável) ── */}
            <div className="px-6 overflow-y-auto flex-1">

              {/* ─────────────────────────────────────
                  Tela 0: Seleção de modo
              ───────────────────────────────────── */}
              {quizMode === null && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-6 pt-2">
                  <p className="text-xs text-zinc-400 mb-1">Este material é um registro completamente novo, ou é a continuação de um backup que já está em andamento?</p>

                  {/* Criar Novo */}
                  <button
                    onClick={() => setQuizMode('novo')}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all text-left group"
                  >
                    <div className="w-11 h-11 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800/50 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/30 transition-colors">
                      <FolderPlus className="w-5 h-5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white">Criar Novo Registro</p>
                      <p className="text-xs text-zinc-400 mt-0.5">Preencha o quiz completo para um novo ingest de material.</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-violet-500 transition-colors flex-shrink-0" />
                  </button>

                  {/* Continuar Existente */}
                  <button
                    onClick={() => localRecordings.length > 0 ? setQuizMode('continuar') : undefined}
                    disabled={localRecordings.length === 0}
                    className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all text-left group disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                      <History className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-zinc-900 dark:text-white">Continuar Backup Existente</p>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {localRecordings.length === 0
                          ? 'Nenhum registro encontrado ainda.'
                          : 'Vincule nova sessão a um backup já registrado, sem duplicar o registro.'}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
                  </button>
                </div>
              )}

              {/* ─────────────────────────────────────
                  Tela: Continuar Backup Existente
              ───────────────────────────────────── */}
              {quizMode === 'continuar' && (() => {
                const target = localRecordings.find(r => r.id === continueTargetId);
                const availableHdds = localHdds.filter(h => target ? !target.hddIds.includes(h.id) : true);
                return (
                  <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300 pb-6 pt-2">

                    {/* Select recording */}
                    <div>
                      <label className={labelCls}>Selecionar Registro de Backup *</label>
                      <select
                        value={continueTargetId}
                        onChange={e => { setContinueTargetId(e.target.value); setContinueNewHddIds([]); setContinuePendingDone(null); }}
                        className={inputCls}
                      >
                        <option value="">— Escolha um registro —</option>
                        {[...localRecordings]
                          .sort((a, b) => (b.lastUpdated ?? b.createdAt) - (a.lastUpdated ?? a.createdAt))
                          .map(rec => (
                            <option key={rec.id} value={rec.id}>
                              {rec.clientName ? `${rec.clientName} — ` : ''}{rec.title} · {formatDate(rec.recordedAt)}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Current info card */}
                    {target && (
                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden text-sm animate-in fade-in duration-200">
                        <div className="px-4 py-3 flex items-center gap-2">
                          <HardDrive className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 w-20 flex-shrink-0">HDs</span>
                          <span className="text-zinc-600 dark:text-zinc-300 text-xs">
                            {target.hddIds.length > 0
                              ? target.hddIds.map(id => localHdds.find(h => h.id === id)?.name ?? 'Desconhecido').join(', ')
                              : 'Sem HD'}
                          </span>
                        </div>
                        {target.sizeGB && (
                          <div className="px-4 py-3 flex items-center gap-2">
                            <Archive className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 w-20 flex-shrink-0">Tamanho</span>
                            <span className="text-zinc-600 dark:text-zinc-300 text-xs">{target.sizeGB} GB</span>
                          </div>
                        )}
                        {target.technicalNotes && (
                          <div className="px-4 py-3 flex items-start gap-2">
                            <StickyNote className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3">{target.technicalNotes}</p>
                          </div>
                        )}
                        {target.hasPendingTakes && (
                          <div className="px-4 py-3 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Pendencias de gravacao registradas</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* New notes */}
                    <div>
                      <label className={labelCls}>
                        Adicionar Nota de Atualizacao{' '}
                        <span className="normal-case font-normal">(opcional)</span>
                      </label>
                      <textarea
                        value={continueNotes}
                        onChange={e => setContinueNotes(e.target.value)}
                        placeholder="Ex: Sessao de continuacao — 2ª parte gravada com Cam-B, 40GB adicionados…"
                        rows={3}
                        className={`${inputCls} resize-none`}
                      />
                      <p className="text-xs text-zinc-400 mt-1.5 flex items-center gap-1">
                        <StickyNote className="w-3 h-3" /> A nota sera adicionada ao historico de obs. tecnicas com a data de hoje.
                      </p>
                    </div>

                    {/* Update size */}
                    <div>
                      <label className={labelCls}>
                        Tamanho Total Atualizado (GB){' '}
                        <span className="normal-case font-normal">(opcional)</span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={0.1}
                        value={continueSizeGB}
                        onChange={e => setContinueSizeGB(e.target.value)}
                        placeholder="Ex: 128"
                        className={inputCls}
                      />
                    </div>

                    {/* Add new HDs */}
                    {target && availableHdds.length > 0 && (
                      <div>
                        <label className={labelCls}>
                          Adicionar HDs ao Registro{' '}
                          <span className="normal-case font-normal">(opcional)</span>
                        </label>
                        <div className="space-y-2">
                          {availableHdds.map(hdd => {
                            const sel = continueNewHddIds.includes(hdd.id);
                            return (
                              <button
                                key={hdd.id}
                                onClick={() => toggleContinueHdd(hdd.id)}
                                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${sel ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-700'}`}
                              >
                                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${sel ? 'bg-indigo-600 border-indigo-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
                                  {sel && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                                </div>
                                <HardDrive className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                                <span className={`font-bold text-sm flex-1 ${sel ? 'text-indigo-700 dark:text-indigo-300' : 'text-zinc-700 dark:text-zinc-300'}`}>{hdd.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Resolve pending takes if any */}
                    {target?.hasPendingTakes && (
                      <div>
                        <label className={labelCls}>Pendencias de Gravacao</label>
                        <button
                          onClick={() => setContinuePendingDone(p => p === false ? null : false)}
                          className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                            continuePendingDone === false
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${continuePendingDone === false ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-300 dark:border-zinc-600'}`}>
                            {continuePendingDone === false && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </div>
                          <Check className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <div>
                            <p className={`font-bold text-sm ${continuePendingDone === false ? 'text-emerald-700 dark:text-emerald-300' : 'text-zinc-700 dark:text-zinc-300'}`}>
                              Pendencias resolvidas nesta sessao
                            </p>
                            <p className="text-xs text-zinc-400 mt-0.5">Marque se tudo que estava pendente foi gravado agora.</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ─── Passo 0: O que foi gravado ─── */}
              {quizMode === 'novo' && currentStep === 0 && (
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
              {quizMode === 'novo' && currentStep === 1 && (
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
              {quizMode === 'novo' && currentStep === 2 && (
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
              {quizMode === 'novo' && currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300 pb-2">
                  {activeHdds.length === 0 ? (
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
                        {activeHdds.map(hdd => {
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
              {quizMode === 'novo' && currentStep === 4 && (
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
              {quizMode === 'novo' && currentStep === 5 && (
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
              {quizMode === 'novo' && currentStep === 6 && (
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
              {quizMode === 'novo' && currentStep === 7 && (
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

              {/* Mode null: sem footer (ações são nos cards) */}
              {quizMode === null && (
                <button
                  onClick={closeQuiz}
                  className="flex-1 px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-500 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancelar
                </button>
              )}

              {/* Mode 'continuar': Voltar + Atualizar */}
              {quizMode === 'continuar' && (
                <>
                  <button
                    onClick={() => setQuizMode(null)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button
                    onClick={continueBackup}
                    disabled={!continueTargetId}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="w-4 h-4" /> Atualizar Registro
                  </button>
                </>
              )}

              {/* Mode 'novo': fluxo original de passos */}
              {quizMode === 'novo' && (
                <>
                  {currentStep > 0 ? (
                    <button
                      onClick={prevStep}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Voltar
                    </button>
                  ) : (
                    <button
                      onClick={() => setQuizMode(null)}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Voltar
                    </button>
                  )}

                  {currentStep < TOTAL_STEPS - 1 ? (
                    <button
                      onClick={nextStep}
                      disabled={!canProceed()}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/20 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Proximo <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={saveRecording}
                      className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-violet-500/30 hover:opacity-90 transition-all"
                    >
                      <Check className="w-4 h-4" /> Salvar no Acervo
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default HubArquivos;
