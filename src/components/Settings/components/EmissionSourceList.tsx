'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, SlidersHorizontal, Flame, Zap, Truck, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  EmissionSource,
  EmissionSourceCategory,
  FactorChanges,
  EMISSION_GROUPS,
} from '../types';
import { EmissionSourceCategoryService } from '@/shared/services/emission-source-category.service';
import {
  EmissionSourceService,
  EmissionFactorService,
} from '@/shared/services/emission-source.service';
import { EmissionSourceFormModal } from './EmissionSourceFormModal';

const getCategoryName = (categoryId: string, cats: EmissionSourceCategory[]): string =>
  cats.find(c => c.id === categoryId)?.name ?? categoryId;

const getSourceGroupId = (categoryId: string, cats: EmissionSourceCategory[]): string =>
  cats.find(c => c.id === categoryId)?.emission_group_id ?? '';

const getGroupConfig = (groupId: string) => {
  const label = EMISSION_GROUPS.find(g => g.id === groupId)?.label ?? '';
  const shortLabel = label.split(' — ')[0] || '—';
  let className = 'bg-violet-50 text-violet-700 border-violet-200';
  if (label.startsWith('Alcance 1')) className = 'bg-amber-50 text-amber-700 border-amber-200';
  else if (label.startsWith('Alcance 2')) className = 'bg-blue-50 text-blue-700 border-blue-200';
  else if (label.startsWith('Alcance 3')) className = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  return { label: shortLabel, className };
};

const getSourceIcon = (categoryId: string, cats: EmissionSourceCategory[]) => {
  const name = getCategoryName(categoryId, cats);
  if (name.includes('Eléctric') || name.includes('Electricidad')) return <Zap size={16} className="text-amber-500" />;
  if (name.includes('Estacionaria') || name.includes('gas') || name.includes('Gas')) return <Flame size={16} className="text-orange-500" />;
  if (name.includes('Móvil') || name.includes('Transporte')) return <Truck size={16} className="text-blue-500" />;
  return <FileText size={16} className="text-zinc-500" />;
};

