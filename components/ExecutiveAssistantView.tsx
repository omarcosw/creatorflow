'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Plus,
  X,
  Activity,
  Calculator,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Menu,
  Briefcase,
} from 'lucide-react';
import type { ProjectStatus, ExecutiveProject, BudgetCategory } from '@/types';
import ExecutiveBudgetSheet from '@/components/ExecutiveBudgetSheet';

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'executive_projects';

const DEFAULT_CATEGORY_NAMES = [
  'Direção', 'Produção', 'Câmera', 'Luz e Maquinária', 'Arte', 'Pós-Produção',
];

function createDefaultBudgetCategories(): BudgetCategory[] {
  return DEFAULT_CATEGORY_NAMES.map((name, i) => ({
    id: `cat_${i}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name,
    items: [],
  }));
}

const MODULES = [
  { id: 'monitoramento', label: 'Central de Monitoramento', icon: Activity },
  { id: 'orcamento',     label: 'Planilha Orçamentária',   icon: Calculator },
  { id: 'equipe',        label: 'Gestão de Equipe',         icon: Users },
  { id: 'cronograma',    label: 'Cronograma',               icon: Calendar },
  { id: 'financeiro',    label: 'Controle Financeiro',      icon: CreditCard },
  { id: 'documentos',    label: 'Documentos',               icon: FileText },
] as const;

type ModuleId = typeof MODULES[number]['id'];

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pre_producao: {
    label: 'Pré-produção',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
  },
  captacao: {
    label: 'Captação',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
  },
  pos: {
    label: 'Pós',
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
  },
  finalizado: {
    label: 'Finalizado',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadProjects(): ExecutiveProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return [];
    const raw = JSON.parse(s) as ExecutiveProject[];
    // Migration: ensure every project has budgetCategories
    return raw.map(p => ({
      ...p,
      budgetCategories: p.budgetCategories ?? createDefaultBudgetCategories(),
    }));
  } catch {
    return [];
  }
}

function saveProjects(projects: ExecutiveProject[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch {
    /* ignore */
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ─── New Project Modal ────────────────────────────────────────────────────────

interface NewProjectModalProps {
  onClose: () => void;
  onSave: (project: ExecutiveProject) => void;
}

function NewProjectModal({ onClose, onSave }: NewProjectModalProps) {
  const [name, setName]           = useState('');
  const [client, setClient]       = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !client.trim() || !startDate || !endDate) return;
    onSave({
      id: `ep_${Date.now()}`,
      name: name.trim(),
      client: client.trim(),
      startDate,
      endDate,
      status: 'pre_producao',
      createdAt: Date.now(),
      budgetCategories: createDefaultBudgetCategories(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">Novo Projeto</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Nome do Projeto
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Campanha Verão 2026"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Cliente
            </label>
            <input
              type="text"
              value={client}
              onChange={e => setClient(e.target.value)}
              placeholder="Ex: Nike Brasil"
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Data de Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Criar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface ExecutiveAssistantViewProps {
  onBack: () => void;
}

export default function ExecutiveAssistantView({ onBack }: ExecutiveAssistantViewProps) {
  const [view, setView]                     = useState<'lobby' | 'project'>('lobby');
  const [selectedProject, setSelectedProject] = useState<ExecutiveProject | null>(null);
  const [projects, setProjects]             = useState<ExecutiveProject[]>(loadProjects);
  const [showModal, setShowModal]           = useState(false);
  const [activeModule, setActiveModule]     = useState<ModuleId>('monitoramento');
  const [sidebarOpen, setSidebarOpen]       = useState(false);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const handleSaveProject = useCallback((project: ExecutiveProject) => {
    setProjects(prev => [project, ...prev]);
    setShowModal(false);
  }, []);

  const handleOpenProject = useCallback((project: ExecutiveProject) => {
    setSelectedProject(project);
    setActiveModule('monitoramento');
    setView('project');
  }, []);

  const handleBackToLobby = useCallback(() => {
    setView('lobby');
    setSelectedProject(null);
    setSidebarOpen(false);
  }, []);

  const handleUpdateProject = useCallback((updatedProject: ExecutiveProject) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  }, []);

  // ── LOBBY ────────────────────────────────────────────────────────────────────

  if (view === 'lobby') {
    return (
      <div className="flex flex-col h-screen bg-gray-950 overflow-hidden">

        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b border-gray-800">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <div className="w-px h-4 bg-gray-800" />
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-bold text-white">Assistente Executivo</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-8">

            {/* Page header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">Projetos Executivos</h1>
                <p className="text-sm text-gray-500 mt-1">Gerencie suas produções de grande porte.</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Novo Projeto
              </button>
            </div>

            {/* Empty state */}
            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mb-4">
                  <Briefcase className="w-7 h-7 text-gray-600" />
                </div>
                <h3 className="text-base font-bold text-gray-400 mb-1">Nenhum projeto ainda</h3>
                <p className="text-sm text-gray-600 mb-6">Crie seu primeiro projeto para começar.</p>
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-bold rounded-xl border border-gray-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo Projeto
                </button>
              </div>
            ) : (
              /* Projects table */
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

                {/* Table header */}
                <div className="hidden md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr] gap-4 px-5 py-3 border-b border-gray-800">
                  {['Projeto', 'Cliente', 'Início', 'Fim', 'Status'].map(h => (
                    <span key={h} className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                      {h}
                    </span>
                  ))}
                </div>

                {/* Table rows */}
                {projects.map((project, idx) => {
                  const st = STATUS_CONFIG[project.status];
                  return (
                    <button
                      key={project.id}
                      onClick={() => handleOpenProject(project)}
                      className={`w-full flex flex-col md:grid md:grid-cols-[2fr_1.5fr_1fr_1fr_1.2fr] gap-2 md:gap-4 items-start md:items-center px-5 py-4 text-left hover:bg-gray-800/50 transition-colors ${
                        idx < projects.length - 1 ? 'border-b border-gray-800/50' : ''
                      }`}
                    >
                      {/* Nome */}
                      <div className="flex items-center gap-3 min-w-0 w-full">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-4 h-4 text-indigo-400" />
                        </div>
                        <span className="text-sm font-bold text-white truncate">{project.name}</span>
                      </div>

                      {/* Cliente */}
                      <span className="text-sm text-gray-400 truncate pl-11 md:pl-0">
                        {project.client}
                      </span>

                      {/* Início */}
                      <span className="text-sm text-gray-500 pl-11 md:pl-0 hidden md:block">
                        {formatDate(project.startDate)}
                      </span>

                      {/* Fim */}
                      <span className="text-sm text-gray-500 pl-11 md:pl-0 hidden md:block">
                        {formatDate(project.endDate)}
                      </span>

                      {/* Status */}
                      <div className="pl-11 md:pl-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${st.color} ${st.bg} ${st.border}`}
                        >
                          {st.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <NewProjectModal onClose={() => setShowModal(false)} onSave={handleSaveProject} />
        )}
      </div>
    );
  }

  // ── PROJECT HUB ──────────────────────────────────────────────────────────────

  const project = selectedProject!;
  const activeModuleConfig = MODULES.find(m => m.id === activeModule)!;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-950">

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 flex flex-col w-64 bg-gray-950 border-r border-gray-800/50
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Sidebar header */}
        <div className="flex-shrink-0 px-4 pt-5 pb-4 border-b border-gray-800/50">
          <button
            onClick={handleBackToLobby}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar ao Lobby
          </button>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-white truncate leading-tight">{project.name}</h1>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">{project.client}</p>
            </div>
          </div>

          {/* Status badge */}
          {(() => {
            const st = STATUS_CONFIG[project.status];
            return (
              <span
                className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border ${st.color} ${st.bg} ${st.border}`}
              >
                {st.label}
              </span>
            );
          })()}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {MODULES.map(mod => {
            const isActive = activeModule === mod.id;
            const Icon = mod.icon;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  setActiveModule(mod.id as ModuleId);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }`}
              >
                <Icon
                  className={`w-[18px] h-[18px] flex-shrink-0 ${
                    isActive ? 'text-indigo-400' : 'text-gray-500'
                  }`}
                />
                <span className="truncate">{mod.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-800/50 bg-gray-950 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-bold text-white truncate block">{project.name}</span>
          </div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-wide shrink-0">
            {activeModuleConfig.label}
          </span>
        </div>

        {/* Content area */}
        <main className="flex-1 overflow-hidden bg-gray-900 flex flex-col">
          {activeModule === 'orcamento' ? (
            <ExecutiveBudgetSheet project={project} onUpdate={handleUpdateProject} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                {(() => {
                  const Icon = activeModuleConfig.icon;
                  return <Icon className="w-12 h-12 text-gray-700 mx-auto mb-4" />;
                })()}
                <h2 className="text-lg font-bold text-gray-500 mb-1">
                  {activeModuleConfig.label}
                </h2>
                <p className="text-sm text-gray-600">Módulo em construção...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
