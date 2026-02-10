'use client';

import { useState, useEffect } from 'react';

const agents = [
  { name: 'Gerador de Roteiro', active: true },
  { name: 'Fábrica de Conteúdo', active: false },
  { name: 'Otimização SEO', active: false },
  { name: 'Shot List', active: false },
  { name: 'Storyboard Visual', active: false },
  { name: 'Orçamento AI', active: false },
  { name: 'Legendas', active: false },
  { name: 'Thumbnail', active: false },
];

const aiResponseLines = [
  { text: '🎬 Roteiro: Review Canon R6 Mark III', style: 'title' as const },
  { text: '', style: 'spacer' as const },
  { text: 'CENA 1 — ABERTURA (0:00–0:15)', style: 'scene' as const },
  { text: '[Close-up da câmera sobre mesa de madeira escura. Luz natural lateral. Som ambiente suave.]', style: 'desc' as const },
  { text: '"Essa câmera mudou completamente meu workflow..."', style: 'quote' as const },
  { text: '', style: 'spacer' as const },
  { text: 'CENA 2 — UNBOXING (0:15–0:45)', style: 'scene' as const },
  { text: '[Plano médio, mãos abrindo a caixa. Cortes rápidos mostrando cada acessório. Reveal cinematográfico.]', style: 'desc' as const },
  { text: '', style: 'spacer' as const },
  { text: 'CENA 3 — SPECS & HANDS-ON (0:45–1:30)', style: 'scene' as const },
  { text: '[B-roll da câmera em vários ângulos. Overlay com specs: 24.2MP full-frame, 4K 60fps, IBIS 8 stops, Dual Pixel CMOS AF II.]', style: 'desc' as const },
  { text: '', style: 'spacer' as const },
  { text: 'CENA 4 — SAMPLE FOOTAGE (1:30–2:15)', style: 'scene' as const },
  { text: '[Montagem de clips gravados com a câmera. Low light, slow motion 120fps, auto-focus tracking.]', style: 'desc' as const },
];

