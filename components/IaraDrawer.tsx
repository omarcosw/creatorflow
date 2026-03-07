'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import {
  X,
  Send,
  Sparkles,
  CalendarCheck,
  Bot,
  User,
  Undo2,
  CalendarDays,
  Building2,
} from 'lucide-react';
import { useIara } from '@/components/IaraContext';
import { fetchClientData, saveClientData } from '@/lib/clients-api';

// Mirrors AgendaEvent from ClientDashboard (must stay in sync)
interface AgendaEvent {
  id: string;
  title: string;
  type: string;
  location: 'Interna' | 'Externa' | 'Remoto';
  address: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  notes: string;
  createdAt: number;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ActionData {
  title: string;
  subtitle: string;
  details: string;
}

interface Message {
  id: string;
  role: 'user' | 'iara';
  type: 'text' | 'action' | 'client_selection';
  content: string;
  actionData?: ActionData;
}

interface PendingTask {
  rawText: string;
  day: string;
  time: string;
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

function buildActionData(text: string, clientName?: string): ActionData {
  const { day, time, context } = extractDateInfo(text);
  const dayStr = day ? `Dia ${day}` : 'Data a confirmar';
  const timeStr = time ? ` às ${time}` : '';
  const subtitle = clientName && clientName !== 'Sem cliente'
    ? `Gravação — ${clientName}`
    : `Gravação — ${context}`;
  return {
    title: 'Evento adicionado ao calendário',
    subtitle,
    details: `${dayStr}${timeStr}`,
  };
}

function randomFallback(): string {
  return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'init',
    role: 'iara',
    type: 'text',
    content:
      'Olá. Sou a IARA, sua assistente autônoma de produção. Posso agendar gravações, organizar eventos e executar tarefas do seu estúdio em linguagem natural. Como posso ajudar?',
  },
];

// ─── Action Card ──────────────────────────────────────────────────────────────

function ActionCard({ data, onUndo }: { data: ActionData; onUndo: () => void }) {
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
    <div className="rounded-2xl border border-emerald-900/40 bg-emerald-900/10 p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-emerald-900/30 border border-emerald-800/40 flex-shrink-0">
          <CalendarCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-emerald-400">
          {data.title}
        </p>
      </div>

      <div className="border-t border-white/5 pt-3 space-y-1">
        <p className="text-sm font-bold text-white">{data.subtitle}</p>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <CalendarDays className="w-3.5 h-3.5 text-gray-600" />
          {data.details}
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button
          onClick={handleUndo}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 px-3 py-1.5 rounded-lg border border-white/8 bg-white/5 hover:bg-red-900/10 hover:border-red-900/30 transition-all font-medium"
        >
          <Undo2 className="w-3 h-3" />
          Desfazer
        </button>
      </div>
    </div>
  );
}

// ─── Client Selection Chips ───────────────────────────────────────────────────

function ClientSelectionChips({
  clientNames,
  onSelect,
  disabled,
}: {
  clientNames: string[];
  onSelect: (client: string) => void;
  disabled: boolean;
}) {
  if (clientNames.length === 0) {
    return (
      <div className="mt-3 space-y-3">
        <p className="text-xs text-gray-500 leading-relaxed">
          Você ainda não tem clientes cadastrados no Hub. Deseja criar a tarefa sem cliente por enquanto?
        </p>
        <button
          onClick={() => onSelect('Sem cliente')}
          disabled={disabled}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Building2 className="w-3 h-3 text-gray-500" />
          Criar sem Cliente
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {clientNames.map((name) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          disabled={disabled}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-sm text-gray-300 hover:text-white px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Building2 className="w-3 h-3 text-gray-500" />
          {name}
        </button>
      ))}
      <button
        onClick={() => onSelect('Sem cliente')}
        disabled={disabled}
        className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Sem cliente
      </button>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  onUndo,
  onSelectClient,
  clientSelectionDone,
  clientNames,
}: {
  msg: Message;
  onUndo: (id: string) => void;
  onSelectClient: (client: string) => void;
  clientSelectionDone: boolean;
  clientNames: string[];
}) {
  const isUser = msg.role === 'user';

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-lg bg-violet-900/50 border border-violet-800/50 flex items-center justify-center flex-shrink-0 mb-0.5">
          <Bot className="w-3.5 h-3.5 text-violet-400" />
        </div>
      )}
      {isUser && (
        <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 mb-0.5">
          <User className="w-3.5 h-3.5 text-gray-400" />
        </div>
      )}

      <div className={`max-w-[85%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {msg.type === 'action' && msg.actionData ? (
          <ActionCard data={msg.actionData} onUndo={() => onUndo(msg.id)} />
        ) : msg.type === 'client_selection' ? (
          <div className="rounded-2xl rounded-bl-sm bg-white/5 border border-white/8 px-3.5 py-3">
            <p className="text-sm text-gray-300 leading-relaxed">{msg.content}</p>
            <ClientSelectionChips clientNames={clientNames} onSelect={onSelectClient} disabled={clientSelectionDone} />
          </div>
        ) : (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-violet-600 text-white rounded-br-sm'
                : 'bg-white/5 border border-white/8 text-gray-300 rounded-bl-sm'
            }`}
          >
            {msg.content}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 items-end">
      <div className="w-6 h-6 rounded-lg bg-violet-900/50 border border-violet-800/50 flex items-center justify-center flex-shrink-0">
        <Bot className="w-3.5 h-3.5 text-violet-400" />
      </div>
      <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-white/5 border border-white/8 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:0ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

