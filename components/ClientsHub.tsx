'use client';

import React, { useState } from 'react';
import {
  ArrowLeft, Plus, Users, Trash2, ChevronRight, AlertTriangle, Calendar,
  X, UserPlus, MoreVertical, Pencil, CheckCircle, Clock, Video, Globe,
} from 'lucide-react';
import { Client } from '@/types';
import ClientOnboardingModal from './ClientOnboardingModal';
import ClientDashboard from './ClientDashboard';
import ClientPortalView from './ClientPortalView';

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface ClientsHubProps {
  clients: Client[];
  onSaveClient: (client: Client) => void;
  onDeleteClient: (id: string) => void;
  onBack: () => void;
  onNavigateToArquivos?: () => void;
}

// ─────────────────────────────────────────────
// Voice tone badge colors
// ─────────────────────────────────────────────
const VOICE_TONE_COLORS: Record<Client['voiceTone'], string> = {
  'Autoritário':  'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50',
  'Descontraído': 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
  'Educacional':  'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
  'Agressivo':    'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/50',
};

// ─────────────────────────────────────────────
// Workflow alert helpers (reads localStorage)
// ─────────────────────────────────────────────
interface ClientAlerts {
  hasOverdue: boolean;
  hasToday: boolean;
}

interface _WorkflowCard  { dueDate: string; }
interface _WorkflowColumn { id: string; cards: _WorkflowCard[]; }
interface _AgendaEvent {
  date: string;
  startTime: string;
  title: string;
  type: string;
}

interface _AgendaEventWithClient extends _AgendaEvent {
  clientId: string;
  clientName: string;
}

const _getTodayStr = (): string => new Date().toISOString().split('T')[0];

// ─────────────────────────────────────────────
// Agenda aggregation — reads all clients' localStorage
// ─────────────────────────────────────────────
const getUpcomingEvents = (clients: Client[]): _AgendaEventWithClient[] => {
  const todayStr = _getTodayStr();
  const all: _AgendaEventWithClient[] = [];

  for (const client of clients) {
    try {
      const stored = localStorage.getItem(`creator_flow_agenda_${client.id}`);
      if (!stored) continue;
      const events: _AgendaEvent[] = JSON.parse(stored);
      for (const e of events) {
        if (e.date >= todayStr) {
          all.push({ ...e, clientId: client.id, clientName: client.brandName });
        }
      }
    } catch { /* ignore */ }
  }

  all.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return (a.startTime || '').localeCompare(b.startTime || '');
  });

  return all.slice(0, 5);
};

// ─────────────────────────────────────────────
// Format date for mini-card
// ─────────────────────────────────────────────
const formatEventDate = (dateStr: string): string => {
  const todayStr    = _getTodayStr();
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  if (dateStr === todayStr)    return 'Hoje';
  if (dateStr === tomorrowStr) return 'Amanhã';

  const [, m, d] = dateStr.split('-');
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
};

// ─────────────────────────────────────────────
// Event type → icon helper
// ─────────────────────────────────────────────
const getEventIcon = (type: string) => {
  if (type === 'Gravação')        return <Video    className="w-3.5 h-3.5" />;
  if (type === 'Entrega de Vídeo') return <Video   className="w-3.5 h-3.5" />;
  return                                   <Calendar className="w-3.5 h-3.5" />;
};

const getClientAlerts = (clientId: string): ClientAlerts => {
  const todayStr = _getTodayStr();
  let hasOverdue = false;
  let hasToday   = false;

  // ── Check kanban cards ───────────────────────
  try {
    const stored = localStorage.getItem(`creator_flow_kanban_${clientId}`);
    if (stored) {
      const columns: _WorkflowColumn[] = JSON.parse(stored);
      const active = columns
        .filter(c => c.id !== 'finalizado')
        .flatMap(c => c.cards)
        .filter(c => c.dueDate);
      if (active.some(c => c.dueDate < todayStr)) hasOverdue = true;
      if (active.some(c => c.dueDate === todayStr)) hasToday = true;
    }
  } catch { /* ignore */ }

  // ── Check agenda events today ────────────────
  try {
    const stored = localStorage.getItem(`creator_flow_agenda_${clientId}`);
    if (stored) {
      const agendaEvents: _AgendaEvent[] = JSON.parse(stored);
      if (agendaEvents.some(e => e.date === todayStr)) hasToday = true;
    }
  } catch { /* ignore */ }

  return { hasOverdue, hasToday };
};

// ─────────────────────────────────────────────
// Minha Equipe — types & constants
// ─────────────────────────────────────────────
type MemberRole = 'admin' | 'roteirista' | 'videomaker' | 'editor' | 'designer';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: MemberRole;
  isOwner?: boolean;
}

