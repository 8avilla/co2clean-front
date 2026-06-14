'use client';

import { useState } from 'react';
import {
  Plus, Edit2, Trash2, Search, Tag,
  Zap, Flame, Truck, FileText, ChevronRight, SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmissionSource, EmissionSourceCategory, EMISSION_GROUPS } from '../types';
import { EMISSION_SOURCE_CATEGORIES_MOCK } from '../data/emission-source-categories.mock';
import { EMISSION_SOURCES_MOCK } from '../data/emission-sources.mock';
import { EmissionSourceCategoryFormModal } from './EmissionSourceCategoryFormModal';
import { EmissionSourceFormModal } from './EmissionSourceFormModal';

const getGroupShortLabel = (id: string) => {
  const label = EMISSION_GROUPS.find(g => g.id === id)?.label ?? '';
  return label.split(' — ')[0];
};

const getGroupBadgeClass = (id: string) => {
  const label = EMISSION_GROUPS.find(g => g.id === id)?.label ?? '';
  if (label.startsWith('Alcance 1')) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (label.startsWith('Alcance 2')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (label.startsWith('Alcance 3')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return 'bg-violet-50 text-violet-700 border-violet-200';
};

const getSourceIcon = (category: string) => {
  if (category.includes('Eléctric') || category.includes('Electricidad'))
    return <Zap size={15} className="text-amber-500" />;
  if (category.includes('Estacionaria') || category.includes('Gas') || category.includes('gas'))
    return <Flame size={15} className="text-orange-500" />;
  if (category.includes('Móvil') || category.includes('Transporte'))
    return <Truck size={15} className="text-blue-500" />;
  return <FileText size={15} className="text-zinc-500" />;
};

export const EmissionSourceMasterDetail = () => {
  const [categories, setCategories] = useState<EmissionSourceCategory[]>(EMISSION_SOURCE_CATEGORIES_MOCK);
  const [sources, setSources] = useState<EmissionSource[]>(EMISSION_SOURCES_MOCK);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    EMISSION_SOURCE_CATEGORIES_MOCK[0]?.id ?? null
  );
  const [catSearch, setCatSearch] = useState('');

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EmissionSourceCategory | undefined>(undefined);

  // Source modal
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<EmissionSource | undefined>(undefined);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) ?? null;

  const filteredCategories = categories.filter(c =>
    !catSearch || c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  const filteredSources = selectedCategory
    ? sources.filter(s => s.category === selectedCategory.name)
    : [];

  const sourceCountFor = (cat: EmissionSourceCategory) =>
    sources.filter(s => s.category === cat.name).length;

  // ── Category CRUD ─────────────────────────────────────────────────────────

  const handleOpenCreateCat = () => { setEditingCategory(undefined); setCatModalOpen(true); };
  const handleOpenEditCat = (cat: EmissionSourceCategory) => { setEditingCategory(cat); setCatModalOpen(true); };

  const handleSaveCategory = (data: Omit<EmissionSourceCategory, 'id'> & { id?: string }) => {
    if (data.id) {
      setCategories(prev => prev.map(c => c.id === data.id ? (data as EmissionSourceCategory) : c));
      toast.success('Categoría de emisión actualizada exitosamente');
    } else {
      const newCat: EmissionSourceCategory = { ...data, id: `cat_${Date.now()}` };
      setCategories(prev => [...prev, newCat]);
      setSelectedCategoryId(newCat.id);
      toast.success('Categoría de emisión creada exitosamente');
    }
    setCatModalOpen(false);
  };

  const handleDeleteCategory = (cat: EmissionSourceCategory) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"?`)) return;
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    if (selectedCategoryId === cat.id) {
      setSelectedCategoryId(categories.find(c => c.id !== cat.id)?.id ?? null);
    }
    toast.success('Categoría de emisión eliminada exitosamente');
  };

  // ── Source CRUD ───────────────────────────────────────────────────────────

  const handleOpenCreateSource = () => { setEditingSource(undefined); setSourceModalOpen(true); };
  const handleOpenEditSource = (s: EmissionSource) => { setEditingSource(s); setSourceModalOpen(true); };

  const handleSaveSource = (data: Omit<EmissionSource, 'id'> & { id?: string }) => {
    if (data.id) {
      setSources(prev => prev.map(s => s.id === data.id ? (data as EmissionSource) : s));
      toast.success('Fuente de emisión actualizada exitosamente');
    } else {
      setSources(prev => [...prev, { ...data, id: `src_${Date.now()}` }]);
      toast.success('Fuente de emisión creada exitosamente');
    }
    setSourceModalOpen(false);
  };

  const handleDeleteSource = (s: EmissionSource) => {
    if (!confirm(`¿Estás seguro de eliminar la fuente "${s.name}"?`)) return;
    setSources(prev => prev.filter(src => src.id !== s.id));
    toast.success('Fuente de emisión eliminada exitosamente');
  };

  return (
    <>
      <div className="space-y-4">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Fuentes de Emisión</h1>
          <p className="text-sm text-zinc-500">
            Gestiona las categorías y sus fuentes de emisión con factores de cálculo.
          </p>
        </div>

        {/* Master-detail panel */}
        <div className="flex bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden min-h-[600px]">

          {/* ── Left: Categories ─────────────────────────────────────────── */}
          <div className="w-96 flex-shrink-0 border-r border-zinc-100 flex flex-col">

            {/* Panel header */}
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Categorías de Emisión
              </span>
              <button
                onClick={handleOpenCreateCat}
                className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                title="Nueva categoría"
              >
                <Plus size={15} />
              </button>
            </div>

            {/* Search */}
            <div className="px-3 py-2 border-b border-zinc-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                <input
                  type="text"
                  placeholder="Buscar categoría..."
                  value={catSearch}
                  onChange={e => setCatSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(cat => {
                  const isSelected = cat.id === selectedCategoryId;
                  const count = sourceCountFor(cat);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`group relative px-4 py-3 cursor-pointer border-b border-zinc-50 transition-colors ${
                        isSelected ? 'bg-violet-50' : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 pr-14">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isSelected ? 'bg-violet-100 border-violet-200' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <Tag size={13} className={isSelected ? 'text-violet-600' : 'text-zinc-400'} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${isSelected ? 'text-violet-700' : 'text-zinc-800'}`}>
                            {cat.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${getGroupBadgeClass(cat.emission_group_id)}`}>
                              {getGroupShortLabel(cat.emission_group_id)}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {count} {count === 1 ? 'fuente' : 'fuentes'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Hover actions */}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={e => { e.stopPropagation(); handleOpenEditCat(cat); }}
                          className="p-1.5 text-zinc-400 hover:text-violet-600 rounded-md transition-colors"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleDeleteCategory(cat); }}
                          className="p-1.5 text-zinc-400 hover:text-red-500 rounded-md transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      {isSelected && !catSearch && (
                        <ChevronRight size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 group-hover:hidden" />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-10 text-center text-sm text-zinc-400">
                  {catSearch ? 'Sin resultados.' : 'Sin categorías de emisión.'}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: Sources ────────────────────────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">
            {selectedCategory ? (
              <>
                {/* Panel header */}
                <div className="px-6 py-3 border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-zinc-900">{selectedCategory.name}</h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {filteredSources.length} {filteredSources.length === 1 ? 'fuente de emisión' : 'fuentes de emisión'}
                    </p>
                  </div>
                  <button
                    onClick={handleOpenCreateSource}
                    className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
                  >
                    <Plus size={14} />
                    Nueva fuente
                  </button>
                </div>

                {/* Source rows */}
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                  {filteredSources.length > 0 ? (
                    filteredSources.map(src => (
                      <div
                        key={src.id}
                        className="group px-6 py-4 flex items-center gap-4 hover:bg-zinc-50/60 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100 flex-shrink-0">
                          {getSourceIcon(src.category)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-zinc-900 text-sm truncate">{src.name}</p>
                          <p className="text-xs font-mono text-zinc-400">{src.code}</p>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-zinc-100 text-zinc-600">
                            {src.measurement_type}
                          </span>
                          {src.uncertainty > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              ±{src.uncertainty}%
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                            src.factors.length > 0
                              ? 'bg-violet-50 text-violet-700 border-violet-200'
                              : 'bg-zinc-50 text-zinc-400 border-zinc-200'
                          }`}>
                            {src.factors.length} {src.factors.length === 1 ? 'factor' : 'factores'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditSource(src)}
                            className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSource(src)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                        <SlidersHorizontal size={20} className="text-zinc-400" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-500">Sin fuentes de emisión</p>
                      <p className="text-xs text-zinc-400 mt-1">Agrega la primera fuente a esta categoría</p>
                      <button
                        onClick={handleOpenCreateSource}
                        className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                      >
                        <Plus size={15} />
                        Nueva fuente
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                  <Tag size={20} className="text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-500">Selecciona una categoría</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Haz clic en una categoría para ver sus fuentes de emisión
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {catModalOpen && (
        <EmissionSourceCategoryFormModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => setCatModalOpen(false)}
        />
      )}

      {sourceModalOpen && (
        <EmissionSourceFormModal
          source={editingSource}
          defaultCategory={selectedCategory?.name}
          onSave={handleSaveSource}
          onClose={() => setSourceModalOpen(false)}
        />
      )}
    </>
  );
};