function TypingText() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<Array<{ text: string; style: string }>>([]);

  useEffect(() => {
    if (lineIndex >= aiResponseLines.length) {
      // Reset after pause
      const timeout = setTimeout(() => {
        setLineIndex(0);
        setCharIndex(0);
        setDisplayedLines([]);
      }, 4000);
      return () => clearTimeout(timeout);
    }

    const currentLine = aiResponseLines[lineIndex];

    if (currentLine.style === 'spacer') {
      // Spacers appear instantly
      setDisplayedLines((prev) => [...prev, { text: '', style: 'spacer' }]);
      setLineIndex((prev) => prev + 1);
      setCharIndex(0);
      return;
    }

    if (charIndex < currentLine.text.length) {
      const speed = currentLine.style === 'scene' ? 25 : 18;
      const timeout = setTimeout(() => {
        setCharIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    }

    // Line complete — move to next
    setDisplayedLines((prev) => [...prev, { text: currentLine.text, style: currentLine.style }]);
    setLineIndex((prev) => prev + 1);
    setCharIndex(0);
  }, [lineIndex, charIndex]);

  const currentLine = lineIndex < aiResponseLines.length ? aiResponseLines[lineIndex] : null;
  const isTyping = currentLine && currentLine.style !== 'spacer';
  const partialText = currentLine ? currentLine.text.slice(0, charIndex) : '';

  return (
    <div className="space-y-0.5">
      {displayedLines.map((line, i) => (
        <LineRenderer key={i} text={line.text} style={line.style} />
      ))}
      {isTyping && currentLine && (
        <span className={getLineClass(currentLine.style)}>
          {partialText}
          <span className="inline-block w-[3px] h-[6px] bg-[#8B5CF6] ml-[1px] animate-pulse rounded-sm align-middle" />
        </span>
      )}
    </div>
  );
}

function getLineClass(style: string) {
  switch (style) {
    case 'title':
      return 'block text-[5px] sm:text-[6px] text-[#A78BFA] font-bold';
    case 'scene':
      return 'block text-[4px] sm:text-[5px] text-white/40 font-bold uppercase tracking-wider mt-0.5';
    case 'desc':
      return 'block text-[4.5px] sm:text-[5.5px] text-white/60 leading-relaxed';
    case 'quote':
      return 'block text-[4.5px] sm:text-[5.5px] text-white/45 italic';
    default:
      return 'block h-1';
  }
}

function LineRenderer({ text, style }: { text: string; style: string }) {
  if (style === 'spacer') return <span className="block h-1" />;
  return <span className={getLineClass(style)}>{text}</span>;
}

export default function MockupChat() {
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Window chrome */}
      <div className="flex items-center gap-2.5 px-3 py-2 border-b border-white/[0.06] bg-[#111]">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 h-5 rounded-md bg-white/[0.04] flex items-center px-2">
          <div className="h-2 w-2 rounded-full bg-[#8B5CF6]/40 mr-1.5" />
          <span className="text-[6px] text-white/25 font-mono">creatorflowia.com/app</span>
        </div>
      </div>

      {/* App body — sidebar + chat */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="hidden sm:flex w-[22%] flex-col border-r border-white/[0.06] bg-[#0a0a0a] py-2 px-1.5">
          <div className="flex items-center gap-1 px-1.5 mb-2.5">
            <span className="font-display text-[8px] font-extrabold bg-gradient-to-r from-[#8B5CF6] to-[#C026D3] bg-clip-text text-transparent">W</span>
            <span className="font-display text-[5px] font-bold tracking-[0.08em] text-white/70">FLOW</span>
          </div>
          {agents.map((agent) => (
            <div
              key={agent.name}
              className={`rounded-md px-1.5 py-1 mb-0.5 flex items-center gap-1 ${
                agent.active
                  ? 'bg-[#8B5CF6]/15 border-l-2 border-l-[#8B5CF6] border border-[#8B5CF6]/20'
                  : ''
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${agent.active ? 'bg-[#8B5CF6]' : 'bg-white/10'}`} />
              <span className={`text-[5px] truncate ${agent.active ? 'text-white font-semibold' : 'text-white/25'}`}>
                {agent.name}
              </span>
            </div>
          ))}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col bg-[#0A0A0A]">
          {/* Chat header */}
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.06] bg-[#0e0e0e]">
            <div className="h-4 w-4 rounded-md bg-gradient-to-br from-[#7C3AED] to-[#C026D3] flex items-center justify-center">
              <span className="text-[6px]">📝</span>
            </div>
            <div>
              <p className="text-[7px] font-bold text-white leading-none">Gerador de Roteiro</p>
              <p className="text-[4px] text-emerald-400 mt-0.5">Online — Modelo Pro</p>
            </div>
            <span className="ml-auto inline-flex items-center rounded-full bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 text-[4px] font-bold uppercase tracking-wider text-emerald-400">
              Pro
            </span>
          </div>

          {/* Messages */}
          <div className="flex-1 px-3 py-2 space-y-2 overflow-hidden">
            {/* User message */}
            <div className="flex justify-end">
              <div className="max-w-[72%] rounded-lg rounded-tr-sm bg-[#1E1E2E] border border-[#8B5CF6]/15 px-2 py-1.5">
                <p className="text-[5px] sm:text-[6px] text-white/90 leading-relaxed">
                  Crie um roteiro para um vídeo de review de câmera Canon R6 Mark III, 3 minutos, estilo cinematic
                </p>
              </div>
            </div>

            {/* AI response with typing */}
            <div className="flex justify-start">
              <div className="max-w-[82%] rounded-lg rounded-tl-sm bg-[#161616] border border-white/[0.06] px-2 py-1.5">
                <TypingText />
              </div>
            </div>
          </div>

          {/* Input bar */}
          <div className="px-2 py-1.5 border-t border-white/[0.08] bg-[#0e0e0e]">
            <div className="flex gap-1.5">
              <div className="flex-1 h-6 rounded-lg bg-[#1A1A1A] border border-white/[0.06] flex items-center px-2">
                <span className="text-[5px] text-white/20 mockup-input-typing">Escreva sua mensagem...</span>
              </div>
              <div className="h-6 w-6 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#C026D3] flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)] shrink-0">
                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path d="M5 12h14m-7-7 7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
