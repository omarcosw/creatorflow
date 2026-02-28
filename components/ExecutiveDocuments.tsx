'use client';

import React, { useState, useCallback } from 'react';
import { Plus, X, FileText, LayoutGrid, Monitor, File, ExternalLink, Trash2 } from 'lucide-react';
import type { ExecutiveProject, ProjectDocument, DocumentType } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

type DocTypeConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const DOC_TYPE_CONFIG: Record<DocumentType, DocTypeConfig> = {
  documento:    { label: 'Documento',    icon: FileText   },
  planilha:     { label: 'Planilha',     icon: LayoutGrid },
  apresentacao: { label: 'Apresentação', icon: Monitor    },
  outro:        { label: 'Outro',        icon: File       },
};

const DOC_TYPES: DocumentType[] = ['documento', 'planilha', 'apresentacao', 'outro'];

// ─── Add Document Modal ───────────────────────────────────────────────────────

interface AddDocModalProps {
  onClose: () => void;
  onSave: (doc: ProjectDocument) => void;
}

function AddDocModal({ onClose, onSave }: AddDocModalProps) {
  const [title, setTitle] = useState('');
  const [url, setUrl]     = useState('');
  const [type, setType]   = useState<DocumentType>('documento');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    onSave({
      id: `doc_${Date.now()}`,
      title: title.trim(),
      url: url.trim(),
      type,
      addedAt: Date.now(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-base font-bold text-white">Adicionar Link / Documento</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Contrato de Imagem, Roteiro Final..."
              required
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
              URL / Link
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://docs.google.com/..."
              required
              className="w-full px-3 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DOC_TYPES.map(dt => {
                const cfg  = DOC_TYPE_CONFIG[dt];
                const Icon = cfg.icon;
                return (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setType(dt)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      type === dt
                        ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/40'
                        : 'text-gray-500 border-gray-700 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-bold text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  project: ExecutiveProject;
  onUpdate: (updated: ExecutiveProject) => void;
}

export default function ExecutiveDocuments({ project, onUpdate }: Props) {
  const [showModal, setShowModal] = useState(false);
  const documents = project.documents ?? [];

  const handleAdd = useCallback(
    (doc: ProjectDocument) => {
      onUpdate({ ...project, documents: [...documents, doc] });
      setShowModal(false);
    },
    [project, documents, onUpdate]
  );

  const handleDelete = useCallback(
    (id: string) => {
      onUpdate({ ...project, documents: documents.filter(d => d.id !== id) });
    },
    [project, documents, onUpdate]
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-white">Documentos</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Links, contratos e referências do projeto.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Link
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-800/60 border border-gray-700/50 flex items-center justify-center mb-4">
              <FileText className="w-7 h-7 text-gray-600" />
            </div>
            <h3 className="text-base font-bold text-gray-400 mb-1">Nenhum documento</h3>
            <p className="text-sm text-gray-600">
              Adicione links de contratos, roteiros e apresentações.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => {
              const cfg  = DOC_TYPE_CONFIG[doc.type];
              const Icon = cfg.icon;
              return (
                <div
                  key={doc.id}
                  className="group flex flex-col bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-all"
                >
                  {/* Icon + delete */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-indigo-400" />
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Remover documento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Title */}
                  <div className="flex-1 mb-4">
                    <div className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">
                      {cfg.label}
                    </div>
                    <h3 className="text-sm font-bold text-white leading-snug">{doc.title}</h3>
                  </div>

                  {/* Open link */}
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir link
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <AddDocModal onClose={() => setShowModal(false)} onSave={handleAdd} />
      )}
    </div>
  );
}
