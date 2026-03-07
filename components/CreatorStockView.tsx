'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ArrowLeft, Search, Play, Download, Music, Zap, Sparkles, X, Send, ImageIcon, Loader2 } from 'lucide-react';
import { AgentId, Message } from '@/types';
import { sendMessageToAgent } from '@/lib/api';
import MarkdownRenderer from './MarkdownRenderer';

// ─────────────────────────────────────────────
// SFX Assistant config (inlined)
// ─────────────────────────────────────────────
const SFX_ASSISTANT_SYSTEM = `Você é um Sound Designer Profissional.
    Sua função é ler a descrição ou analisar a imagem de uma cena enviada pelo usuário e sugerir uma lista de efeitos sonoros (SFX) camada por camada.

    ESTRUTURA DE CAMADAS (LAYERS):
    1. **Ambience**: O som de fundo constante (ex: Chuva, Vento, Trânsito distante).
    2. **Foley**: Sons gerados pela ação humana (ex: Passos na água, Roupa roçando, Respiração).
    3. **SFX de Impacto/Hard FX**: Sons altos e pontuais (ex: Trovão, Batida de carro, Tiro).
    4. **Emoção/Score**: Sugestão de trilha sonora ou drone sonoro para dar o tom da cena.`;

const INITIAL_ASSISTANT_MSG: Message = {
  role: 'model',
  text: `Olá! Sou seu Sound Designer. 🎧\n\nPara criar a atmosfera sonora perfeita:\n\n1. 📸 **Envie um print** da sua cena (frame do vídeo).\n2. 📝 **Descreva brevemente** o que acontece (ex: "Luta de espadas futurista").\n\nIsso me ajuda a identificar materiais, ambiência e impactos. Pode mandar!`,
  timestamp: 0,
};

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type LibraryTab = 'musicas' | 'sfx';

interface Track {
  id: string;
  title: string;
  artist: string;
  tags: string[];
  duration: string;
}

// ─────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────
const MOCK_MUSICAS: Track[] = [
  { id: 'm1', title: 'Corporate Success',    artist: 'Instrumental', tags: ['Corporativo', 'Feliz'],           duration: '2:15' },
  { id: 'm2', title: 'Epic Journey',         artist: 'Orquestral',   tags: ['Épico', 'Cinematográfico'],       duration: '3:42' },
  { id: 'm3', title: 'Lo-Fi Study Session',  artist: 'Instrumental', tags: ['Lo-Fi', 'Concentração'],          duration: '1:58' },
  { id: 'm4', title: 'Dark Tension',         artist: 'Ambient',      tags: ['Sombrio', 'Tenso'],               duration: '2:33' },
  { id: 'm5', title: 'Digital Dreams',       artist: 'Eletrônico',   tags: ['Eletrônico', 'Moderno'],          duration: '3:10' },
];

const MOCK_SFX: Track[] = [
  { id: 's1', title: 'Cinematic Boom',   artist: 'Impacto',    tags: ['Impacto', 'Épico'],      duration: '0:03' },
  { id: 's2', title: 'Whoosh Fast',      artist: 'Transição',  tags: ['Transição', 'Swoosh'],   duration: '0:02' },
  { id: 's3', title: 'UI Click',         artist: 'Interface',  tags: ['UI', 'Clique'],          duration: '0:01' },
  { id: 's4', title: 'Nature Rain',      artist: 'Ambiente',   tags: ['Natureza', 'Chuva'],     duration: '0:08' },
  { id: 's5', title: 'Digital Glitch',   artist: 'Efeito',     tags: ['Digital', 'Glitch'],     duration: '0:04' },
];

// ─────────────────────────────────────────────
// Filter options
// ─────────────────────────────────────────────
const MOOD_FILTERS    = ['Feliz', 'Épico', 'Corporativo', 'Sombrio', 'Tenso'];
const GENRE_FILTERS   = ['Cinematic', 'Lo-Fi', 'Acústico', 'Eletrônico'];
const SFX_CAT_FILTERS = ['Transições (Swooshes)', 'Natureza', 'UI/Cliques', 'Impactos'];

