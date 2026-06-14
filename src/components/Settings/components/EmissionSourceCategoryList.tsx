'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { EmissionSourceCategory, EMISSION_GROUPS } from '../types';
import { EMISSION_SOURCE_CATEGORIES_MOCK } from '../data/emission-source-categories.mock';
import { EmissionSourceCategoryFormModal } from './EmissionSourceCategoryFormModal';

const getGroupLabel = (id: string) =>
  EMISSION_GROUPS.find(g => g.id === id)?.label ?? id;

const getGroupShortLabel = (id: string) => {
  const label = getGroupLabel(id);
  return label.split(' — ')[0];
};

const getGroupBadgeClass = (id: string) => {
  const label = getGroupLabel(id);
  if (label.startsWith('Alcance 1')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (label.startsWith('Alcance 2')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (label.startsWith('Alcance 3')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-violet-50 text-violet-700 border-violet-200';
};

export const EmissionSourceCategoryList = () => {
  const [categories, setCategories] = useState<EmissionSourceCategory[]>(EMISSION_SOURCE_CATEGORIES_MOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EmissionSourceCategory | undefined>(undefined);

  const filteredCategories = categories.filter(c => {
    const matchSearch =
      !searchTerm ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchGroup = !groupFilter || c.emission_group_id === groupFilter;
    return matchSearch && matchGroup;
  });

  const handleOpenCreate = () => {
    setEditingCategory(undefined);
    setModalOpen(true);
  };

  const handleOpenEdit = (category: EmissionSourceCategory) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleSave = (data: Omit<EmissionSourceCategory, 'id'> & { id?: string }) => {
    if (data.id) {
      setCategories(prev => prev.map(c => (c.id === data.id ? (data as EmissionSourceCategory) : c)));
      toast.success('Categoría actualizada exitosamente');
    } else {
      const newCategory: EmissionSourceCategory = { ...data, id: `cat_${Date.now()}` };
      setCategories(prev => [...prev, newCategory]);
      toast.success('Categoría creada exitosamente');
    }
    setModalOpen(false);
  };

  const handleDelete = (category: EmissionSourceCategory) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${category.name}"?`)) return;
    setCategories(prev => prev.filter(c => c.id !== category.id));
    toast.success('Categoría eliminada exitosamente');
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Categorías de Emisión</h1>
            <p className="text-sm text-zinc-500">
              Administra las categorías que agrupan las fuentes de emisión por tipo y grupo.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nueva Categoría de Emisión
          </button>
        </div>

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
            />
          </div>
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700 sm:w-64"
          >
            <option value="">Todos los grupos</option>
            {EMISSION_GROUPS.map(g => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-zinc-100">
            {filteredCategories.length > 0 ? (
              filteredCategories.map(cat => (
                <div key={cat.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100 flex-shrink-0">
                      <Tag size={16} className="text-violet-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-sm">{cat.name}</p>
                      {cat.description && (
                        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">{cat.description}</p>
                      )}
                      <div className="mt-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getGroupBadgeClass(cat.emission_group_id)}`}>
                          {getGroupShortLabel(cat.emission_group_id)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-2 text-zinc-400 hover:text-violet-600 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      className="p-2 text-zinc-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-6 py-12 text-center text-zinc-500 text-sm">No se encontraron categorías.</p>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Grupo de emisión</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map(cat => (
                    <tr key={cat.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100 flex-shrink-0">
                            <Tag size={15} className="text-violet-500" />
                          </div>
                          <span className="font-bold text-zinc-900">{cat.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-500 max-w-sm">
                        <span className="line-clamp-2">{cat.description || '—'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getGroupBadgeClass(cat.emission_group_id)}`}>
                          {getGroupShortLabel(cat.emission_group_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(cat)}
                            className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron categorías.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <EmissionSourceCategoryFormModal
          category={editingCategory}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
