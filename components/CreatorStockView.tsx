'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, Play, Download, Music, Zap } from 'lucide-react';

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
      onClick={e => { e.stopPropagation(); onDownload(); }}
      title="Download — Em Breve"
      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-gray-700 text-gray-600 hover:border-amber-500/60 hover:text-amber-400 transition-all opacity-0 group-hover:opacity-100"
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
// CreatorStockView (root)
// ─────────────────────────────────────────────
interface CreatorStockViewProps {
  onBack: () => void;
}

const CreatorStockView: React.FC<CreatorStockViewProps> = ({ onBack }) => {
  const [activeTab,     setActiveTab]     = useState<LibraryTab>('musicas');
  const [playingId,     setPlayingId]     = useState<string | null>(null);
  const [search,        setSearch]        = useState('');
  const [activeMoods,   setActiveMoods]   = useState<string[]>([]);
  const [activeGenres,  setActiveGenres]  = useState<string[]>([]);
  const [activeSfxCats, setActiveSfxCats] = useState<string[]>([]);
  const [toast,         setToast]         = useState(false);

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

  const tracks = activeTab === 'musicas' ? MOCK_MUSICAS : MOCK_SFX;
  const totalActive = activeMoods.length + activeGenres.length + activeSfxCats.length;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-white animate-in fade-in duration-300 overflow-hidden">

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

        {/* Coming soon pill */}
        <span className="hidden sm:flex items-center gap-2 text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full select-none">
          🎧 Acervo em Masterização — Em Breve
        </span>
      </header>

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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 border border-amber-500/30 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 whitespace-nowrap">
          <span className="text-base select-none">🎧</span>
          <p className="text-sm font-bold text-amber-300">Acervo em Masterização. As bibliotecas estarão disponíveis em breve!</p>
        </div>
      )}
    </div>
  );
};

export default CreatorStockView;