// ─────────────────────────────────────────────
// Tag badge colors
// ─────────────────────────────────────────────
const TAG_BADGE: Record<string, string> = {
  'Corporativo':    'bg-blue-500/15 text-blue-300 border-blue-500/25',
  'Feliz':          'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'Épico':          'bg-violet-500/15 text-violet-300 border-violet-500/25',
  'Sombrio':        'bg-zinc-500/15 text-zinc-400 border-zinc-500/25',
  'Tenso':          'bg-red-500/15 text-red-300 border-red-500/25',
  'Lo-Fi':          'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  'Cinematográfico':'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  'Concentração':   'bg-cyan-500/15 text-cyan-300 border-cyan-500/25',
  'Eletrônico':     'bg-pink-500/15 text-pink-300 border-pink-500/25',
  'Moderno':        'bg-purple-500/15 text-purple-300 border-purple-500/25',
  'Impacto':        'bg-orange-500/15 text-orange-300 border-orange-500/25',
  'Transição':      'bg-sky-500/15 text-sky-300 border-sky-500/25',
  'Swoosh':         'bg-teal-500/15 text-teal-300 border-teal-500/25',
  'UI':             'bg-lime-500/15 text-lime-300 border-lime-500/25',
  'Clique':         'bg-green-500/15 text-green-300 border-green-500/25',
  'Natureza':       'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  'Chuva':          'bg-blue-500/15 text-blue-300 border-blue-500/25',
  'Digital':        'bg-violet-500/15 text-violet-300 border-violet-500/25',
  'Glitch':         'bg-red-500/15 text-red-300 border-red-500/25',
};

// ─────────────────────────────────────────────
// Waveform visualization
// ─────────────────────────────────────────────
const Waveform: React.FC<{ trackId: string; isPlaying: boolean }> = ({ trackId, isPlaying }) => {
  const bars = useMemo(() => {
    const seed = trackId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return Array.from({ length: 38 }, (_, i) => {
      const raw = Math.abs(Math.sin((seed + i * 1.37) * 0.55) * 75) + 12;
      return Math.max(8, Math.min(92, Math.round(raw)));
    });
  }, [trackId]);

  return (
    <div className="flex items-center gap-px h-8 w-full">
      {bars.map((h, i) => (
        <div
          key={i}
          style={{ height: `${h}%` }}
          className={`flex-1 min-w-0 rounded-sm transition-colors duration-300 ${
            isPlaying
              ? i % 4 === 0 ? 'bg-violet-300' : i % 4 === 1 ? 'bg-violet-500' : i % 4 === 2 ? 'bg-violet-400' : 'bg-violet-600'
              : 'bg-gray-700 group-hover:bg-gray-600'
          }`}
        />
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// Track Row
// ─────────────────────────────────────────────
interface TrackRowProps {
  track: Track;
  isPlaying: boolean;
  onPlay: () => void;
  onDownload: () => void;
}

const TrackRow: React.FC<TrackRowProps> = ({ track, isPlaying, onPlay, onDownload }) => (
  <div
    className={`group flex items-center gap-3 sm:gap-4 px-4 py-3.5 rounded-xl border transition-all ${
      isPlaying
        ? 'bg-violet-600/10 border-violet-500/40 shadow-sm shadow-violet-500/10'
        : 'bg-gray-900/50 border-gray-800/80 hover:bg-gray-900 hover:border-gray-700'
    }`}
  >
    {/* Play button */}
    <button
      onClick={e => { e.stopPropagation(); onPlay(); }}
      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
        isPlaying
          ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/25'
          : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-violet-600 hover:border-violet-500 hover:text-white'
      }`}
      title={isPlaying ? 'Pausar' : 'Reproduzir'}
    >
      {isPlaying ? (
        <div className="flex gap-px items-center h-3.5">
          <div className="w-0.5 h-full bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms',   animationDuration: '0.65s' }} />
          <div className="w-0.5 h-2/3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.65s' }} />
          <div className="w-0.5 h-full bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.65s' }} />
        </div>
      ) : (
        <Play className="w-3.5 h-3.5 ml-px" style={{ fill: 'currentColor' }} />
      )}
    </button>

    {/* Title + Artist */}
    <div className="flex-shrink-0 w-32 sm:w-44 min-w-0">
      <p className={`text-sm font-black truncate transition-colors ${
        isPlaying ? 'text-violet-300' : 'text-white group-hover:text-violet-300'
      }`}>
        {track.title}
      </p>
      <p className="text-[11px] text-gray-500 mt-0.5 truncate">{track.artist}</p>
    </div>

    {/* Tags */}
    <div className="hidden sm:flex flex-wrap gap-1.5 flex-1 min-w-0">
      {track.tags.map(tag => (
        <span
          key={tag}
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            TAG_BADGE[tag] ?? 'bg-gray-700/40 text-gray-400 border-gray-700'
          }`}
        >
          {tag}
        </span>
      ))}
    </div>

    {/* Waveform */}
    <div className="hidden lg:block flex-1 min-w-0 max-w-[140px] opacity-70 group-hover:opacity-100 transition-opacity">
      <Waveform trackId={track.id} isPlaying={isPlaying} />
    </div>

    {/* Duration */}
    <span className="flex-shrink-0 text-xs font-bold text-gray-500 tabular-nums w-7 text-right">
      {track.duration}
    </span>

    {/* Download — Coming Soon */}
    <button
      disabled
      onClick={e => { e.stopPropagation(); onDownload(); }}
      title="Download — Em Breve"
      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-gray-700 text-gray-600 cursor-not-allowed opacity-0 group-hover:opacity-40"
    >
      <Download className="w-3.5 h-3.5" />
    </button>
  </div>
);

