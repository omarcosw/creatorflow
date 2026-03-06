'use client';

import { useState } from 'react';
import { X, Calculator, Sparkles } from 'lucide-react';

interface Props {
  onApply: (rate: number) => void;
  onClose: () => void;
}

export default function HourlyRateCalculator({ onApply, onClose }: Props) {
  const [profitGoal, setProfitGoal] = useState(5000);
  const [fixedCosts, setFixedCosts] = useState(1500);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [hoursPerDay, setHoursPerDay] = useState(6);

  const totalMonthly = profitGoal + fixedCosts;
  const monthlyHours = hoursPerDay * daysPerWeek * 4;
  const hourlyRate = monthlyHours > 0 ? totalMonthly / monthlyHours : 0;

  const fmt = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleApply = () => {
    onApply(Math.round(hourlyRate));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-900/50 border border-violet-800/50 flex items-center justify-center">
              <Calculator className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Descubra seu Valor/Hora Ideal
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Calculado com base nos seus objetivos reais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg border border-white/8 bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Meta de Lucro */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">
              Meta de Lucro Mensal
            </label>
            <p className="text-[11px] text-gray-600 mb-2">
              Quanto você quer que sobre limpo no seu bolso todo mês?
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R$</span>
              <input
                type="number"
                value={profitGoal}
                onChange={e => setProfitGoal(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Custos Fixos */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">
              Custos Fixos Mensais
            </label>
            <p className="text-[11px] text-gray-600 mb-2">
              Internet, luz, celular, softwares, contador e impostos médios.
            </p>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">R$</span>
              <input
                type="number"
                value={fixedCosts}
                onChange={e => setFixedCosts(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Dias e Horas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Dias por Semana
              </label>
              <p className="text-[11px] text-gray-600 mb-2">
                Quantos dias você quer trabalhar?
              </p>
              <input
                type="number"
                min={1}
                max={7}
                value={daysPerWeek}
                onChange={e => setDaysPerWeek(Math.min(7, Math.max(1, Number(e.target.value))))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-center focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Horas por Dia
              </label>
              <p className="text-[11px] text-gray-600 mb-2">
                Seja realista: desconte pausas.
              </p>
              <input
                type="number"
                min={1}
                max={12}
                value={hoursPerDay}
                onChange={e => setHoursPerDay(Math.min(12, Math.max(1, Number(e.target.value))))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-center focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Breakdown */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Receita necessária/mês</span>
              <span className="text-gray-300">{fmt(totalMonthly)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Horas trabalháveis/mês</span>
              <span className="text-gray-300">{monthlyHours}h</span>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-emerald-900/40 bg-emerald-900/10 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold">Seu valor/hora ideal</span>
            </div>
            <span className="text-2xl font-black text-emerald-400">{fmt(hourlyRate)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleApply}
            disabled={hourlyRate <= 0}
            className="w-full py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all"
          >
            Aplicar {fmt(Math.round(hourlyRate))} no orçamento
          </button>
        </div>
      </div>
    </div>
  );
}