export default function IaraDrawer() {
  const { isOpen, close, clients } = useIara();
  const clientNames = clients.map((c) => c.brandName).filter(Boolean);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pendingTask, setPendingTask] = useState<PendingTask | null>(null);
  // Track which client_selection messages have been answered (to disable chips)
  const [answeredSelections, setAnsweredSelections] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [close]);

  const handleUndo = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  // Called when user clicks a client chip
  const handleSelectClient = async (clientName: string) => {
    if (!pendingTask) return;

    // Find the last client_selection message and mark it as answered
    setMessages((prev) => {
      const lastSelectionId = [...prev].reverse().find((m) => m.type === 'client_selection')?.id;
      if (lastSelectionId) {
        setAnsweredSelections((s) => new Set(s).add(lastSelectionId));
      }
      return prev;
    });

    // Add user message with client name
    const userMsg: Message = { id: uid(), role: 'user', type: 'text', content: clientName };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const task = pendingTask;
    setPendingTask(null);

    // ── Save event to client's agenda via API ─────────────────────────────
    const matchedClient = clients.find((c) => c.brandName === clientName);
    if (matchedClient) {
      try {
        const now = new Date();
        const day   = task.day  ? task.day.padStart(2, '0')  : String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year  = now.getFullYear();
        const date  = `${year}-${month}-${day}`;

        const startTime = task.time || '09:00';
        const [startH] = startTime.split(':');
        const endHour   = String(Math.min(parseInt(startH, 10) + 1, 23)).padStart(2, '0');
        const endTime   = `${endHour}:${startTime.split(':')[1] ?? '00'}`;

        const { context } = extractDateInfo(task.rawText);
        const eventTitle  = context !== 'Estúdio' ? context : `Gravação — ${clientName}`;

        const newEvent: AgendaEvent = {
          id:        uid(),
          title:     eventTitle,
          type:      'Gravação',
          location:  'Interna',
          address:   '',
          date,
          startTime,
          endTime,
          notes:     `Criado pela IARA: "${task.rawText}"`,
          createdAt: Date.now(),
        };

        const current  = await fetchClientData<AgendaEvent[]>(matchedClient.id, 'agenda');
        const existing = Array.isArray(current) ? current : [];
        await saveClientData(matchedClient.id, 'agenda', [newEvent, ...existing]);
      } catch (err) {
        console.error('[IARA] Falha ao salvar evento na agenda do cliente:', err);
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    const delay = 700 + Math.random() * 400;
    setTimeout(() => {
      setIsTyping(false);
      const actionMsg: Message = {
        id: uid(),
        role: 'iara',
        type: 'action',
        content: '',
        actionData: buildActionData(task.rawText, clientName),
      };
      setMessages((prev) => [...prev, actionMsg]);
    }, delay);
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: uid(), role: 'user', type: 'text', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      setIsTyping(false);

      if (isActionMessage(text)) {
        // Step 1: ask for client instead of confirming immediately
        const { day, time } = extractDateInfo(text);
        setPendingTask({ rawText: text.trim(), day, time });
        const selectionMsg: Message = {
          id: uid(),
          role: 'iara',
          type: 'client_selection',
          content: 'Perfeito! Para qual cliente do seu Hub devo atribuir essa tarefa?',
        };
        setMessages((prev) => [...prev, selectionMsg]);
      } else {
        const iaraMsg: Message = {
          id: uid(),
          role: 'iara',
          type: 'text',
          content: randomFallback(),
        };
        setMessages((prev) => [...prev, iaraMsg]);
      }
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
    <>
      {/* Floating Widget */}
      <aside
        className={`fixed bottom-6 right-6 w-[calc(100vw-3rem)] sm:w-[400px] h-[60vh] min-h-[420px] max-h-[620px] bg-[#050505] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 z-50 flex flex-col overflow-hidden transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-900/50 border border-violet-800/50 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white leading-none">IARA</span>
                <span className="text-[9px] font-black bg-violet-500/20 border border-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                  AI
                </span>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">Agente Autônoma de Produção</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </div>
            <button
              onClick={close}
              className="p-1.5 rounded-lg border border-white/8 bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onUndo={handleUndo}
              onSelectClient={handleSelectClient}
              clientSelectionDone={answeredSelections.has(msg.id)}
              clientNames={clientNames}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* ── Quick suggestions ── */}
        {messages.length <= 1 && (
          <div className="px-4 pb-2 flex gap-2 overflow-x-auto flex-shrink-0">
            {[
              'Agendar gravação dia 10 às 14h',
              'Criar sessão de estúdio dia 22',
              'Marcar gravação de reels dia 5 às 9h',
            ].map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="flex-shrink-0 text-[11px] text-gray-400 border border-white/8 bg-white/5 hover:bg-white/10 hover:text-white px-3 py-1.5 rounded-lg transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ── */}
        <form
          onSubmit={handleSubmit}
          className="px-4 pb-5 pt-3 flex-shrink-0 border-t border-white/5"
        >
          <div className="flex items-end gap-3 bg-white/5 border border-white/10 rounded-2xl px-3.5 py-2.5 focus-within:border-violet-500/40 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Dê um comando à IARA..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none resize-none leading-relaxed"
              style={{ maxHeight: '100px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-violet-500/20 mb-0.5"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-[10px] text-gray-700 text-center mt-2">
            Enter para enviar · Shift+Enter para nova linha · Esc para fechar
          </p>
        </form>
      </aside>
    </>
  );
}
