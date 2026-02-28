'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import type { ExecutiveProject } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(v: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function calcProgress(startDate: string, endDate: string): number {
  const now   = Date.now();
  const start = new Date(startDate + 'T00:00:00').getTime();
  const end   = new Date(endDate   + 'T00:00:00').getTime();
  if (end <= start) return 100;
  return Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
}

function daysRemaining(endDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(endDate + 'T00:00:00');
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  project: ExecutiveProject;
}

export default function ExecutiveMonitoringCenter({ project }: Props) {
  // ── Financial aggregates (budgetCategories) ──────────────────────────────────
  const totalBudgeted = project.budgetCategories.reduce(
    (sum, cat) => sum + cat.items.reduce((s, i) => s + i.budgeted, 0),
    0
  );
  const totalSpent = project.budgetCategories.reduce(
    (sum, cat) => sum + cat.items.reduce((s, i) => s + i.actualSpent, 0),
    0
  );
  const balance       = totalBudgeted - totalSpent;
  const isOverBudget  = balance < 0;
  const spentPercent  = totalBudgeted > 0 ? Math.round((totalSpent / totalBudgeted) * 100) : 0;

  // ── Team cost ────────────────────────────────────────────────────────────────
  const totalTeamCost = project.teamMembers.reduce((sum, m) => sum + m.totalCost, 0);

  // ── Timeline progress ────────────────────────────────────────────────────────
  const progress = calcProgress(project.startDate, project.endDate);
  const daysLeft = daysRemaining(project.endDate);

  // ── Over-budget categories ───────────────────────────────────────────────────
  const overspentCategories = project.budgetCategories.filter(cat => {
    const catBudgeted = cat.items.reduce((s, i) => s + i.budgeted, 0);
    const catSpent    = cat.items.reduce((s, i) => s + i.actualSpent, 0);
    return catSpent > catBudgeted && catBudgeted > 0;
  });

  // ── Done milestones ──────────────────────────────────────────────────────────
  const milestones     = project.milestones ?? [];
  const doneMilestones = milestones.filter(m => m.done).length;

  // ── Auto-generated alerts ────────────────────────────────────────────────────
  type Alert = { kind: 'warning' | 'ok'; text: string };
  const alerts: Alert[] = [];

  if (project.teamMembers.length === 0) {
    alerts.push({ kind: 'warning', text: 'Equipe ainda não foi montada para este projeto.' });
  } else {
    alerts.push({
      kind: 'ok',
      text: `Equipe: ${project.teamMembers.length} profissional${project.teamMembers.length !== 1 ? 'is' : ''} escalado${project.teamMembers.length !== 1 ? 's' : ''}.`,
    });
  }

  if (isOverBudget) {
    alerts.push({ kind: 'warning', text: `Orçamento geral estourado em ${formatCurrency(Math.abs(balance))}.` });
  }

  overspentCategories.forEach(cat => {
    alerts.push({ kind: 'warning', text: `Orçamento de "${cat.name}" ultrapassado.` });
  });

  if (daysLeft < 0) {
    alerts.push({ kind: 'warning', text: `Prazo do projeto encerrado há ${Math.abs(daysLeft)} dia${Math.abs(daysLeft) !== 1 ? 's' : ''}.` });
  } else if (daysLeft <= 7) {
    alerts.push({ kind: 'warning', text: `Projeto encerra em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}.` });
  } else {
    alerts.push({ kind: 'ok', text: `${daysLeft} dias restantes até o encerramento.` });
  }

  if (milestones.length > 0) {
    alerts.push({ kind: 'ok', text: `Cronograma: ${doneMilestones}/${milestones.length} marcos concluídos.` });
  }

  if (alerts.length === 0) {
    alerts.push({ kind: 'ok', text: 'Nenhum alerta no momento.' });
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-4">

      {/* ── Financial KPI cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Total orçado */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
            Orçamento Total Aprovado
          </div>
          <div className="text-2xl font-black text-white tabular-nums">
            {formatCurrency(totalBudgeted)}
          </div>
          <div className="text-xs text-gray-600 mt-1.5">
            Equipe alocada: {formatCurrency(totalTeamCost)}
          </div>
        </div>

        {/* Total executado */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
            Custo Executado Atual
          </div>
          <div className="text-2xl font-black text-white tabular-nums">
            {formatCurrency(totalSpent)}
          </div>
          <div className="text-xs text-gray-600 mt-1.5">
            {totalBudgeted > 0 ? `${spentPercent}% do total orçado` : 'Sem orçamento definido'}
          </div>
        </div>

        {/* Saldo / Déficit */}
        <div className={`rounded-2xl p-5 border ${isOverBudget ? 'bg-red-500/5 border-red-500/20' : 'bg-gray-900 border-gray-800'}`}>
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
            {isOverBudget ? 'Déficit' : 'Saldo Restante'}
          </div>
          <div className={`text-2xl font-black tabular-nums ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
            {formatCurrency(Math.abs(balance))}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {isOverBudget ? (
              <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span className={`text-xs font-bold ${isOverBudget ? 'text-red-400' : 'text-emerald-400'}`}>
              {isOverBudget ? 'Acima do orçamento' : 'Dentro do orçamento'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Timeline progress ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">
              Progresso Temporal
            </div>
            <div className="text-sm font-bold text-white">
              {formatDate(project.startDate)} — {formatDate(project.endDate)}
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-black tabular-nums ${
                daysLeft < 0 ? 'text-red-400' : daysLeft <= 7 ? 'text-amber-400' : 'text-white'
              }`}
            >
              {Math.round(progress)}%
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {daysLeft < 0
                ? `${Math.abs(daysLeft)}d atrasado`
                : daysLeft === 0
                ? 'Encerra hoje'
                : `${daysLeft}d restantes`}
            </div>
          </div>
        </div>
        <div className="relative h-2 rounded-full overflow-hidden bg-gray-800">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
              daysLeft < 0 ? 'bg-red-500' : daysLeft <= 7 ? 'bg-amber-400' : 'bg-indigo-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Team summary ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
          Equipe do Projeto
        </div>
        {project.teamMembers.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum profissional escalado.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {project.teamMembers.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-xl border border-gray-700/50"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-bold text-white">{m.name}</span>
                <span className="text-xs text-gray-500">{m.role}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Alerts ── */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
        <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
          Alertas e Status
        </div>
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl ${
                alert.kind === 'warning'
                  ? 'bg-amber-500/10 border border-amber-500/20'
                  : 'bg-gray-800/40'
              }`}
            >
              {alert.kind === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <span
                className={`text-sm leading-snug ${
                  alert.kind === 'warning' ? 'text-amber-300' : 'text-gray-400'
                }`}
              >
                {alert.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