export const EmissionSourceList = () => {
  const [sources, setSources] = useState<EmissionSource[]>([]);
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [categories, setCategories] = useState<EmissionSourceCategory[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<EmissionSource | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    EmissionSourceCategoryService.getCategories()
      .then(setCategories)
      .catch(() => toast.error('Error al cargar las categorías de emisión'))
      .finally(() => setIsLoadingCats(false));
    EmissionSourceService.getSources()
      .then(setSources)
      .catch(() => toast.error('Error al cargar las fuentes de emisión'))
      .finally(() => setIsLoadingSources(false));
  }, []);

  const filteredSources = sources.filter(s => {
    const categoryName = getCategoryName(s.category_id, categories);
    const matchSearch =
      !searchTerm ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchScope = !scopeFilter || getSourceGroupId(s.category_id, categories) === scopeFilter;
    const matchCategory = !categoryFilter || s.category_id === categoryFilter;
    const matchSource = !sourceFilter || s.id === sourceFilter;
    return matchSearch && matchScope && matchCategory && matchSource;
  });

  const handleOpenCreate = () => {
    setEditingSource(undefined);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (source: EmissionSource) => {
    setEditingSource(source);
    setFormModalOpen(true);
  };

  const handleSaveSource = async (
    data: Omit<EmissionSource, 'id'> & { id?: string },
    factorChanges: FactorChanges
  ) => {
    try {
      let savedSource: EmissionSource;
      if (data.id) {
        savedSource = await EmissionSourceService.updateSource(data.id, data);
        setSources(prev => prev.map(s => (s.id === savedSource.id ? savedSource : s)));
      } else {
        savedSource = await EmissionSourceService.createSource(data);
        setSources(prev => [...prev, savedSource]);
      }

      const { toCreate, toUpdate, toDelete } = factorChanges;
      await Promise.all([
        ...toCreate.map(f =>
          EmissionFactorService.createFactor({ ...f, emission_source_id: savedSource.id, emission_source_category_id: savedSource.category_id })
        ),
        ...toUpdate.map(f => EmissionFactorService.updateFactor(f.id, f)),
        ...toDelete.map(id => EmissionFactorService.deleteFactor(id)),
      ]);

      toast.success(data.id ? 'Fuente de emisión actualizada exitosamente' : 'Fuente de emisión creada exitosamente');
      setFormModalOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al guardar la fuente de emisión';
      toast.error(message);
    }
  };

  const handleDelete = async (source: EmissionSource) => {
    if (!confirm(`¿Estás seguro de eliminar la fuente "${source.name}"?`)) return;
    try {
      await EmissionSourceService.deleteSource(source.id);
      setSources(prev => prev.filter(s => s.id !== source.id));
      toast.success('Fuente de emisión eliminada exitosamente');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al eliminar la fuente de emisión';
      toast.error(message);
    }
  };

  const activeFilters = [scopeFilter, categoryFilter, sourceFilter].filter(Boolean).length;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Fuentes de Emisión</h1>
            <p className="text-sm text-zinc-500">
              Gestiona las fuentes de emisión y sus factores de cálculo.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nueva Fuente
          </button>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, código o categoría..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all whitespace-nowrap ${
                showFilters || activeFilters > 0
                  ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {activeFilters > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-white text-violet-700 rounded-full text-xs font-black">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-zinc-100 flex flex-wrap gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Grupo de emisión</label>
                <select
                  value={scopeFilter}
                  onChange={e => setScopeFilter(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white"
                >
                  <option value="">Todos los grupos</option>
                  {EMISSION_GROUPS.map(g => (
                    <option key={g.id} value={g.id}>{g.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Categoría de emisión</label>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white"
                >
                  <option value="">Todas las categorías</option>
                  {categories
                    .filter(c => !scopeFilter || c.emission_group_id === scopeFilter)
                    .map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name.length > 35 ? c.name.substring(0, 32) + '...' : c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Fuente de emisión</label>
                <select
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white"
                >
                  <option value="">Todas las fuentes</option>
                  {sources
                    .filter(s => {
                      const scopeMatch = !scopeFilter || getSourceGroupId(s.category_id, categories) === scopeFilter;
                      const catMatch = !categoryFilter || s.category_id === categoryFilter;
                      return scopeMatch && catMatch;
                    })
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(s => (
                      <option key={s.id} value={s.id} title={s.name}>
                        {s.name.length > 35 ? s.name.substring(0, 32) + '...' : s.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          {(isLoadingSources || isLoadingCats) && (
            <div className="flex items-center justify-center py-16 gap-2 text-zinc-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando fuentes de emisión...</span>
            </div>
          )}
          {!isLoadingSources && !isLoadingCats && (
            <>
              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-zinc-100">
                {filteredSources.length > 0 ? (
                  filteredSources.map(source => {
                    const categoryName = getCategoryName(source.category_id, categories);
                    const scopeConf = getGroupConfig(getSourceGroupId(source.category_id, categories));
                    return (
                      <div key={source.id} className="p-4 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100 flex-shrink-0">
                            {getSourceIcon(source.category_id, categories)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 text-sm">{source.name}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${scopeConf.className}`}>
                                {scopeConf.label}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                                {getSourceIcon(source.category_id, categories)}
                                {categoryName}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleOpenEdit(source)}
                            className="p-2 text-zinc-400 hover:text-violet-600 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(source)}
                            className="p-2 text-zinc-400 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="px-6 py-12 text-center text-zinc-500 text-sm">No se encontraron fuentes de emisión.</p>
                )}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Fuente</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Alcance</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoría de Emisión</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Tipo de medida</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredSources.length > 0 ? (
                      filteredSources.map(source => {
                        const categoryName = getCategoryName(source.category_id, categories);
                        const scopeConf = getGroupConfig(getSourceGroupId(source.category_id, categories));
                        return (
                          <tr key={source.id} className="hover:bg-zinc-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center border border-violet-100">
                                  {getSourceIcon(source.category_id, categories)}
                                </div>
                                <div>
                                  <span className="font-bold text-zinc-900 block">{source.name}</span>
                                  {source.code && (
                                    <span className="font-mono text-[10px] text-zinc-400">{source.code}</span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${scopeConf.className}`}>
                                {scopeConf.label}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {getSourceIcon(source.category_id, categories)}
                                <span className="text-sm text-zinc-600">{categoryName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {source.measurement_type ? (
                                <span className="font-mono text-xs font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                                  {source.measurement_type}
                                </span>
                              ) : (
                                <span className="text-xs text-zinc-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleOpenEdit(source)}
                                  className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(source)}
                                  className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                          No se encontraron fuentes de emisión.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {formModalOpen && (
        <EmissionSourceFormModal
          source={editingSource}
          onSave={handleSaveSource}
          onClose={() => setFormModalOpen(false)}
        />
      )}
    </>
  );
};
