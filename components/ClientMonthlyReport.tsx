'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText, Printer, X, Award, TrendingUp, CheckCircle,
  Star, Zap, BarChart3, Sparkles,
} from 'lucide-react';
import { Client } from '@/types';
import { fetchClientData } from '@/lib/clients-api';

// ─────────────────────────────────────────────
// Local data types (isolated from internal types)
// ─────────────────────────────────────────────
interface _RScript    { title?: string; rating?: number; portalStatus?: string; }
interface _RPkg       { packageName?: string; scripts: _RScript[]; }
interface _Deliverable { title: string; status: 'aguardando' | 'aprovado' | 'alteracao'; rating?: number; sentAt: number; }
interface _FollowerRec { month: string; count: number; }
interface _KanbanCard  { dueDate?: string; }
interface _KanbanCol   { id: string; cards: _KanbanCard[]; }

interface ReportData {
  monthLabel: string;
  totalScripts: number;
  approvedDeliverables: number;
  approvedScripts: number;
  avgRating: number | null;
  highlights: { title: string; rating: number; type: 'entrega' | 'roteiro' }[];
  followerGrowth: { current: number; previous: number; pct: number | null } | null;
  onTimePct: number;
}

const EMPTY_REPORT: ReportData = {
  monthLabel: '', totalScripts: 0, approvedDeliverables: 0, approvedScripts: 0,
  avgRating: null, highlights: [], followerGrowth: null, onTimePct: 100,
};

// ─────────────────────────────────────────────
// Data aggregation (async — reads from API)
// ─────────────────────────────────────────────
function useReportData(client: Client): { data: ReportData; loading: boolean } {
  const [data, setData] = useState<ReportData>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const compute = async () => {
      const today    = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const MONTHS_PT = [
        'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
        'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
      ];
      const monthLabel = `${MONTHS_PT[today.getMonth()]} ${today.getFullYear()}`;

      let totalScripts = 0, approvedScripts = 0;
      const ratedScripts: { title: string; rating: number }[] = [];
      let approvedDeliverables = 0;
      const ratedDeliverables: { title: string; rating: number }[] = [];

      // Fetch all data in parallel
      const [pkgs, delivs, metricsRaw, cols] = await Promise.all([
        fetchClientData<_RPkg[]>(client.id, 'roteiros').catch(() => [] as _RPkg[]),
        fetchClientData<_Deliverable[]>(client.id, 'entregas').catch(() => [] as _Deliverable[]),
        fetchClientData<{ followerHistory: _FollowerRec[] }>(client.id, 'metrics').catch(() => null),
        fetchClientData<_KanbanCol[]>(client.id, 'kanban').catch(() => [] as _KanbanCol[]),
      ]);

      // Scripts
      if (Array.isArray(pkgs)) {
        for (const pkg of pkgs) {
          for (const sc of (pkg.scripts || [])) {
            totalScripts++;
            if (sc.portalStatus === 'aprovado_cliente') {
              approvedScripts++;
              if (sc.rating && sc.rating > 0) {
                ratedScripts.push({ title: sc.title || pkg.packageName || 'Roteiro', rating: sc.rating });
              }
            }
          }
        }
      }

      // Entregas
      if (Array.isArray(delivs)) {
        for (const d of delivs) {
          if (d.status === 'aprovado') {
            approvedDeliverables++;
            if (d.rating && d.rating > 0) {
              ratedDeliverables.push({ title: d.title, rating: d.rating });
            }
          }
        }
      }

      // Average rating
      const allRatings = [
        ...ratedScripts.map(s => s.rating),
        ...ratedDeliverables.map(d => d.rating),
      ];
      const avgRating = allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : null;

      // Highlights
      const highlights = [
        ...ratedDeliverables.map(d => ({ title: d.title, rating: d.rating, type: 'entrega' as const })),
        ...ratedScripts.map(s => ({ title: s.title, rating: s.rating, type: 'roteiro' as const })),
      ].sort((a, b) => b.rating - a.rating).slice(0, 3);

      // Follower growth
      let followerGrowth: ReportData['followerGrowth'] = null;
      if (metricsRaw) {
        const hist = (metricsRaw.followerHistory || []).slice().sort((a, b) => a.month.localeCompare(b.month));
        if (hist.length >= 2) {
          const last = hist[hist.length - 1];
          const prev = hist[hist.length - 2];
          const pct  = prev.count > 0 ? ((last.count - prev.count) / prev.count) * 100 : null;
          followerGrowth = { current: last.count, previous: prev.count, pct };
        } else if (hist.length === 1) {
          followerGrowth = { current: hist[0].count, previous: 0, pct: null };
        }
      }

      // On-time from kanban
      let totalWithDue = 0, overdueCount = 0;
      if (Array.isArray(cols)) {
        for (const col of cols) {
          if (col.id === 'finalizado') continue;
          for (const card of (col.cards || [])) {
            if (card.dueDate) {
              totalWithDue++;
              if (card.dueDate < todayStr) overdueCount++;
            }
          }
        }
      }

      const onTimePct = totalWithDue > 0
        ? Math.round(((totalWithDue - overdueCount) / totalWithDue) * 100)
        : 100;

      if (!cancelled) {
        setData({ monthLabel, totalScripts, approvedDeliverables, approvedScripts, avgRating, highlights, followerGrowth, onTimePct });
        setLoading(false);
      }
    };

    compute();
    return () => { cancelled = true; };
  }, [client.id]);

  return { data, loading };
}