const ROLE_CONFIG: Record<MemberRole, { label: string; emoji: string; badge: string }> = {
  'admin':      { label: 'Administrador',        emoji: '👑', badge: 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-300/50 dark:border-violet-700/40' },
  'roteirista': { label: 'Roteirista / Copy',     emoji: '✍️', badge: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-300/50 dark:border-emerald-700/40' },
  'videomaker': { label: 'Videomaker / Produção', emoji: '🎥', badge: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-300/50 dark:border-sky-700/40' },
  'editor':     { label: 'Editor / Pós-produção', emoji: '✂️', badge: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-300/50 dark:border-amber-700/40' },
  'designer':   { label: 'Designer',              emoji: '🎨', badge: 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-300/50 dark:border-pink-700/40' },
};

const ROLE_OPTIONS: { value: MemberRole; label: string }[] = [
  { value: 'admin',      label: '👑 Administrador (Acesso total)' },
  { value: 'roteirista', label: '✍️ Roteirista / Copy'            },
  { value: 'videomaker', label: '🎥 Videomaker / Produção'        },
  { value: 'editor',     label: '✂️ Editor / Pós-produção'        },
  { value: 'designer',   label: '🎨 Designer'                     },
];

const INITIAL_TEAM: TeamMember[] = [
  { id: 'm1', name: 'Você',         email: 'admin@minhaproducao.com.br',      role: 'admin',      isOwner: true },
  { id: 'm2', name: 'Ana Costa',    email: 'ana.costa@minhaproducao.com.br',   role: 'roteirista'              },
  { id: 'm3', name: 'Pedro Lima',   email: 'pedro.lima@minhaproducao.com.br',  role: 'videomaker'              },
];

const LABEL_CLS  = 'text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block';
const INPUT_CLS  = 'w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all placeholder:text-zinc-400';
const SELECT_CLS = `${INPUT_CLS} cursor-pointer`;

// ─────────────────────────────────────────────
// UpcomingScheduleSection
// ─────────────────────────────────────────────
interface UpcomingScheduleSectionProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
}

const UpcomingScheduleSection: React.FC<UpcomingScheduleSectionProps> = ({ clients, onSelectClient }) => {
  const events = getUpcomingEvents(clients);

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-violet-500" />
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          Próximos Compromissos
        </h2>
      </div>

      {events.length === 0 ? (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
          <Calendar className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <p className="text-sm text-zinc-400">
            Você não tem gravações agendadas para os próximos dias.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {events.map((evt, i) => {
            const client = clients.find(c => c.id === evt.clientId);
            const dateLabel = formatEventDate(evt.date);
            const isToday   = evt.date === _getTodayStr();

            return (
              <button
                key={`${evt.clientId}-${evt.date}-${i}`}
                onClick={() => client && onSelectClient(client)}
                className="group flex-shrink-0 w-52 flex flex-col gap-2.5 p-4 rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-violet-400 dark:hover:border-violet-700 hover:shadow-md transition-all text-left"
              >
                {/* Date + time row */}
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black ${isToday ? 'text-violet-600 dark:text-violet-400' : 'text-zinc-900 dark:text-white'}`}>
                    {dateLabel}
                  </span>
                  {evt.startTime && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-400">
                      <Clock className="w-3 h-3" />
                      {evt.startTime}
                    </span>
                  )}
                </div>

                {/* Event title */}
                <div className="flex items-start gap-1.5">
                  <span className={`mt-0.5 flex-shrink-0 text-zinc-400 group-hover:text-violet-500 transition-colors`}>
                    {getEventIcon(evt.type)}
                  </span>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-200 leading-tight line-clamp-2">
                    {evt.title}
                  </p>
                </div>

                {/* Client badge */}
                <span className="self-start text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300/40 dark:border-emerald-700/40 truncate max-w-full">
                  {evt.clientName}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

// ─────────────────────────────────────────────
// TeamModal
// ─────────────────────────────────────────────
interface TeamModalProps { isOpen: boolean; onClose: () => void; }

const TeamModal: React.FC<TeamModalProps> = ({ isOpen, onClose }) => {
  const [members, setMembers]       = useState<TeamMember[]>(INITIAL_TEAM);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail]   = useState('');
  const [inviteRole, setInviteRole]     = useState<MemberRole>('videomaker');
  const [inviteToast, setInviteToast]   = useState(false);
  const [openMenuId, setOpenMenuId]     = useState<string | null>(null);
  const [editingId, setEditingId]       = useState<string | null>(null);

  const handleSendInvite = () => {
    if (!inviteEmail.trim()) return;
    setInviteEmail('');
    setInviteRole('videomaker');
    setIsInviteOpen(false);
    setInviteToast(true);
    setTimeout(() => setInviteToast(false), 3000);
  };

  const handleRemove = (id: string) => {
    if (confirm('Remover este membro da equipe?')) setMembers(prev => prev.filter(m => m.id !== id));
    setOpenMenuId(null);
  };

  const handleChangeRole = (id: string, role: MemberRole) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role } : m));
    setEditingId(null);
  };

  const getInitials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => { setOpenMenuId(null); setEditingId(null); onClose(); }}
      />

      {/* Drawer panel */}
      <div className="relative w-full max-w-lg h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 border-l border-zinc-200 dark:border-zinc-800">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-800 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Gestão de Equipe</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Gerencie os acessos da sua produtora</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Toast */}
          {inviteToast && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 animate-in fade-in duration-200">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">✅ Convite enviado para o membro!</p>
            </div>
          )}

          {/* Invite trigger / form */}
          {!isInviteOpen ? (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 font-bold text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all"
            >
              <UserPlus className="w-4 h-4" /> + Convidar Membro
            </button>
          ) : (
            <div className="rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-900/10 p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-black text-violet-700 dark:text-violet-400">Novo Convite</h3>
                <button
                  onClick={() => { setIsInviteOpen(false); setInviteEmail(''); }}
                  className="p-1 hover:bg-violet-100 dark:hover:bg-violet-800/40 rounded-lg text-violet-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className={LABEL_CLS}>E-mail do convite</label>
                <input
                  autoFocus
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSendInvite(); }}
                  placeholder="email@exemplo.com"
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>Cargo / Nível de Acesso</label>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as MemberRole)}
                  className={SELECT_CLS}
                >
                  {ROLE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleSendInvite}
                disabled={!inviteEmail.trim()}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-black text-sm shadow-md shadow-violet-500/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Convite
              </button>
            </div>
          )}

          {/* Member list */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
              Membros Ativos · {members.length}
            </p>

            <div className="space-y-2">
              {members.map(member => {
                const cfg = ROLE_CONFIG[member.role];
                return (
                  <div
                    key={member.id}
                    className="relative flex items-center gap-4 p-4 bg-white dark:bg-zinc-800/60 rounded-2xl border border-zinc-100 dark:border-zinc-700/50 hover:border-zinc-200 dark:hover:border-zinc-600/50 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-black select-none">
                      {getInitials(member.name)}
                    </div>

                    {/* Name + email */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-zinc-900 dark:text-white truncate">{member.name}</p>
                        {member.isOwner && (
                          <span className="flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 uppercase tracking-wider">
                            Você
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">{member.email}</p>
                    </div>

                    {/* Role badge */}
                    <span className={`flex-shrink-0 hidden sm:inline-flex text-[11px] font-black px-2.5 py-1 rounded-lg border ${cfg.badge}`}>
                      {cfg.emoji} {cfg.label}
                    </span>

                    {/* Three-dots menu (not for owner) */}
                    {!member.isOwner && (
                      <div className="relative flex-shrink-0">
                        <button
                          onClick={() => { setOpenMenuId(openMenuId === member.id ? null : member.id); setEditingId(null); }}
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 rounded-lg text-zinc-400 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown menu */}
                        {openMenuId === member.id && editingId !== member.id && (
                          <div className="absolute right-0 top-9 z-20 w-44 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <button
                              onClick={() => { setEditingId(member.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5 text-zinc-400" /> Editar Cargo
                            </button>
                            <div className="h-px bg-zinc-100 dark:bg-zinc-700" />
                            <button
                              onClick={() => handleRemove(member.id)}
                              className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remover Membro
                            </button>
                          </div>
                        )}

                        {/* Inline role editor */}
                        {editingId === member.id && (
                          <div className="absolute right-0 top-9 z-20 w-52 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl p-3 animate-in fade-in zoom-in-95 duration-150">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 px-1">Alterar Cargo</p>
                            <div className="space-y-0.5">
                              {ROLE_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  onClick={() => handleChangeRole(member.id, opt.value)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-left ${
                                    member.role === opt.value
                                      ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400'
                                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-700/50 text-zinc-700 dark:text-zinc-300'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                            <button
                              onClick={() => setEditingId(null)}
                              className="mt-2 w-full text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors py-1"
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const ClientsHub: React.FC<ClientsHubProps> = ({
  clients,
  onSaveClient,
  onDeleteClient,
  onBack,
  onNavigateToArquivos,
}) => {
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isTeamOpen, setIsTeamOpen]     = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [portalClient, setPortalClient]     = useState<Client | null>(null);

  if (portalClient) {
    return (
      <ClientPortalView
        client={portalClient}
        onBack={() => setPortalClient(null)}
      />
    );
  }

  if (selectedClient) {
    return (
      <ClientDashboard
        client={selectedClient}
        onBack={() => setSelectedClient(null)}
        onNavigateToArquivos={onNavigateToArquivos}
      />
    );
  }

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
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
                  Hub de Clientes
                </h1>
                <p className="text-xs text-zinc-400 hidden sm:block">
                  {clients.length} {clients.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTeamOpen(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold text-sm hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-600 dark:hover:text-violet-400 transition-all"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Minha Equipe</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-all hover:scale-[1.02] active:scale-100"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Cliente</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══ Main ══ */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

          {/* ══ Upcoming schedule ══ */}
          {clients.length > 0 && (
            <UpcomingScheduleSection
              clients={clients}
              onSelectClient={setSelectedClient}
            />
          )}

          {/* Empty state */}
          {clients.length === 0 && (
            <div className="rounded-3xl border-2 border-dashed border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/10 p-10 text-center">
              <div className="text-5xl mb-4">🤝</div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
                Nenhum cliente cadastrado
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-sm mx-auto mb-6">
                Cadastre seus clientes para ter o briefing completo sempre à mão. Use a IA para extrair os dados de uma call!
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:opacity-90 transition-all"
              >
                🤝 Cadastrar Primeiro Cliente
              </button>
            </div>
          )}

          {/* Grid de clientes */}
          {clients.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clients.map(client => {
                const alerts = getClientAlerts(client.id);
                return (
                  <div
                    key={client.id}
                    className={`group relative flex flex-col gap-3 p-5 bg-white dark:bg-zinc-900 border rounded-2xl transition-all hover:shadow-lg ${
                      alerts.hasOverdue
                        ? 'border-red-400/60 dark:border-red-600/40 hover:border-red-500/70 dark:hover:border-red-600'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-800'
                    }`}
                  >
                    {/* Delete btn */}
                    <button
                      onClick={() => {
                        if (confirm(`Excluir "${client.brandName}"?`)) onDeleteClient(client.id);
                      }}
                      className="absolute top-3 right-3 p-1.5 text-zinc-300 dark:text-zinc-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label={`Excluir ${client.brandName}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Brand name + niche */}
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-tight pr-6">
                        {client.brandName}
                      </h3>
                      {(client.niche || client.subniche) && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {[client.niche, client.subniche].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>

                    {/* Alert badges */}
                    {(alerts.hasOverdue || alerts.hasToday) && (
                      <div className="flex flex-wrap gap-1.5">
                        {alerts.hasOverdue && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-500/15 border border-red-400/30">
                            <AlertTriangle className="w-3 h-3 text-red-500" />
                            <span className="text-[10px] font-black text-red-500">Atrasado</span>
                          </div>
                        )}
                        {alerts.hasToday && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-yellow-500/15 border border-yellow-400/30">
                            <Calendar className="w-3 h-3 text-yellow-500" />
                            <span className="text-[10px] font-black text-yellow-600 dark:text-yellow-400">Ocorre Hoje</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Voice tone badge */}
                    <span
                      className={`self-start text-xs font-bold px-2.5 py-1 rounded-lg border ${VOICE_TONE_COLORS[client.voiceTone]}`}
                    >
                      🎙️ {client.voiceTone}
                    </span>

                    {/* CTA preview */}
                    {client.defaultCta && (
                      <p className="text-xs text-zinc-400 italic line-clamp-2">
                        &ldquo;{client.defaultCta}&rdquo;
                      </p>
                    )}

                    {/* Action buttons */}
                    <div className="mt-auto flex gap-2">
                      <button
                        className="flex-1 flex items-center justify-between px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:border-emerald-400 dark:hover:border-emerald-700 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                        onClick={() => setSelectedClient(client)}
                      >
                        Entrar no Painel <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-500 dark:text-zinc-500 hover:border-violet-400 dark:hover:border-violet-700 hover:text-violet-600 dark:hover:text-violet-400 transition-all"
                        onClick={() => setPortalClient(client)}
                        title="Ver Portal do Cliente"
                      >
                        <Globe className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Add card */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:border-emerald-400 hover:text-emerald-500 transition-all min-h-[180px]"
              >
                <Plus className="w-6 h-6" />
                <span className="text-sm font-bold">Novo Cliente</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ── FAB Mobile ── */}
      <div className="fixed bottom-6 right-6 sm:hidden z-40">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-sm shadow-2xl shadow-emerald-500/40 hover:opacity-90 transition-all"
        >
          <Plus className="w-5 h-5" /> Novo
        </button>
      </div>

      <ClientOnboardingModal
        isOpen={isModalOpen}
        onSave={onSaveClient}
        onClose={() => setIsModalOpen(false)}
      />

      <TeamModal
        isOpen={isTeamOpen}
        onClose={() => setIsTeamOpen(false)}
      />
    </div>
  );
};

export default ClientsHub;
