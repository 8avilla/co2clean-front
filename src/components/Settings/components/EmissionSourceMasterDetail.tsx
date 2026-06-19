'use client';

import { useState, useEffect, useMemo, Fragment } from 'react';
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  Filter,
  Copy,
  Edit2,
  Tag,
  Factory,
  Car,
  Wind,
  Flame,
  FireExtinguisher,
  FileText,
  Cloud,
  Zap,
  Trash2 as TrashIcon,
  Package,
  Cog,
  Snowflake,
  Truck,
  Bus,
  Droplets,
  Thermometer,
  Plane,
  SlidersHorizontal,
  ChevronDown,
  X,
} from 'lucide-react';

const ICONS_MAP: Record<string, React.ElementType> = {
  FireExtinguisher, Factory, Car, FileText, Cloud, Zap, Trash2: TrashIcon, Package, Cog, Snowflake, Truck, Bus, Droplets, Thermometer, Plane, Tag
};

import { toast } from 'sonner';
import {
  EmissionSource,
  EmissionSourceCategory,
  EmissionFactor,
  FactorChanges,
  EMISSION_GROUPS,
} from '../types';
import { EmissionSourceCategoryService } from '@/shared/services/emission-source-category.service';
import {
  EmissionSourceService,
  EmissionFactorService,
} from '@/shared/services/emission-source.service';
import { EmissionSourceCategoryFormModal } from './EmissionSourceCategoryFormModal';
import { EmissionSourceFormModal } from './EmissionSourceFormModal';

const getSourceIcon = (categoryName: string) => {
  if (categoryName.includes('Eléctric') || categoryName.includes('Electricidad'))
    return <Zap size={13} className="text-amber-500" />;
  if (categoryName.includes('Estacionaria') || categoryName.includes('Gas') || categoryName.includes('gas'))
    return <Flame size={13} className="text-orange-500" />;
  if (categoryName.includes('Móvil') || categoryName.includes('Transporte'))
    return <Truck size={13} className="text-blue-500" />;
  return <FileText size={13} className="text-zinc-500" />;
};

const getSourceIconBg = (categoryName: string) => {
  if (categoryName.includes('Eléctric') || categoryName.includes('Electricidad'))
    return 'bg-amber-50 border-amber-100';
  if (categoryName.includes('Estacionaria') || categoryName.includes('Gas') || categoryName.includes('gas'))
    return 'bg-orange-50 border-orange-100';
  if (categoryName.includes('Móvil') || categoryName.includes('Transporte'))
    return 'bg-blue-50 border-blue-100';
  return 'bg-zinc-50 border-zinc-200';
};

