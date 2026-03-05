'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Send,
  Sparkles,
  CalendarCheck,
  Bot,
  User,
  Undo2,
  CalendarDays,
} from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionData {
  title: string;
  subtitle: string;
  details: string;
}

interface Message {
  id: string;
  role: 'user' | 'iara';
  type: 'text' | 'action';
  content: string;
  actionData?: ActionData;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_KEYWORDS = [
  'agendar', 'agend', 'gravação', 'gravacao', 'gravar',
  'adicionar', 'adiciona', 'marcar', 'marca',
  'cria', 'crie', 'criar', 'reservar', 'evento', 'produção', 'producao',
  'sessão', 'sessao', 'filmar', 'registrar',
];

const FALLBACK_RESPONSES = [
  'Entendido. Posso ajudar com agendamentos, organização de projetos e briefings. O que você precisa?',
  'Para criar um evento no calendário, me diga o que precisa fazer e quando. Por exemplo: "Agendar gravação do cliente XYZ dia 15 às 10h".',
  'Anotado. Estou aqui para organizar sua produção. Precisa de mais alguma coisa?',
  'Perfeito. Posso agendar gravações, criar lembretes e organizar sua agenda de produções audiovisuais.',
  'Certo. Qual é a próxima produção que precisamos colocar na agenda?',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractDateInfo(text: string): { day: string; time: string; context: string } {
  const dayMatch = text.match(/dia\s+(\d{1,2})/i);
  const day = dayMatch ? dayMatch[1] : '';

  const timeMatch =
    text.match(/(\d{1,2})h(\d{0,2})/i) ||
    text.match(/(\d{1,2}):(\d{2})/i) ||
    text.match(/às\s+(\d{1,2})/i);

  let time = '';
  if (timeMatch) {
    const h = timeMatch[1];
    const m = timeMatch[2] ? timeMatch[2].padEnd(2, '0') : '00';
    time = `${h}:${m}`;
  }

  const contextMatch =
    text.match(/gravação\s+(?:de\s+|do\s+|da\s+|para\s+)?([^,\n.]+)/i) ||
    text.match(/gravar\s+(?:o\s+|a\s+|os\s+|as\s+)?([^,\n.]+)/i) ||
    text.match(/sessão\s+(?:de\s+|do\s+|da\s+|para\s+)?([^,\n.]+)/i) ||
    text.match(/produção\s+(?:de\s+|do\s+|da\s+|para\s+)?([^,\n.]+)/i);

  const context = contextMatch
    ? contextMatch[1].replace(/\s+dia\s+.*/i, '').trim()
    : 'Estúdio';

  return { day, time, context };
}

function isActionMessage(text: string): boolean {
  const lower = text.toLowerCase();
  return ACTION_KEYWORDS.some((kw) => lower.includes(kw));
}

function buildActionData(text: string): ActionData {
  const { day, time, context } = extractDateInfo(text);
  const dayStr = day ? `Dia ${day}` : 'Data a confirmar';
  const timeStr = time ? ` às ${time}` : '';

  return {
    title: 'Evento adicionado ao calendário',
    subtitle: `Gravação — ${context}`,
    details: `${dayStr}${timeStr}`,
  };
}

function randomFallback(): string {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'init',
    role: 'iara',
    type: 'text',
    content:
      'Olá. Sou a IARA, sua assistente autônoma de produção. Posso agendar gravações, organizar eventos no calendário e executar tarefas do seu estúdio a partir de um único comando em linguagem natural. Como posso ajudar?',
  },
];

// ─── Action Card ──────────────────────────────────────────────────────────────

function ActionCard({
  data,
  onUndo,
}: {
  data: ActionData;
  onUndo: () => void;
}) {
  const router = useRouter();
  const [undone, setUndone] = useState(false);

  const handleUndo = () => {
    setUndone(true);
    onUndo();
  };

  if (undone) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-600 italic py-1">
        <Undo2 className="w-3.5 h-3.5" />
        Evento removido.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-900/40 bg-emerald-900/10 backdrop-blur-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-emerald-900/30 border border-emerald-800/40 flex-shrink-0">
          <CalendarCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
            {data.title}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="border-t border-white/5 pt-3 space-y-1">
        <p className="text-sm font-bold text-white">{data.subtitle}</p>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <CalendarDays className="w-3.5 h-3.5 text-gray-600" />
          {data.details}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 px-3 py-1.5 rounded-lg border border-white/8 bg-white/5 hover:bg-red-900/10 hover:border-red-900/30 transition-all font-medium"
        >
          <Undo2 className="w-3 h-3" />
          Desfazer
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-white px-3 py-1.5 rounded-lg border border-emerald-900/40 bg-emerald-900/10 hover:bg-emerald-900/20 transition-all font-medium"
        >
          <CalendarDays className="w-3 h-3" />
          Ver na Agenda
        </button>
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onUndo,
}: {
  msg: Message;
  onUndo: (id: string) => void;
}) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-violet-900/50 border border-violet-800/50 flex items-center justify-center flex-shrink-0 mb-0.5">
          <Bot className="w-4 h-4 text-violet-400" />
        </div>
      )}
      {isUser && (
        <div className="w-7 h-7 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 mb-0.5">
          <User className="w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* Content */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {msg.type === 'action' && msg.actionData ? (
          <ActionCard data={msg.actionData} onUndo={() => onUndo(msg.id)} />
        ) : (
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-violet-600 text-white rounded-br-md'
                : 'bg-white/5 border border-white/8 text-gray-300 rounded-bl-md'
            }`}
          >
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3 items-end">
      <div className="w-7 h-7 rounded-xl bg-violet-900/50 border border-violet-800/50 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-violet-400" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white/5 border border-white/8 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IaraPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleUndo = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: uid(),
      role: 'user',
      type: 'text',
      content: text.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate latency
    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      setIsTyping(false);

      let iaraMsg: Message;

      if (isActionMessage(text)) {
        const actionData = buildActionData(text);
        iaraMsg = {
          id: uid(),
          role: 'iara',
          type: 'action',
          content: '',
          actionData,
        };
      } else {
        iaraMsg = {
          id: uid(),
          role: 'iara',
          type: 'text',
          content: randomFallback(),
        };
      }

      setMessages((prev) => [...prev, iaraMsg]);
    }, delay);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col h-screen bg-[#050505] text-white overflow-hidden">
        {/* Glow */}
        <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-violet-600/10 blur-[150px] rounded-full" />

        {/* ── Header ── */}
        <header className="relative z-10 flex items-center gap-4 px-5 py-4 border-b border-white/5 bg-black/30 backdrop-blur-md flex-shrink-0">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-xl border border-white/8 bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-900/50 border border-violet-800/50 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white leading-none">IARA</h1>
                <span className="text-[9px] font-black bg-violet-500/20 border border-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Agente Autônoma de Produção</p>
            </div>
          </div>

          {/* Status dot */}
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Online
          </div>
        </header>

        {/* ── Messages ── */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} onUndo={handleUndo} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* ── Suggestions ── */}
        {messages.length <= 1 && (
          <div className="relative z-10 px-4 pb-3 flex gap-2 overflow-x-auto flex-shrink-0 no-scrollbar">
            {[
              'Agendar gravação dia 10 às 14h',
              'Criar sessão de estúdio dia 22',
              'Marcar gravação de reels dia 5 às 9h',
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => sendMessage(suggestion)}
                className="flex-shrink-0 text-xs text-gray-400 border border-white/8 bg-white/5 hover:bg-white/10 hover:text-white px-3.5 py-2 rounded-xl transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ── */}
        <form
          onSubmit={handleSubmit}
          className="relative z-10 px-4 pb-5 pt-3 flex-shrink-0 border-t border-white/5 bg-black/20 backdrop-blur-md"
        >
          <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-violet-500/40 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Agendar gravação do cliente XYZ dia 15 às 14h..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none resize-none leading-relaxed"
              style={{ maxHeight: '120px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-8 h-8 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-violet-500/20 mb-0.5"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-gray-700 text-center mt-2">
            Enter para enviar · Shift+Enter para nova linha
          </p>
        </form>
      </div>
    </AuthGuard>
  );
}
