'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  UserPlus,
  X,
  Search,
  User,
  Phone,
  Mail,
  Check,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import type { ExecutiveProject, TeamMember, Freelancer } from '@/types';

// ─── Storage helpers ──────────────────────────────────────────────────────────

const FREELANCERS_KEY = 'freelancers_db';

function loadFreelancers(): Freelancer[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(FREELANCERS_KEY);
    return s ? (JSON.parse(s) as Freelancer[]) : [];
  } catch {
    return [];
  }
}

function saveFreelancers(list: Freelancer[]): void {
  try {
    localStorage.setItem(FREELANCERS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

// ─── Scale Modal ──────────────────────────────────────────────────────────────

type ModalView = 'select' | 'new' | 'configure';

interface ScaleModalProps {
  onClose: () => void;
  onAdd: (member: TeamMember) => void;
}

function ScaleModal({ onClose, onAdd }: ScaleModalProps) {
  const [view, setView]             = useState<ModalView>('select');
  const [freelancers, setFreelancers] = useState<Freelancer[]>(loadFreelancers);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState<Freelancer | null>(null);

  // New freelancer form state
  const [newName, setNewName]   = useState('');
  const [newRole, setNewRole]   = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRate, setNewRate]   = useState('');

  // Allocation config state
  const [days, setDays]           = useState(1);
  const [agreedRate, setAgreedRate] = useState(0);

  const filtered = useMemo(
    () =>
      freelancers.filter(
        f =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.role.toLowerCase().includes(search.toLowerCase())
      ),
    [freelancers, search]
  );

  const goToConfigure = (f: Freelancer) => {
    setSelected(f);
    setAgreedRate(f.baseDailyRate);
    setView('configure');
  };

  const handleRegisterNew = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(newRate) || 0;
    const fl: Freelancer = {
      id: `fl_${Date.now()}`,
      name: newName.trim(),
      role: newRole.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      baseDailyRate: rate,
    };
    const updated = [...freelancers, fl];
    setFreelancers(updated);
    saveFreelancers(updated);
    goToConfigure(fl);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onAdd({
      id: `tm_${Date.now()}`,
      freelancerId: selected.id,
      name: selected.name,
      role: selected.role,
      phone: selected.phone,
      email: selected.email,
      days,
      agreedRate,
      totalCost: days * agreedRate,
    });
  };

  const titleByView: Record<ModalView, string> = {
    select: 'Escalar Profissional',
    new: 'Cadastrar Freelancer',
    configure: 'Configurar Alocação',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">{titleByView[view]}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── SELECT view ── */}
        {view === 'select' && (
          <div className="p-5 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nome ou função..."
                className="w-full pl-9 pr-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Freelancer list */}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <p className="text-sm text-gray-500 py-6 text-center">
                  {freelancers.length === 0
                    ? 'Banco vazio. Cadastre o primeiro profissional abaixo.'
                    : 'Nenhum resultado para a busca.'}
                </p>
              ) : (
                filtered.map(f => (
                  <button
                    key={f.id}
                    onClick={() => goToConfigure(f)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white truncate">{f.name}</div>
                      <div className="text-xs text-gray-500 truncate">
                        {f.role} · {formatCurrency(f.baseDailyRate)}/dia
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                  </button>
                ))
              )}
            </div>

            {/* Register new */}
            <div className="border-t border-gray-800 pt-4">
              <button
                onClick={() => setView('new')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-700 rounded-xl text-sm font-bold text-gray-300 hover:text-white hover:border-gray-600 hover:bg-gray-800 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Cadastrar Novo Freelancer
              </button>
            </div>
          </div>
        )}

        {/* ── NEW FREELANCER view ── */}
        {view === 'new' && (
          <form onSubmit={handleRegisterNew} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="João Silva"
                required
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Função / Cargo
              </label>
              <input
                type="text"
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                placeholder="Cinegrafista A"
                required
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Telefone
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="(11) 9 9999-9999"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="joao@email.com"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Diária Base (R$)
              </label>
              <input
                type="number"
                value={newRate}
                onChange={e => setNewRate(e.target.value)}
                placeholder="800"
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setView('select')}
                className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Salvar e Continuar
              </button>
            </div>
          </form>
        )}

        {/* ── CONFIGURE ALLOCATION view ── */}
        {view === 'configure' && selected && (
          <div className="px-6 py-5 space-y-5">
            {/* Selected professional */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white">{selected.name}</div>
                <div className="text-xs text-gray-500">{selected.role}</div>
              </div>
              <button
                onClick={() => { setSelected(null); setView('select'); }}
                className="p-1 text-gray-600 hover:text-gray-400 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Days + Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Diárias no Projeto
                </label>
                <input
                  type="number"
                  value={days}
                  onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  Custo / Diária (R$)
                </label>
                <input
                  type="number"
                  value={agreedRate}
                  onChange={e => setAgreedRate(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Total preview */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-gray-800/50 border border-gray-700/50 rounded-xl">
              <span className="text-xs font-black text-gray-500 uppercase tracking-wider">
                Custo Total desta Alocação
              </span>
              <span className="text-lg font-black text-white tabular-nums">
                {formatCurrency(days * agreedRate)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setView('select')}
                className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
              >
                <Check className="w-4 h-4" />
                Escalar para o Projeto
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  project: ExecutiveProject;
  onUpdate: (updated: ExecutiveProject) => void;
  readOnly?: boolean;
}

export default function ExecutiveTeamManagement({ project, onUpdate, readOnly = false }: Props) {
  const [showModal, setShowModal] = useState(false);

  const totalTeamCost = project.teamMembers.reduce((sum, m) => sum + m.totalCost, 0);

  const handleAddMember = useCallback(
    (member: TeamMember) => {
      onUpdate({ ...project, teamMembers: [...project.teamMembers, member] });
      setShowModal(false);
    },
    [project, onUpdate]
  );

  const handleRemoveMember = useCallback(
    (memberId: string) => {
      onUpdate({
        ...project,
        teamMembers: project.teamMembers.filter(m => m.id !== memberId),
      });
    },
    [project, onUpdate]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5">

        {/* Summary + action bar */}
        {!readOnly ? (
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="px-5 py-3.5 bg-gray-900 border border-gray-800 rounded-2xl">
              <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
                Custo Total da Equipe
              </div>
              <div className="text-2xl font-black text-white tabular-nums">
                {formatCurrency(totalTeamCost)}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                {project.teamMembers.length} profissional{project.teamMembers.length !== 1 ? 'is' : ''} escalado{project.teamMembers.length !== 1 ? 's' : ''}
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Escalar Profissional
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="text-base font-bold text-white">Equipe do Projeto</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {project.teamMembers.length} profissional{project.teamMembers.length !== 1 ? 'is' : ''} escalado{project.teamMembers.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Empty state */}
        {project.teamMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mb-4">
              <User className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-base font-bold text-gray-400 mb-1">Nenhum profissional escalado</h3>
            <p className="text-sm text-gray-600">
              {readOnly
                ? 'Nenhum profissional foi escalado para este projeto.'
                : 'Clique em "Escalar Profissional" para montar a equipe do projeto.'}
            </p>
          </div>
        ) : (
          /* Team table */
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Table header (desktop) */}
            <div className={`hidden gap-4 px-5 py-3 border-b border-gray-800 ${
              readOnly
                ? 'md:grid md:grid-cols-[2fr_1.5fr_2fr_auto]'
                : 'md:grid md:grid-cols-[2fr_1.5fr_2fr_auto_auto_auto_auto]'
            }`}>
              {(readOnly
                ? ['Nome', 'Função', 'Contato', 'Diárias']
                : ['Nome', 'Função', 'Contato', 'Diárias', 'Custo/Dia', 'Custo Total', '']
              ).map(h => (
                <span
                  key={h}
                  className="text-[9px] font-black text-gray-500 uppercase tracking-widest"
                >
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {project.teamMembers.map((member, idx) => (
              <div
                key={member.id}
                className={`flex flex-col gap-2 items-start px-5 py-4 ${
                  readOnly
                    ? 'md:grid md:grid-cols-[2fr_1.5fr_2fr_auto] md:gap-4 md:items-center'
                    : 'md:grid md:grid-cols-[2fr_1.5fr_2fr_auto_auto_auto_auto] md:gap-4 md:items-center'
                } ${
                  idx < project.teamMembers.length - 1 ? 'border-b border-gray-800/50' : ''
                }`}
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="text-sm font-bold text-white truncate">{member.name}</span>
                </div>

                {/* Role */}
                <span className="text-sm text-gray-400 pl-11 md:pl-0 truncate">
                  {member.role}
                </span>

                {/* Contact */}
                <div className="flex flex-col gap-0.5 pl-11 md:pl-0">
                  {member.phone && (
                    <span className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      {member.phone}
                    </span>
                  )}
                  {member.email && (
                    <span className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {member.email}
                    </span>
                  )}
                  {!member.phone && !member.email && (
                    <span className="text-xs text-gray-600">—</span>
                  )}
                </div>

                {/* Days */}
                <span className="text-sm font-bold text-gray-300 pl-11 md:pl-0 whitespace-nowrap">
                  {member.days}d
                </span>

                {/* Agreed rate */}
                {!readOnly && (
                  <span className="text-sm text-gray-400 pl-11 md:pl-0 whitespace-nowrap">
                    {formatCurrency(member.agreedRate)}
                  </span>
                )}

                {/* Total cost */}
                {!readOnly && (
                  <span className="text-sm font-black text-white pl-11 md:pl-0 whitespace-nowrap">
                    {formatCurrency(member.totalCost)}
                  </span>
                )}

                {/* Remove */}
                {!readOnly && (
                  <div className="pl-11 md:pl-0">
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Remover da equipe"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && !readOnly && (
        <ScaleModal onClose={() => setShowModal(false)} onAdd={handleAddMember} />
      )}
    </div>
  );
}