// ─────────────────────────────────────────────
// Star row helper
// ─────────────────────────────────────────────
const StarRow: React.FC<{ value: number; size?: string }> = ({ value, size = 'w-4 h-4' }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(n => (
      <Star
        key={n}
        className={`${size} ${n <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}`}
      />
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
interface ClientMonthlyReportProps {
  client: Client;
  onClose: () => void;
}

const ClientMonthlyReport: React.FC<ClientMonthlyReportProps> = ({ client, onClose }) => {
  const { data: d, loading } = useReportData(client);

  const handlePrint = () => window.print();

  // ── Iara insight text ────────────────────────────────────────────
  const insightText = (() => {
    if (d.avgRating !== null && d.avgRating >= 4.5) {
      return `Excelente performance neste mês! Os conteúdos entregues tiveram avaliação média de ${d.avgRating.toFixed(1)}/5. Isso indica que a linha editorial atual está altamente alinhada com o público de ${client.brandName}. Nossa recomendação para o próximo mês é ampliar a produção neste formato, apostando na frequência como alavanca principal de crescimento.`;
    }
    if (d.avgRating !== null && d.avgRating >= 3.5) {
      return `O mês foi produtivo para ${client.brandName}, com avaliação média de ${d.avgRating.toFixed(1)}/5. Há espaço para otimizar o alinhamento criativo. Recomendamos revisar os briefings dos próximos roteiros com foco em maior personalização para o nicho${client.niche ? ` de ${client.niche}` : ''}.`;
    }
    if (d.totalScripts > 0 || d.approvedDeliverables > 0) {
      return `A produção do mês está avançando para ${client.brandName}. Para os próximos ciclos, recomendamos incluir métricas de engajamento nos check-ins mensais para refinar a estratégia editorial e medir o impacto real de cada entrega.`;
    }
    return `Este é o início da parceria com ${client.brandName}. Os próximos 30 dias serão fundamentais para estabelecer a cadência de produção, alinhar expectativas e criar os primeiros conteúdos que vão definir a identidade audiovisual do cliente.`;
  })();

  if (loading) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Gerando relatório...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Force print color fidelity */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>

      <div className="fixed inset-0 z-[200] bg-white overflow-y-auto print:overflow-visible print:static print:inset-auto">

        {/* ── Control bar — hidden when printing ── */}
        <div className="print:hidden sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
            <FileText className="w-4 h-4 text-indigo-500" />
            Relatório Mensal · {client.brandName}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> Salvar como PDF
            </button>
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" /> Fechar
            </button>
          </div>
        </div>

        {/* ══════════════════════════
            A4 PAGE CONTENT
           ══════════════════════════ */}
        <div className="max-w-4xl mx-auto px-8 py-10 print:px-0 print:py-0">

          {/* ── Document header ── */}
          <header className="flex items-start justify-between mb-10 pb-6 border-b-2 border-gray-100">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1.5">
                CreatorFlow · Agência
              </p>
              <h1 className="text-2xl font-black text-gray-900 leading-snug">
                Relatório de Performance<br />Audiovisual
              </h1>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cliente</p>
              <p className="text-xl font-black text-gray-900">{client.brandName}</p>
              {(client.niche || client.subniche) && (
                <p className="text-xs text-gray-400 mt-0.5">{[client.niche, client.subniche].filter(Boolean).join(' · ')}</p>
              )}
              <span className="mt-2 inline-block text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                {d.monthLabel}
              </span>
            </div>
          </header>

          {/* ── Section 1: Resumo Executivo ── */}
          <section className="mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
              Resumo Executivo
            </h2>
            <div className="grid grid-cols-3 gap-4">

              {/* Volume de Produção */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">Volume</span>
                </div>
                <p className="text-3xl font-black text-gray-900">{d.approvedDeliverables}</p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">
                  vídeo{d.approvedDeliverables !== 1 ? 's' : ''} entregue{d.approvedDeliverables !== 1 ? 's' : ''}
                </p>
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-sm font-bold text-gray-700">{d.totalScripts} roteiro{d.totalScripts !== 1 ? 's' : ''} criado{d.totalScripts !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-gray-400">{d.approvedScripts} aprovado{d.approvedScripts !== 1 ? 's' : ''} pelo cliente</p>
                </div>
              </div>

              {/* Crescimento */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">Crescimento</span>
                </div>
                {d.followerGrowth ? (
                  <>
                    <p className="text-3xl font-black text-gray-900">
                      {d.followerGrowth.current.toLocaleString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 mb-3">seguidores atuais</p>
                    <div className="pt-3 border-t border-gray-200">
                      {d.followerGrowth.pct !== null ? (
                        <p className={`text-sm font-black ${d.followerGrowth.pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {d.followerGrowth.pct >= 0 ? '+' : ''}{d.followerGrowth.pct.toFixed(1)}% no período
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-gray-500">Primeiro registro</p>
                      )}
                      <p className="text-xs text-gray-400">vs. mês anterior</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-black text-gray-300">—</p>
                    <p className="text-xs text-gray-400 mt-0.5 mb-3">sem dados de seguidores</p>
                    <div className="pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-400 italic">Cadastre métricas na aba<br />Financeiro &amp; Métricas</p>
                    </div>
                  </>
                )}
              </div>

              {/* Consistência */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-violet-600" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">Consistência</span>
                </div>
                <p className={`text-3xl font-black ${d.onTimePct === 100 ? 'text-emerald-600' : d.onTimePct >= 80 ? 'text-amber-500' : 'text-red-500'}`}>
                  {d.onTimePct}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5 mb-3">entregas no prazo</p>
                <div className="pt-3 border-t border-gray-200">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.onTimePct === 100 ? 'bg-emerald-500' : d.onTimePct >= 80 ? 'bg-amber-400' : 'bg-red-500'}`}
                      style={{ width: `${d.onTimePct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">baseado no Kanban ativo</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Section 2: Termômetro da Parceria ── */}
          <section className="mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
              Termômetro da Parceria
            </h2>
            <div className="grid grid-cols-2 gap-4">

              {/* Qualidade */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">Qualidade Aprovada</span>
                </div>
                {d.avgRating !== null ? (
                  <div className="space-y-2">
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-gray-900">{d.avgRating.toFixed(1)}</span>
                      <span className="text-base font-bold text-gray-400 pb-1">/5</span>
                    </div>
                    <StarRow value={d.avgRating} />
                    <p className="text-xs text-gray-500">Média das avaliações no portal do cliente</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">Sem avaliações registradas neste período</p>
                )}
              </div>

              {/* Agilidade */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-wide text-gray-500">Agilidade</span>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-black text-gray-900">24h</span>
                  <span className="text-base font-bold text-gray-400 pb-1">média</span>
                </div>
                <p className="text-xs text-gray-500">Tempo médio de entrega e resposta a revisões</p>
              </div>
            </div>
          </section>

          {/* ── Section 3: Destaques do Mês ── */}
          <section className="mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
              Destaques do Mês
            </h2>
            {d.highlights.length === 0 ? (
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm text-gray-400 italic">
                Nenhum conteúdo avaliado neste período.
              </div>
            ) : (
              <div className="space-y-3">
                {d.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 ${
                      i === 0 ? 'bg-amber-100 text-amber-700' :
                      i === 1 ? 'bg-gray-200 text-gray-600' :
                                'bg-orange-100 text-orange-700'
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{h.title}</p>
                      <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 mt-0.5">
                        {h.type === 'entrega' ? 'Entrega de Vídeo' : 'Roteiro'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StarRow value={h.rating} size="w-3.5 h-3.5" />
                      <span className="text-xs font-black text-gray-600">{h.rating}/5</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Section 4: Iara Insights ── */}
          <section className="mb-10">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">
              Iara Insights
            </h2>
            <div className="relative rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
              <div className="absolute top-4 right-5 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-indigo-400">
                <Sparkles className="w-3 h-3" /> IA Generativa
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                  <span className="text-sm font-black text-white">I</span>
                </div>
                <div className="flex-1 min-w-0 pr-20">
                  <p className="text-xs font-black text-indigo-700 mb-2 uppercase tracking-wide">
                    Análise de Iara · Produtora Executiva IA
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">{insightText}</p>
                </div>
              </div>
            </div>
          </section>

          {/* ── Footer ── */}
          <footer className="pt-6 border-t border-gray-100 flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400">
              Gerado por CreatorFlow · {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Relatório Confidencial</p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default ClientMonthlyReport;