// ─────────────────────────────────────────────
// Filter Pill
// ─────────────────────────────────────────────
const FilterPill: React.FC<{ label: string; active: boolean; onToggle: () => void }> = ({ label, active, onToggle }) => (
  <button
    onClick={onToggle}
    className={`text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all ${
      active
        ? 'bg-violet-600 border-violet-500 text-white shadow-sm shadow-violet-500/20'
        : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-gray-300'
    }`}
  >
    {label}
  </button>
);

// ─────────────────────────────────────────────
// AI Assistant Drawer (slide-over)
// ─────────────────────────────────────────────
interface AssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  isLoading: boolean;
  image: string | null;
  onImageChange: (img: string | null) => void;
}

const AssistantDrawer: React.FC<AssistantDrawerProps> = ({
  isOpen, onClose, messages, input, onInputChange, onSend, isLoading, image, onImageChange,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onImageChange(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 w-full max-w-[420px] flex flex-col bg-gray-950 border-l border-gray-800 shadow-2xl shadow-black/60 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white leading-none">Assistente de Áudio</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Sound Designer com IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-600 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-violet-600 text-white rounded-tr-sm'
                    : 'bg-gray-900 border border-gray-800 text-gray-200 rounded-tl-sm'
                }`}
              >
                {msg.image && (
                  <img src={msg.image} alt="Cena" className="w-full rounded-xl mb-2 object-cover max-h-40" />
                )}
                <MarkdownRenderer content={msg.text} />
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-6 h-6 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Sparkles className="w-3 h-3 text-violet-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-gray-900 border border-gray-800">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image preview strip */}
        {image && (
          <div className="flex-shrink-0 px-4 pb-2">
            <div className="relative w-24 h-16 rounded-xl overflow-hidden border border-gray-700">
              <img src={image} alt="Preview" className="w-full h-full object-cover" />
              <button
                onClick={() => onImageChange(null)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-black/90 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Input area */}
        <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t border-gray-800 space-y-2">
          <textarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva sua cena ou envie um print…"
            rows={2}
            className="w-full bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 resize-none transition-all"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold text-gray-500 hover:text-gray-300 border border-gray-700 hover:border-gray-600 rounded-xl transition-all"
            >
              <ImageIcon className="w-3.5 h-3.5" /> Print da Cena
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={onSend}
              disabled={isLoading || (!input.trim() && !image)}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 text-[11px] font-black bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white transition-all"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Enviar
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────
// CreatorStockView (root)
// ─────────────────────────────────────────────
interface CreatorStockViewProps {
  onBack: () => void;
}

const CreatorStockView: React.FC<CreatorStockViewProps> = ({ onBack }) => {
  // Library state
  const [activeTab,     setActiveTab]     = useState<LibraryTab>('musicas');
  const [playingId,     setPlayingId]     = useState<string | null>(null);
  const [search,        setSearch]        = useState('');
  const [activeMoods,   setActiveMoods]   = useState<string[]>([]);
  const [activeGenres,  setActiveGenres]  = useState<string[]>([]);
  const [activeSfxCats, setActiveSfxCats] = useState<string[]>([]);
  const [toast,         setToast]         = useState(false);

  // AI Assistant state
  const [isAssistantOpen,    setIsAssistantOpen]    = useState(false);
  const [assistantMessages,  setAssistantMessages]  = useState<Message[]>([INITIAL_ASSISTANT_MSG]);
  const [assistantInput,     setAssistantInput]     = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [assistantImage,     setAssistantImage]     = useState<string | null>(null);

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3500);
  };

  const handlePlay = (id: string) => {
    if (playingId === id) { setPlayingId(null); return; }
    setPlayingId(id);
    showToast();
  };

  const toggle = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, val: string) =>
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);

  const handleAssistantSend = async () => {
    if ((!assistantInput.trim() && !assistantImage) || isAssistantLoading) return;

    const userMsg: Message = {
      role: 'user',
      text: assistantInput.trim(),
      image: assistantImage ?? undefined,
      timestamp: Date.now(),
    };

    // Build history excluding the seeded initial model message (timestamp === 0)
    const history = assistantMessages.filter(m => m.timestamp > 0);

    setAssistantMessages(prev => [...prev, userMsg]);
    setAssistantInput('');
    setAssistantImage(null);
    setIsAssistantLoading(true);

    const result = await sendMessageToAgent(
      AgentId.SFX_SCENE_DESCRIBER,
      userMsg.text,
      assistantImage ?? null,
      history,
      SFX_ASSISTANT_SYSTEM,
    );

    const modelMsg: Message = {
      role: 'model',
      text: result.text,
      timestamp: Date.now(),
    };
    setAssistantMessages(prev => [...prev, modelMsg]);
    setIsAssistantLoading(false);
  };

  const tracks = activeTab === 'musicas' ? MOCK_MUSICAS : MOCK_SFX;
  const totalActive = activeMoods.length + activeGenres.length + activeSfxCats.length;

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white animate-in fade-in duration-300 overflow-hidden">

      {/* ══ Header ══ */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar
          </button>
          <div className="w-px h-4 bg-gray-800" />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 via-rose-500 to-amber-500 flex items-center justify-center text-[11px] font-black text-white select-none shadow-lg shadow-violet-500/20">
              CS
            </div>
            <div>
              <h1 className="text-sm font-black text-white leading-none tracking-tight">Creator Stock</h1>
              <p className="text-[10px] text-gray-500 mt-0.5">Biblioteca de Áudio & SFX</p>
            </div>
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/25 tracking-widest uppercase">
              Beta
            </span>
          </div>
        </div>

        {/* Right side: AI button + coming soon pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAssistantOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-500/40 bg-violet-600/10 text-violet-300 hover:bg-violet-600/20 hover:border-violet-500/70 transition-all text-[11px] font-black whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            ✨ Descreva sua Cena (IA)
          </button>
          <span className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full select-none whitespace-nowrap">
            🎧 Acervo em Masterização — Em Breve
          </span>
        </div>
      </header>

      {/* ══ Em Breve Banner ══ */}
      <div className="flex-shrink-0 flex items-center gap-3 px-6 py-3 bg-amber-500/10 border-b border-amber-500/20">
        <span className="text-amber-400 text-base">🚧</span>
        <p className="text-xs font-bold text-amber-300 tracking-wide">
          Ferramenta em Desenvolvimento — Em Breve
        </p>
        <span className="ml-auto text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-widest whitespace-nowrap">
          Preview
        </span>
      </div>

      {/* ══ Body: Sidebar + Main ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── Sidebar ─── */}
        <aside className="hidden md:flex flex-col w-60 xl:w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900 overflow-y-auto">
          <div className="px-4 pt-6 pb-8 space-y-7">

            {/* Mood */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Clima (Mood)</p>
              <div className="flex flex-wrap gap-1.5">
                {MOOD_FILTERS.map(f => (
                  <FilterPill key={f} label={f} active={activeMoods.includes(f)} onToggle={() => toggle(activeMoods, setActiveMoods, f)} />
                ))}
              </div>
            </div>

            {/* Genre */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Gênero</p>
              <div className="flex flex-wrap gap-1.5">
                {GENRE_FILTERS.map(f => (
                  <FilterPill key={f} label={f} active={activeGenres.includes(f)} onToggle={() => toggle(activeGenres, setActiveGenres, f)} />
                ))}
              </div>
            </div>

            {/* SFX Category */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">Categoria (SFX)</p>
              <div className="flex flex-wrap gap-1.5">
                {SFX_CAT_FILTERS.map(f => (
                  <FilterPill key={f} label={f} active={activeSfxCats.includes(f)} onToggle={() => toggle(activeSfxCats, setActiveSfxCats, f)} />
                ))}
              </div>
            </div>

            {totalActive > 0 && (
              <button
                onClick={() => { setActiveMoods([]); setActiveGenres([]); setActiveSfxCats([]); }}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors flex items-center gap-1"
              >
                ✕ Limpar filtros ({totalActive})
              </button>
            )}
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* Search + Tabs */}
          <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-gray-800 space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquise faixas, efeitos, estilos…"
                className="w-full pl-11 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
              <button
                onClick={() => setActiveTab('musicas')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black transition-all ${
                  activeTab === 'musicas'
                    ? 'bg-gray-800 text-violet-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Music className="w-3.5 h-3.5" /> 🎵 Músicas
              </button>
              <button
                onClick={() => setActiveTab('sfx')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-black transition-all ${
                  activeTab === 'sfx'
                    ? 'bg-gray-800 text-rose-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> 💥 Efeitos Sonoros (SFX)
              </button>
            </div>
          </div>

          {/* Coming Soon Banner */}
          <div className="flex-shrink-0 mx-6 mt-4 flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
            <span className="text-xl mt-0.5 select-none">🎧</span>
            <div>
              <p className="text-xs font-black text-amber-300">Acervo em Masterização</p>
              <p className="text-[11px] text-amber-500/70 mt-0.5 leading-relaxed">
                As bibliotecas de áudio e SFX estarão disponíveis em breve. O preview abaixo demonstra a experiência final.
              </p>
            </div>
          </div>

          {/* Column headers */}
          <div className="flex-shrink-0 flex items-center gap-3 sm:gap-4 px-6 pt-4 pb-2 text-[10px] font-black uppercase tracking-widest text-gray-600 border-b border-gray-800/50">
            <div className="w-9 flex-shrink-0" />
            <div className="w-32 sm:w-44 flex-shrink-0">Faixa</div>
            <div className="hidden sm:block flex-1 min-w-0">Tags</div>
            <div className="hidden lg:block flex-1 min-w-0 max-w-[140px]">Forma de Onda</div>
            <div className="w-7 flex-shrink-0 text-right">Dur.</div>
            <div className="w-8 flex-shrink-0" />
          </div>

          {/* Track list */}
          <div className="flex-1 overflow-y-auto px-6 pb-8 pt-3 space-y-1.5">
            {tracks.map(track => (
              <TrackRow
                key={track.id}
                track={track}
                isPlaying={playingId === track.id}
                onPlay={() => handlePlay(track.id)}
                onDownload={showToast}
              />
            ))}
          </div>
        </main>
      </div>

      {/* Coming Soon Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 bg-gray-900 border border-amber-500/30 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap">
          <span className="text-base select-none">🎧</span>
          <p className="text-sm font-bold text-amber-300">Acervo em Masterização. As bibliotecas estarão disponíveis em breve!</p>
        </div>
      )}

      {/* AI Assistant Drawer */}
      <AssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        messages={assistantMessages}
        input={assistantInput}
        onInputChange={setAssistantInput}
        onSend={handleAssistantSend}
        isLoading={isAssistantLoading}
        image={assistantImage}
        onImageChange={setAssistantImage}
      />
    </div>
  );
};

export default CreatorStockView;
