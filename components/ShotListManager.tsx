'use client';

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Video, 
  MoreVertical, 
  ChevronRight, 
  Search, 
  Calendar,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { ShotList, ShotItem } from '@/types';

interface ShotListManagerProps {
  shotLists: ShotList[];
  onSaveList: (list: ShotList) => void;
  onDeleteList: (id: string) => void;
  onBack: () => void;
}

const ShotListManager: React.FC<ShotListManagerProps> = ({ shotLists, onSaveList, onDeleteList, onBack }) => {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  // States for adding a new shot (Fixing button interaction)
  const [isAddingShot, setIsAddingShot] = useState(false);
  const [newShotScene, setNewShotScene] = useState('');
  const [newShotDesc, setNewShotDesc] = useState('');

  const activeList = shotLists.find(l => l.id === activeListId);

  const createList = () => {
    if (!newListName.trim()) return;
    const newList: ShotList = {
      id: crypto.randomUUID(),
      title: newListName,
      items: [],
      createdAt: Date.now()
    };
    onSaveList(newList);
    setNewListName('');
    setIsAddingList(false);
    setActiveListId(newList.id);
  };

  const toggleShot = (shotId: string) => {
    if (!activeList) return;
    const updatedItems = activeList.items.map(item => 
      item.id === shotId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    onSaveList({ ...activeList, items: updatedItems });
  };

  // Function to open the modal instead of browser prompt
  const openAddShotModal = () => {
    setNewShotScene('');
    setNewShotDesc('');
    setIsAddingShot(true);
  };

  const confirmAddShot = () => {
    if (!activeList || !newShotScene.trim()) return;

    const newItem: ShotItem = {
      id: crypto.randomUUID(),
      scene: newShotScene,
      description: newShotDesc,
      isCompleted: false
    };
    onSaveList({ ...activeList, items: [...activeList.items, newItem] });
    setIsAddingShot(false);
  };

  const completedCount = activeList?.items.filter(i => i.isCompleted).length || 0;
  const totalCount = activeList?.items.length || 0;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (activeList) {
    return (
      <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-300 relative">
        <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setActiveListId(null)} className="p-2 -ml-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Lista de Gravação</span>
            <div className="w-5 h-5" />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white leading-tight">{activeList.title}</h1>
              <p className="text-xs text-zinc-500 mt-1">{completedCount} de {totalCount} takes gravados</p>
            </div>
            <div className="flex-1 max-w-xs space-y-2">
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                <span>Progresso</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto space-y-3">
            {activeList.items.length === 0 ? (
              <div className="py-20 text-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum take nesta lista ainda.</p>
                <button onClick={openAddShotModal} className="mt-4 text-emerald-600 font-bold text-sm hover:underline">Adicionar Primeiro Take</button>
              </div>
            ) : (
              activeList.items.map((item, idx) => (
                <div key={item.id} className={`flex items-start gap-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all shadow-sm ${item.isCompleted ? 'opacity-60 bg-zinc-50 dark:bg-zinc-950 border-emerald-500/30' : 'hover:border-emerald-500'}`}>
                  <button onClick={() => toggleShot(item.id)} className="mt-0.5 flex-shrink-0">
                    {item.isCompleted ? <CheckCircle2 className="w-7 h-7 text-emerald-500" /> : <Circle className="w-7 h-7 text-zinc-300" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500 uppercase">Shot {idx + 1}</span>
                      <h3 className={`font-bold text-zinc-900 dark:text-white truncate ${item.isCompleted ? 'line-through text-zinc-400' : ''}`}>{item.scene}</h3>
                    </div>
                    {item.description && <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{item.description}</p>}
                  </div>
                  <button 
                    onClick={() => {
                        const updatedItems = activeList.items.filter(i => i.id !== item.id);
                        onSaveList({ ...activeList, items: updatedItems });
                    }}
                    className="text-zinc-300 hover:text-red-500 transition-colors"
                  >
                      <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
            
            <button 
              onClick={openAddShotModal}
              className="w-full flex items-center justify-center gap-2 p-5 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 hover:border-emerald-500 hover:text-emerald-500 transition-all mt-6"
            >
              <Plus className="w-5 h-5" />
              <span className="font-bold">Adicionar Take</span>
            </button>
          </div>
        </main>

        {/* Modal para Adicionar Take */}
        {isAddingShot && (
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom-10 duration-300">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">Novo Take</h3>
                        <button onClick={() => setIsAddingShot(false)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Cena / Shot</label>
                            <input 
                              autoFocus
                              type="text" 
                              value={newShotScene}
                              onChange={(e) => setNewShotScene(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && confirmAddShot()}
                              placeholder="Ex: Close na xícara de café"
                              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Descrição Visual (Opcional)</label>
                            <textarea 
                              value={newShotDesc}
                              onChange={(e) => setNewShotDesc(e.target.value)}
                              placeholder="Detalhes de movimento, lente ou luz..."
                              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500 h-24 resize-none"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={() => setIsAddingShot(false)} className="flex-1 px-4 py-3 text-zinc-500 font-bold text-sm">Cancelar</button>
                            <button onClick={confirmAddShot} className="flex-1 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 py-3 hover:bg-emerald-700 transition-all">Salvar Take</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-300">
      <header className="px-6 py-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-8">
            <button onClick={onBack} className="p-2 -ml-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-2xl">
                <Video className="w-8 h-8" />
            </div>
        </div>
        <div className="max-w-5xl mx-auto w-full">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">Lista de Gravação</h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Acompanhe seus takes no set. Tique o que já foi gravado.</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        <div className="max-w-5xl mx-auto w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button 
                    onClick={() => setIsAddingList(true)}
                    className="flex flex-col items-center justify-center p-8 bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-emerald-500 group transition-all h-[200px]"
                >
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-zinc-900 dark:text-white">Nova Lista</h3>
                </button>

                {shotLists.map(list => {
                    const completed = list.items.filter(i => i.isCompleted).length;
                    const total = list.items.length;
                    const perc = total > 0 ? (completed / total) * 100 : 0;

                    return (
                        <div key={list.id} className="group relative flex flex-col p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm hover:shadow-xl transition-all h-[200px]">
                            <button 
                                onClick={() => setActiveListId(list.id)}
                                className="flex-1 flex flex-col items-start w-full text-left"
                            >
                                <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800 rounded-xl mb-4 group-hover:text-emerald-500 transition-colors">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-1 truncate w-full">{list.title}</h3>
                                <div className="text-xs text-zinc-500 mb-4">{new Date(list.createdAt).toLocaleDateString()}</div>
                                
                                <div className="mt-auto w-full space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                        <span>{completed}/{total} Takes</span>
                                        <span className="text-emerald-500">{Math.round(perc)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${perc}%` }} />
                                    </div>
                                </div>
                            </button>
                            <button 
                                onClick={() => { if(confirm("Excluir lista?")) onDeleteList(list.id) }}
                                className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
      </main>

      {isAddingList && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white dark:bg-zinc-900 w-full max-w-md p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Novo Vídeo para Gravar</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 block">Título do Projeto</label>
                          <input 
                            autoFocus
                            type="text" 
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && createList()}
                            placeholder="Ex: Reels Café #01"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-zinc-900 dark:text-white focus:outline-none focus:border-emerald-500"
                          />
                      </div>
                      <div className="flex gap-3">
                          <button onClick={() => setIsAddingList(false)} className="flex-1 px-4 py-3 text-zinc-500 font-bold text-sm">Cancelar</button>
                          <button onClick={createList} className="flex-1 bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 py-3 hover:bg-emerald-700 transition-all">Criar Lista</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ShotListManager;
