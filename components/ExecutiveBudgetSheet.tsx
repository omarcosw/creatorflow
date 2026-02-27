'use client';

import React, { useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2 } from 'lucide-react';
import type { ExecutiveProject, BudgetCategory, BudgetItem } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function calcSubtotals(category: BudgetCategory) {
  return category.items.reduce(
    (acc, item) => ({
      budgeted: acc.budgeted + item.budgeted,
      spent: acc.spent + item.actualSpent,
    }),
    { budgeted: 0, spent: 0 }
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  project: ExecutiveProject;
  onUpdate: (updated: ExecutiveProject) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExecutiveBudgetSheet({ project, onUpdate }: Props) {
  const [openCategories, setOpenCategories] = useState<Set<string>>(
    () => new Set(project.budgetCategories.map(c => c.id))
  );

  const toggleCategory = useCallback((id: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const updateCategories = useCallback(
    (categories: BudgetCategory[]) => {
      onUpdate({ ...project, budgetCategories: categories });
    },
    [project, onUpdate]
  );

  // ── Item actions ────────────────────────────────────────────────────────────

  const addItem = useCallback(
    (categoryId: string) => {
      const newItem: BudgetItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: '',
        quantity: 1,
        days: 1,
        unitPrice: 0,
        budgeted: 0,
        actualSpent: 0,
      };
      updateCategories(
        project.budgetCategories.map(cat =>
          cat.id === categoryId ? { ...cat, items: [...cat.items, newItem] } : cat
        )
      );
      setOpenCategories(prev => new Set([...prev, categoryId]));
    },
    [project.budgetCategories, updateCategories]
  );

  const deleteItem = useCallback(
    (categoryId: string, itemId: string) => {
      updateCategories(
        project.budgetCategories.map(cat =>
          cat.id === categoryId
            ? { ...cat, items: cat.items.filter(i => i.id !== itemId) }
            : cat
        )
      );
    },
    [project.budgetCategories, updateCategories]
  );

  const updateItem = useCallback(
    (
      categoryId: string,
      itemId: string,
      field: keyof BudgetItem,
      value: string | number
    ) => {
      updateCategories(
        project.budgetCategories.map(cat => {
          if (cat.id !== categoryId) return cat;
          return {
            ...cat,
            items: cat.items.map(item => {
              if (item.id !== itemId) return item;
              const updated = { ...item, [field]: value };
              // Auto-calculate budgeted when numeric drivers change
              if (field === 'quantity' || field === 'days' || field === 'unitPrice') {
                updated.budgeted =
                  (field === 'quantity' ? (value as number) : updated.quantity) *
                  (field === 'days' ? (value as number) : updated.days) *
                  (field === 'unitPrice' ? (value as number) : updated.unitPrice);
              }
              return updated;
            }),
          };
        })
      );
    },
    [project.budgetCategories, updateCategories]
  );

  // ── Totals ──────────────────────────────────────────────────────────────────

  const { totalBudgeted, totalSpent } = project.budgetCategories.reduce(
    (acc, cat) => {
      const sub = calcSubtotals(cat);
      return {
        totalBudgeted: acc.totalBudgeted + sub.budgeted,
        totalSpent: acc.totalSpent + sub.spent,
      };
    },
    { totalBudgeted: 0, totalSpent: 0 }
  );

  const globalOverBudget = totalSpent > totalBudgeted && totalBudgeted > 0;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">

      {/* ── Scrollable categories ── */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {project.budgetCategories.map(category => {
          const { budgeted: catBudgeted, spent: catSpent } = calcSubtotals(category);
          const catOver = catSpent > catBudgeted && catBudgeted > 0;
          const isOpen  = openCategories.has(category.id);

          return (
            <div
              key={category.id}
              className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden"
            >
              {/* Accordion header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-800/30 transition-colors"
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                )}
                <span className="flex-1 text-sm font-bold text-white text-left">
                  {category.name}
                </span>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">
                      Orçado
                    </div>
                    <div className="text-sm font-bold text-gray-300">
                      {formatCurrency(catBudgeted)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">
                      Executado
                    </div>
                    <div
                      className={`text-sm font-bold ${
                        catOver ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(catSpent)}
                    </div>
                  </div>
                </div>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div className="border-t border-gray-800/60">

                  {/* Table */}
                  {category.items.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-800/50">
                            {[
                              'Item',
                              'Qtd',
                              'Diárias',
                              'Vlr. Unit (R$)',
                              'Orçado',
                              'Executado (R$)',
                              '',
                            ].map(col => (
                              <th
                                key={col}
                                className="px-4 py-2.5 text-left text-[9px] font-black text-gray-500 uppercase tracking-widest whitespace-nowrap"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {category.items.map((item, idx) => {
                            const isOver =
                              item.actualSpent > item.budgeted && item.budgeted > 0;
                            return (
                              <tr
                                key={item.id}
                                className={`border-b border-gray-800/20 last:border-0 ${
                                  idx % 2 !== 0 ? 'bg-gray-800/10' : ''
                                }`}
                              >
                                {/* Item name */}
                                <td className="px-4 py-2 min-w-[160px]">
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={e =>
                                      updateItem(category.id, item.id, 'name', e.target.value)
                                    }
                                    placeholder="Nome do item"
                                    className="w-full bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none focus:bg-gray-800 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                                  />
                                </td>

                                {/* Qty */}
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={e =>
                                      updateItem(
                                        category.id,
                                        item.id,
                                        'quantity',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-16 bg-transparent text-sm text-gray-300 text-right focus:outline-none focus:bg-gray-800 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                                    min="0"
                                  />
                                </td>

                                {/* Days */}
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    value={item.days}
                                    onChange={e =>
                                      updateItem(
                                        category.id,
                                        item.id,
                                        'days',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-16 bg-transparent text-sm text-gray-300 text-right focus:outline-none focus:bg-gray-800 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                                    min="0"
                                  />
                                </td>

                                {/* Unit price */}
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={e =>
                                      updateItem(
                                        category.id,
                                        item.id,
                                        'unitPrice',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-28 bg-transparent text-sm text-gray-300 text-right focus:outline-none focus:bg-gray-800 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors"
                                    min="0"
                                    step="0.01"
                                  />
                                </td>

                                {/* Budgeted (read-only, auto) */}
                                <td className="px-4 py-2 text-right">
                                  <span className="text-sm font-bold text-gray-300 whitespace-nowrap">
                                    {formatCurrency(item.budgeted)}
                                  </span>
                                </td>

                                {/* Actual spent */}
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    value={item.actualSpent}
                                    onChange={e =>
                                      updateItem(
                                        category.id,
                                        item.id,
                                        'actualSpent',
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className={`w-28 bg-transparent text-sm text-right focus:outline-none focus:bg-gray-800 rounded-lg px-2 py-1 -mx-2 -my-1 transition-colors font-bold ${
                                      isOver ? 'text-red-400' : 'text-emerald-400'
                                    }`}
                                    min="0"
                                    step="0.01"
                                  />
                                </td>

                                {/* Delete */}
                                <td className="px-4 py-2">
                                  <button
                                    onClick={() => deleteItem(category.id, item.id)}
                                    className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    title="Remover item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Empty state */}
                  {category.items.length === 0 && (
                    <p className="px-5 py-4 text-sm text-gray-600">
                      Nenhum item cadastrado.
                    </p>
                  )}

                  {/* Add item button */}
                  <div className="px-4 py-3 border-t border-gray-800/40">
                    <button
                      onClick={() => addItem(category.id)}
                      className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Item
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Global totals footer (sticky) ── */}
      <div className="flex-shrink-0 bg-gray-950 border-t border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between gap-6 max-w-5xl">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Total do Projeto
          </span>

          <div className="flex items-center gap-8">
            {/* Total budgeted */}
            <div className="text-right">
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">
                Total Orçado
              </div>
              <div className="text-xl font-black text-white tabular-nums">
                {formatCurrency(totalBudgeted)}
              </div>
            </div>

            <div className="w-px h-8 bg-gray-800" />

            {/* Total spent */}
            <div className="text-right">
              <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-0.5">
                Total Executado
              </div>
              <div
                className={`text-xl font-black tabular-nums ${
                  globalOverBudget ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {formatCurrency(totalSpent)}
              </div>
            </div>

            {/* Over-budget alert pill */}
            {globalOverBudget && (
              <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-xl">
                <span className="text-xs font-black text-red-400 uppercase tracking-wider">
                  Acima do orçamento
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