export const EmissionSourceMasterDetail = () => {
  const [categories, setCategories] = useState<EmissionSourceCategory[]>([]);
  const [sources, setSources] = useState<EmissionSource[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [expandedSourceIds, setExpandedSourceIds] = useState<Set<string>>(new Set());

  // Category modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EmissionSourceCategory | undefined>(undefined);

  // Source modal
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<EmissionSource | undefined>(undefined);
  const [defaultCategoryForSource, setDefaultCategoryForSource] = useState<string | undefined>(undefined);

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [cats, srcs, facts] = await Promise.all([
        EmissionSourceCategoryService.getCategories(),
        EmissionSourceService.getSources(),
        EmissionFactorService.getFactors(),
      ]);
      setCategories(cats);
      setSources(srcs);
      setFactors(facts);
    } catch {
      toast.error('Error al cargar las fuentes de emisión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ── Derived data ───────────────────────────────────────────────────────────

  const factorCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of factors) {
      map.set(f.emission_source_id, (map.get(f.emission_source_id) ?? 0) + 1);
    }
    return map;
  }, [factors]);

  const factorsBySource = useMemo(() => {
    const map = new Map<string, EmissionFactor[]>();
    for (const f of factors) {
      if (!map.has(f.emission_source_id)) map.set(f.emission_source_id, []);
      map.get(f.emission_source_id)!.push(f);
    }
    return map;
  }, [factors]);

  const factorsForSource = (sourceId: string) => factorsBySource.get(sourceId) ?? [];

  const incompleteCount = useMemo(
    () => sources.filter(s => (factorCountMap.get(s.id) ?? 0) === 0).length,
    [sources, factorCountMap],
  );

  const categoryById = useMemo(() => {
    const map = new Map<string, EmissionSourceCategory>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const filteredSources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sources
      .filter(s => {
        if (categoryFilter && s.category_id !== categoryFilter) return false;
        if (showIncompleteOnly && (factorCountMap.get(s.id) ?? 0) > 0) return false;
        if (q) {
          const cat = categoryById.get(s.category_id);
          const matchSrc = s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
          const matchCat = (cat?.name ?? '').toLowerCase().includes(q) || (cat?.code ?? '').toLowerCase().includes(q);
          if (!matchSrc && !matchCat) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const catA = categoryById.get(a.category_id)?.name ?? '';
        const catB = categoryById.get(b.category_id)?.name ?? '';
        const catCmp = catA.localeCompare(catB, 'es');
        if (catCmp !== 0) return catCmp;
        return a.name.localeCompare(b.name, 'es');
      });
  }, [sources, categoryById, search, categoryFilter, showIncompleteOnly, factorCountMap]);

  const toggleExpand = (id: string) => {
    setExpandedSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────

  const handleOpenCreateCat = () => { setEditingCategory(undefined); setCatModalOpen(true); };
  const handleOpenEditCat = (cat: EmissionSourceCategory) => { setEditingCategory(cat); setCatModalOpen(true); };
  const handleOpenCreateSource = (catId?: string) => {
    setEditingSource(undefined);
    setDefaultCategoryForSource(catId);
    setSourceModalOpen(true);
  };
  const handleOpenEditSource = (s: EmissionSource) => {
    setEditingSource(s);
    setDefaultCategoryForSource(undefined);
    setSourceModalOpen(true);
  };

  const handleSaveCategory = async (data: Omit<EmissionSourceCategory, 'id'> & { id?: string }) => {
    try {
      if (data.id) {
        const updated = await EmissionSourceCategoryService.updateCategory(data.id, data);
        setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success('Categoría de emisión actualizada exitosamente');
      } else {
        const created = await EmissionSourceCategoryService.createCategory({
          name: data.name,
          code: data.code,
          description: data.description,
          emission_group_id: data.emission_group_id,
        });
        setCategories(prev => [...prev, created]);
        toast.success('Categoría de emisión creada exitosamente');
      }
      setCatModalOpen(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar la categoría');
    }
  };

  const handleDeleteCategory = async (cat: EmissionSourceCategory) => {
    if (!confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"?`)) return;
    try {
      await EmissionSourceCategoryService.deleteCategory(cat.id);
      setCategories(prev => prev.filter(c => c.id !== cat.id));
      setSources(prev => prev.filter(s => s.category_id !== cat.id));
      toast.success('Categoría de emisión eliminada exitosamente');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la categoría');
    }
  };

  // ── Source CRUD ────────────────────────────────────────────────────────────

  const handleDuplicateSource = async (s: EmissionSource) => {
    try {
      const created = await EmissionSourceService.createSource({
        ...s,
        name: `Copia de ${s.name}`,
        code: `${s.code}_COPY`,
      });
      setSources(prev => [...prev, created]);
      toast.success('Fuente de emisión duplicada exitosamente');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al duplicar la fuente');
    }
  };

  const handleSaveSource = async (
    data: Omit<EmissionSource, 'id'> & { id?: string },
    factorChanges: FactorChanges,
  ) => {
    try {
      let savedSource: EmissionSource;
      if (data.id) {
        savedSource = await EmissionSourceService.updateSource(data.id, data);
        setSources(prev => prev.map(s => s.id === savedSource.id ? savedSource : s));
      } else {
        savedSource = await EmissionSourceService.createSource(data);
        setSources(prev => [...prev, savedSource]);
      }

      const { toCreate, toUpdate, toDelete } = factorChanges;
      await Promise.all([
        ...toCreate.map(f =>
          EmissionFactorService.createFactor({
            ...f,
            emission_source_id: savedSource.id,
            emission_source_category_id: savedSource.category_id,
          })
        ),
        ...toUpdate.map(f => EmissionFactorService.updateFactor(f.id, f)),
        ...toDelete.map(id => EmissionFactorService.deleteFactor(id)),
      ]);

      // Refresh all factors
      const refreshed = await EmissionFactorService.getFactors();
      setFactors(refreshed);

      toast.success(data.id ? 'Fuente de emisión actualizada exitosamente' : 'Fuente de emisión creada exitosamente');
      setSourceModalOpen(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar la fuente de emisión');
    }
  };

  const handleDeleteSource = async (s: EmissionSource) => {
    if (!confirm(`¿Estás seguro de eliminar la fuente "${s.name}"?`)) return;
    try {
      await EmissionSourceService.deleteSource(s.id);
      setSources(prev => prev.filter(src => src.id !== s.id));
      setFactors(prev => prev.filter(f => f.emission_source_id !== s.id));
      toast.success('Fuente de emisión eliminada exitosamente');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la fuente');
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Page header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Fuentes de Emisión</h1>
            <p className="text-sm text-zinc-500">
              Gestiona las categorías y sus fuentes de emisión con factores de cálculo.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">

            <button
              onClick={() => handleOpenCreateSource()}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
            >
              <Plus size={15} />
              Nueva fuente
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoría o fuente..."
              className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700 sm:w-56"
          >
            <option value="">Todas las categorías</option>
            {categories
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, 'es'))
              .map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
          </select>

          {incompleteCount > 0 && (
            <button
              onClick={() => setShowIncompleteOnly(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors whitespace-nowrap ${showIncompleteOnly
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'text-zinc-500 border-zinc-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50'
                }`}
            >
              Sin factores
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${showIncompleteOnly ? 'bg-red-200 text-red-700' : 'bg-zinc-200 text-zinc-600'
                }`}>
                {incompleteCount}
              </span>
            </button>
          )}

          <span className="text-xs text-zinc-400 ml-auto hidden md:inline-block">
            {filteredSources.length !== sources.length
              ? `${filteredSources.length} de ${sources.length} fuentes`
              : `${sources.length} ${sources.length === 1 ? 'fuente' : 'fuentes'}`}
          </span>
        </div>

        {/* Flat table */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando datos...</span>
            </div>
          ) : filteredSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mb-3">
                <SlidersHorizontal size={20} className="text-zinc-400" />
              </div>
              <p className="text-sm font-semibold text-zinc-500">Sin resultados</p>
              <p className="text-xs text-zinc-400 mt-1">
                {search || categoryFilter || showIncompleteOnly
                  ? 'Prueba con otros filtros'
                  : 'Agrega la primera fuente de emisión'}
              </p>
              {(search || categoryFilter || showIncompleteOnly) && (
                <button
                  onClick={() => { setSearch(''); setCategoryFilter(''); setShowIncompleteOnly(false); }}
                  className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="w-8 px-3 py-3" />
                    <th className="px-4 py-3 text-left">Categoría de emisión</th>
                    <th className="px-4 py-3 text-left">Fuente de emisión</th>
                    <th className="px-4 py-3 text-center">Factores</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filteredSources.map(src => {
                    const cat = categoryById.get(src.category_id);
                    const isExpanded = expandedSourceIds.has(src.id);
                    const srcFactors = factorsForSource(src.id);
                    const hasNoFactors = srcFactors.length === 0;

                    return (
                      <Fragment key={src.id}>
                        {/* ── Source row ── */}
                        <tr className="hover:bg-zinc-50/70 transition-colors group/src">
                          {/* Expand toggle */}
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => toggleExpand(src.id)}
                              className="p-1 text-zinc-300 hover:text-zinc-500 rounded transition-colors"
                              title={isExpanded ? 'Colapsar factores' : 'Ver factores de emisión'}
                            >
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`}
                              />
                            </button>
                          </td>

                          {/* Categoría */}
                          <td className="px-4 py-3">
                            {cat ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
                                  {(() => {
                                    const Icon = ICONS_MAP[cat.icon || 'Tag'] || Tag;
                                    return <Icon size={12} className="text-violet-600" />;
                                  })()}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-medium text-zinc-700 block truncate text-xs" title={cat.name}>
                                    {cat.name}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-zinc-300 text-xs">—</span>
                            )}
                          </td>

                          {/* Fuente de emisión */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5 min-w-0">

                              <div className="min-w-0">
                                <span className="font-semibold text-zinc-800 block truncate" title={src.name}>
                                  {src.name}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {src.code && (
                                    <span className="font-mono text-[10px] text-zinc-400">{src.code}</span>
                                  )}
                                  {src.measurement_type && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-500">
                                      {src.measurement_type}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Factores */}
                          <td className="px-4 py-3 text-center">
                            {hasNoFactors ? (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                                Sin factores
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                                {srcFactors.length} {srcFactors.length === 1 ? 'factor' : 'factores'}
                              </span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover/src:opacity-100 transition-opacity">
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
                          </td>
                        </tr>

                        {/* ── Expanded factors sub-table ── */}
                        {isExpanded && (
                          <tr className="bg-zinc-50/50">
                            <td colSpan={5} className="px-6 py-3 pl-16">
                              <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-sm">
                                {srcFactors.length > 0 ? (
                                  <table className="w-full text-xs">
                                    <thead>
                                      <tr className="bg-zinc-50 border-b border-zinc-200">
                                        <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400">Gas</th>
                                        <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">Factor</th>
                                        <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">Unidad masa</th>
                                        <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">GWP</th>
                                        <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">U. actividad</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100">
                                      {srcFactors.map(f => (
                                        <tr key={f.id} className="hover:bg-zinc-50/80 transition-colors">
                                          <td className="px-4 py-2.5 font-mono font-semibold text-zinc-700">
                                            {f.gas_formula ?? f.gas_id}
                                          </td>
                                          <td className="px-4 py-2.5 text-right font-mono font-semibold text-zinc-800 tabular-nums">
                                            {f.factor}
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-mono font-bold text-[10px]">
                                              {f.factor_mass_unit ?? 'kg'}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5 text-right text-zinc-500 tabular-nums">
                                            {f.gwp}
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-mono font-bold text-[10px]">
                                              {f.emission_unit_symbol ?? f.emission_unit_id}
                                            </span>
                                          </td>
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
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
          defaultCategory={defaultCategoryForSource}
          onSave={handleSaveSource}
          onClose={() => setSourceModalOpen(false)}
        />
      )}
    </>
  );
};
