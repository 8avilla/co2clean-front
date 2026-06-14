'use client';

import { useState } from 'react';
import {
  Plus, Edit2, Trash2, Search, Tag,
  Zap, Flame, Truck, FileText, ChevronRight, SlidersHorizontal, ChevronDown, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { EmissionSource, EmissionSourceCategory, EMISSION_GROUPS } from '../types';
import { EMISSION_SOURCE_CATEGORIES_MOCK } from '../data/emission-source-categories.mock';
import { EMISSION_SOURCES_MOCK } from '../data/emission-sources.mock';
import { GASES_MOCK } from '../data/gases.mock';
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

const getSourceIconBg = (category: string) => {
  if (category.includes('Eléctric') || category.includes('Electricidad'))
    return 'bg-amber-50 border-amber-100';
  if (category.includes('Estacionaria') || category.includes('Gas') || category.includes('gas'))
    return 'bg-orange-50 border-orange-100';
  if (category.includes('Móvil') || category.includes('Transporte'))
    return 'bg-blue-50 border-blue-100';
  return 'bg-zinc-50 border-zinc-200';
};

const getGasLabel = (gasId: string) =>
  GASES_MOCK.find(g => g.id === gasId)?.formula ?? gasId;

const getGasName = (gasId: string) =>
  GASES_MOCK.find(g => g.id === gasId)?.chemical_name ?? '';

export const EmissionSourceMasterDetail = () => {
  const [categories, setCategories] = useState<EmissionSourceCategory[]>(EMISSION_SOURCE_CATEGORIES_MOCK);
  const [sources, setSources] = useState<EmissionSource[]>(EMISSION_SOURCES_MOCK);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    EMISSION_SOURCE_CATEGORIES_MOCK[0]?.id ?? null
  );
  const [catSearch, setCatSearch] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [expandedSourceIds, setExpandedSourceIds] = useState<Set<string>>(new Set());

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
    ? sources.filter(s =>
        s.category === selectedCategory.name &&
        (!sourceSearch || s.name.toLowerCase().includes(sourceSearch.toLowerCase())) &&
        (!showIncompleteOnly || s.factors.length === 0)
      )
    : [];

  const totalFactors = filteredSources.reduce((acc, s) => acc + s.factors.length, 0);

  // Count of incomplete sources in current category for the filter badge
  const incompleteCount = selectedCategory
    ? sources.filter(s => s.category === selectedCategory.name && s.factors.length === 0).length
    : 0;

  const sourceCountFor = (cat: EmissionSourceCategory) =>
    sources.filter(s => s.category === cat.name).length;

  const toggleExpand = (id: string) => {
    setExpandedSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedSourceIds(new Set(filteredSources.map(s => s.id)));
  const collapseAll = () => setExpandedSourceIds(new Set());

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

  const handleDuplicateSource = (s: EmissionSource) => {
    const duplicate: EmissionSource = {
      ...s,
      id: `src_${Date.now()}`,
      name: `Copia de ${s.name}`,
      code: '',
    };
    setSources(prev => [...prev, duplicate]);
    toast.success('Fuente de emisión duplicada exitosamente');
  };

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
                  const isEmpty = count === 0;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      title={cat.description || undefined}
                      className={`group relative px-4 py-3 cursor-pointer border-b border-zinc-50 transition-colors ${
                        isSelected ? 'bg-violet-50' : 'hover:bg-zinc-50/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 pr-14">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border transition-colors ${
                          isSelected ? 'bg-violet-100 border-violet-200' : 'bg-zinc-50 border-zinc-200'
                        }`}>
                          <Tag size={13} className={isSelected ? 'text-violet-600' : isEmpty ? 'text-zinc-300' : 'text-zinc-400'} />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold truncate ${
                            isSelected ? 'text-violet-700' : isEmpty ? 'text-zinc-400' : 'text-zinc-800'
                          }`}>
                            {cat.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${getGroupBadgeClass(cat.emission_group_id)}`}>
                              {getGroupShortLabel(cat.emission_group_id)}
                            </span>
                            {isEmpty ? (
                              <span className="text-[10px] font-bold text-zinc-300">Vacía</span>
                            ) : (
                              <span className="text-[10px] text-zinc-400">
                                {count} {count === 1 ? 'fuente' : 'fuentes'}
                              </span>
                            )}
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

            {/* Bottom CTA */}
            <div className="px-4 py-3 border-t border-zinc-100 flex-shrink-0">
              <button
                onClick={handleOpenCreateCat}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-violet-600 hover:bg-violet-50 rounded-lg transition-colors border border-dashed border-violet-200 hover:border-violet-400"
              >
                <Plus size={13} />
                Nueva categoría de emisión
              </button>
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
                      {filteredSources.length} {filteredSources.length === 1 ? 'fuente' : 'fuentes'} · {totalFactors} {totalFactors === 1 ? 'factor' : 'factores'}
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

                {/* Toolbar: search + filters + expand controls */}
                <div className="px-6 py-2.5 border-b border-zinc-100 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
                    <input
                      type="text"
                      placeholder="Buscar fuentes en esta categoría..."
                      value={sourceSearch}
                      onChange={e => setSourceSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all"
                    />
                  </div>

                  {/* Filter: incomplete only */}
                  {incompleteCount > 0 && (
                    <button
                      onClick={() => setShowIncompleteOnly(v => !v)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0 ${
                        showIncompleteOnly
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'text-zinc-500 border-zinc-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50'
                      }`}
                      title="Mostrar solo fuentes sin factores configurados"
                    >
                      Sin factores
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                        showIncompleteOnly ? 'bg-red-200 text-red-700' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {incompleteCount}
                      </span>
                    </button>
                  )}

                  {/* Expand / collapse all */}
                  {filteredSources.length > 0 && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={expandAll}
                        className="text-xs font-semibold text-zinc-400 hover:text-violet-600 transition-colors"
                      >
                        Expandir todo
                      </button>
                      <span className="text-zinc-200 text-sm">|</span>
                      <button
                        onClick={collapseAll}
                        className="text-xs font-semibold text-zinc-400 hover:text-violet-600 transition-colors"
                      >
                        Colapsar
                      </button>
                    </div>
                  )}
                </div>

                {/* Source rows */}
                <div className="flex-1 overflow-y-auto divide-y divide-zinc-100">
                  {filteredSources.length > 0 ? (
                    filteredSources.map(src => {
                      const isExpanded = expandedSourceIds.has(src.id);
                      const hasNoFactors = src.factors.length === 0;
                      return (
                        <div key={src.id}>
                          {/* Main row */}
                          <div className="group px-4 py-3 flex items-center gap-3 hover:bg-zinc-50/60 transition-colors">
                            <button
                              onClick={() => toggleExpand(src.id)}
                              className="p-1 text-zinc-300 hover:text-zinc-500 rounded transition-colors flex-shrink-0"
                              title={isExpanded ? 'Colapsar' : 'Ver factores'}
                            >
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                              />
                            </button>

                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 ${getSourceIconBg(src.category)}`}>
                              {getSourceIcon(src.category)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-zinc-900 text-sm truncate">{src.name}</p>
                            </div>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-zinc-100 text-zinc-600">
                                {src.measurement_type}
                              </span>
                              {src.uncertainty > 0 && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                  ±{src.uncertainty}%
                                </span>
                              )}
                              {hasNoFactors ? (
                                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                                  Sin factores
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                  {src.factors.length} {src.factors.length === 1 ? 'factor' : 'factores'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <button
                                onClick={() => handleDuplicateSource(src)}
                                className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                                title="Duplicar fuente"
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                onClick={() => handleOpenEditSource(src)}
                                className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                                title="Editar fuente"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteSource(src)}
                                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                                title="Eliminar fuente"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Expanded factors table */}
                          {isExpanded && (
                            <div className="mx-4 mb-3 rounded-xl bg-zinc-50 border border-zinc-200 overflow-hidden">
                              {src.factors.length > 0 ? (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-zinc-100/70 border-b border-zinc-200">
                                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400">Gas</th>
                                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">Factor</th>
                                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">Unidad</th>
                                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">GWP</th>
                                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">Incert.</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-200">
                                    {src.factors.map(f => (
                                      <tr key={f.gas_id} className="hover:bg-white/60 transition-colors">
                                        <td className="px-4 py-2">
                                          <span className="font-mono font-bold text-violet-700">{getGasLabel(f.gas_id)}</span>
                                          <span className="block text-[10px] text-zinc-400 leading-tight">{getGasName(f.gas_id)}</span>
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono font-semibold text-zinc-800">{f.factor}</td>
                                        <td className="px-4 py-2 text-right">
                                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-mono font-bold text-[10px]">{f.unit}</span>
                                        </td>
                                        <td className="px-4 py-2 text-right text-zinc-500 tabular-nums">{f.gwp_applied}</td>
                                        <td className="px-4 py-2 text-right font-semibold text-amber-600">±{f.uncertainty}%</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-xs text-zinc-400 py-3 text-center">
                                  Sin factores configurados — edita la fuente para agregarlos.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                        <SlidersHorizontal size={20} className="text-zinc-400" />
                      </div>
                      <p className="text-sm font-semibold text-zinc-500">
                        {sourceSearch || showIncompleteOnly ? 'Sin resultados' : 'Sin fuentes de emisión'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {showIncompleteOnly
                          ? 'Todas las fuentes de esta categoría tienen factores configurados'
                          : sourceSearch
                            ? 'Intenta con otro término de búsqueda'
                            : 'Agrega la primera fuente a esta categoría'}
                      </p>
                      {sourceSearch && (
                        <button
                          onClick={() => setSourceSearch('')}
                          className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                      {showIncompleteOnly && !sourceSearch && (
                        <button
                          onClick={() => setShowIncompleteOnly(false)}
                          className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                        >
                          Ver todas las fuentes
                        </button>
                      )}
                      {!sourceSearch && !showIncompleteOnly && (
                        <button
                          onClick={handleOpenCreateSource}
                          className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                        >
                          <Plus size={15} />
                          Nueva fuente
                        </button>
                      )}
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
