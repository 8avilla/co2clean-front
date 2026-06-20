'use client';

import { useState, useMemo, useCallback } from 'react';
import { FlaskConical, Search, X, Zap, ChevronDown, ChevronRight, ChevronsUpDown } from 'lucide-react';
import { ApiEmissionFactor, FACTOR_MASS_UNIT_TO_KG, FactorMassUnit } from '../../types';

interface AnalysisFactorsTabProps {
  factors: ApiEmissionFactor[];
}

function fmtFactor(value: number): string {
  if (value === 0) return '0';
  if (value < 0.0001) return value.toExponential(3);
  return value.toPrecision(5);
}

interface GasGroup {
  gasId: string;
  gasName: string;
  formula: string;
  gwp: number;
  variants: ApiEmissionFactor[];
}

function groupFactorsByGas(factors: ApiEmissionFactor[]): GasGroup[] {
  const map = new Map<string, ApiEmissionFactor[]>();
  for (const f of factors) {
    const gId = f.gasId ?? f.id;
    if (!map.has(gId)) map.set(gId, []);
    map.get(gId)!.push(f);
  }
  return Array.from(map.entries())
    .map(([gasId, variants]) => ({
      gasId,
      gasName: variants[0].gas?.chemicalName ?? 'Gas desconocido',
      formula: variants[0].gas?.formula ?? '',
      gwp: variants[0].gwp,
      variants,
    }))
    .sort((a, b) => {
      const impact = (g: GasGroup) =>
        g.variants.reduce((s, f) => {
          const massKg = FACTOR_MASS_UNIT_TO_KG[(f.factorMassUnit ?? 'kg') as FactorMassUnit] ?? 1;
          return s + f.factor * massKg * g.gwp;
        }, 0);
      return impact(b) - impact(a);
    });
}

interface SourceGroup {
  sourceId: string;
  sourceName: string;
  factors: ApiEmissionFactor[];
}

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  sources: SourceGroup[];
}

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export const AnalysisFactorsTab = ({ factors }: AnalysisFactorsTabProps) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  // Collapsed sets — empty means all expanded
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(new Set());

  const toggleCategory = useCallback((id: string) => setCollapsedCategories(prev => toggle(prev, id)), []);
  const toggleSource = useCallback((key: string) => setCollapsedSources(prev => toggle(prev, key)), []);

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of factors) {
      if (f.emissionSourceCategoryId && f.emissionSourceCategory?.name) {
        map.set(f.emissionSourceCategoryId, f.emissionSourceCategory.name);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [factors]);

  const uniqueSources = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of factors) {
      if (f.emissionSourceId && f.emissionSource?.name) {
        if (!categoryFilter || f.emissionSourceCategoryId === categoryFilter) {
          map.set(f.emissionSourceId, f.emissionSource.name);
        }
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [factors, categoryFilter]);

  const filteredFactors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return factors.filter(f => {
      if (q) {
        const match =
          f.gas?.chemicalName.toLowerCase().includes(q) ||
          f.gas?.formula.toLowerCase().includes(q) ||
          f.emissionSource?.name.toLowerCase().includes(q) ||
          f.emissionSourceCategory?.name.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (categoryFilter && f.emissionSourceCategoryId !== categoryFilter) return false;
      if (sourceFilter && f.emissionSourceId !== sourceFilter) return false;
      return true;
    });
  }, [factors, search, categoryFilter, sourceFilter]);

  // Group by category → source
  const grouped = useMemo<CategoryGroup[]>(() => {
    const catMap = new Map<string, {
      categoryName: string;
      sourceMap: Map<string, { sourceName: string; factors: ApiEmissionFactor[] }>;
    }>();

    for (const f of filteredFactors) {
      const catId = f.emissionSourceCategoryId ?? 'sin-categoria';
      const catName = f.emissionSourceCategory?.name ?? 'Sin categoría';
      const srcId = f.emissionSourceId ?? 'sin-fuente';
      const srcName = f.emissionSource?.name ?? 'Sin fuente';

      if (!catMap.has(catId)) {
        catMap.set(catId, { categoryName: catName, sourceMap: new Map() });
      }
      const cat = catMap.get(catId)!;

      if (!cat.sourceMap.has(srcId)) {
        cat.sourceMap.set(srcId, { sourceName: srcName, factors: [] });
      }
      cat.sourceMap.get(srcId)!.factors.push(f);
    }

    return Array.from(catMap.entries())
      .map(([categoryId, { categoryName, sourceMap }]) => ({
        categoryId,
        categoryName,
        sources: Array.from(sourceMap.entries())
          .map(([sourceId, { sourceName, factors: srcFactors }]) => ({
            sourceId,
            sourceName,
            factors: srcFactors,
          }))
          .sort((a, b) => a.sourceName.localeCompare(b.sourceName, 'es')),
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'es'));
  }, [filteredFactors]);

  // Collect all keys for expand/collapse all
  const allKeys = useMemo(() => {
    const catIds: string[] = [];
    const srcKeys: string[] = [];
    grouped.forEach(g => {
      catIds.push(g.categoryId);
      g.sources.forEach(s => srcKeys.push(`${g.categoryId}:${s.sourceId}`));
    });
    return { catIds, srcKeys };
  }, [grouped]);

  const isAllCollapsed = allKeys.catIds.every(id => collapsedCategories.has(id));

  const collapseAll = () => {
    setCollapsedCategories(new Set(allKeys.catIds));
    setCollapsedSources(new Set(allKeys.srcKeys));
  };

  const expandAll = () => {
    setCollapsedCategories(new Set());
    setCollapsedSources(new Set());
  };

  if (factors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center text-zinc-400 text-sm">
        No hay factores de emisión asociados a este análisis
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar gas, fuente o categoría..."
            className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {uniqueCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700 min-w-[160px]"
          >
            <option value="">Todas las categorías</option>
            {uniqueCategories.map(c => (
              <option key={c.id} value={c.id} title={c.name}>
                {c.name.length > 30 ? `${c.name.substring(0, 27)}...` : c.name}
              </option>
            ))}
          </select>
        )}

        {uniqueSources.length > 0 && (
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700 min-w-[160px]"
          >
            <option value="">Todas las fuentes</option>
            {uniqueSources.map(s => (
              <option key={s.id} value={s.id} title={s.name}>
                {s.name.length > 30 ? `${s.name.substring(0, 27)}...` : s.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={isAllCollapsed ? expandAll : collapseAll}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 font-semibold px-2.5 py-2 rounded-xl border border-zinc-200 hover:border-zinc-300 transition-colors ml-auto"
        >
          <ChevronsUpDown size={12} />
          {isAllCollapsed ? 'Expandir todo' : 'Colapsar todo'}
        </button>
      </div>

      {filteredFactors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 p-10 text-center text-zinc-400 text-sm">
          No hay factores que coincidan con la búsqueda
        </div>
      ) : (
        grouped.map(group => {
          const catCollapsed = collapsedCategories.has(group.categoryId);
          const totalFactors = group.sources.reduce((s, src) => s + src.factors.length, 0);

          return (
            <div
              key={group.categoryId}
              className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden"
            >
              {/* ── Nivel 1: Categoría ── */}
              <div
                className="px-5 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-100/70 transition-colors"
                onClick={() => toggleCategory(group.categoryId)}
              >
                <div className="flex items-center gap-2">
                  {catCollapsed
                    ? <ChevronRight size={14} className="text-zinc-400 shrink-0" />
                    : <ChevronDown size={14} className="text-zinc-400 shrink-0" />
                  }
                  <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    {group.categoryName}
                  </h3>
                  {catCollapsed && (
                    <span className="text-zinc-400 text-[10px]">
                      ({group.sources.length} {group.sources.length === 1 ? 'fuente' : 'fuentes'})
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400">
                  {totalFactors} {totalFactors === 1 ? 'factor' : 'factores'}
                </span>
              </div>

              {/* ── Nivel 2: Fuentes dentro de la categoría ── */}
              {!catCollapsed && group.sources.map(src => {
                const srcKey = `${group.categoryId}:${src.sourceId}`;
                const srcCollapsed = collapsedSources.has(srcKey);

                return (
                  <div key={srcKey} className="border-b border-zinc-100 last:border-b-0">
                    {/* Source sub-header */}
                    <div
                      className="px-5 py-2 bg-zinc-50/50 border-b border-zinc-50 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-50 transition-colors"
                      onClick={() => toggleSource(srcKey)}
                    >
                      <div className="flex items-center gap-2">
                        {srcCollapsed
                          ? <ChevronRight size={12} className="text-zinc-300 shrink-0" />
                          : <ChevronDown size={12} className="text-zinc-300 shrink-0" />
                        }
                        <Zap size={11} className="text-zinc-400 shrink-0" />
                        <span className="text-xs font-semibold text-zinc-600">{src.sourceName}</span>
                        {srcCollapsed && (
                          <span className="text-zinc-400 text-[10px]">
                            ({src.factors.length} {src.factors.length === 1 ? 'gas' : 'gases'})
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-400">
                        {src.factors.length} {src.factors.length === 1 ? 'factor' : 'factores'}
                      </span>
                    </div>

                    {/* ── Nivel 3: Factores ── */}
                    {!srcCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider bg-white">
                              <th className="px-5 py-2 text-left">Gas</th>
                              <th className="px-4 py-2 text-right">GWP</th>
                              <th className="px-4 py-2 text-right">Factor</th>
                              <th className="px-4 py-2 text-left">Unidad</th>
                              <th className="px-4 py-2 text-right hidden sm:table-cell">Incert. %</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-50">
                            {groupFactorsByGas(src.factors).map(gasGroup => {
                              const hasVariants = gasGroup.variants.length > 1;
                              return (
                                <tr key={gasGroup.gasId} className="hover:bg-zinc-50/60 transition-colors">
                                  <td className="px-5 py-2.5">
                                    <div className="flex items-center gap-2">
                                      <FlaskConical size={11} className="text-violet-400 shrink-0" />
                                      <span className="text-zinc-700 font-medium">{gasGroup.gasName}</span>
                                      {gasGroup.formula && (
                                        <span className="font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-[10px]">
                                          {gasGroup.formula}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-700 font-semibold">
                                    {gasGroup.gwp}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                                    <div className={`flex flex-col ${hasVariants ? 'gap-1' : ''}`}>
                                      {gasGroup.variants.map(f => (
                                        <span key={f.id} className="text-zinc-800 font-semibold">
                                          {fmtFactor(f.factor)}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className={`flex flex-col ${hasVariants ? 'gap-1' : ''}`}>
                                      {gasGroup.variants.map(f => {
                                        const massUnit = (f.factorMassUnit ?? 'kg') as FactorMassUnit;
                                        const actSymbol = f.emissionUnit?.symbol;
                                        const unitLabel = actSymbol ? `${massUnit}/${actSymbol}` : massUnit;
                                        const unitTitle = actSymbol && f.emissionUnit?.name
                                          ? `${massUnit} por ${f.emissionUnit.name}`
                                          : massUnit;
                                        return (
                                          <span
                                            key={f.id}
                                            className="font-mono text-zinc-700 font-semibold bg-zinc-100 px-2 py-0.5 rounded w-fit"
                                            title={unitTitle}
                                          >
                                            {unitLabel}
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                                    <div className={`flex flex-col items-end ${hasVariants ? 'gap-1' : ''}`}>
                                      {gasGroup.variants.map(f => (
                                        <span key={f.id} className={f.uncertainty != null ? 'text-zinc-500' : 'text-zinc-300'}>
                                          {f.uncertainty != null ? `${f.uncertainty}%` : '—'}
                                        </span>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })
      )}
    </div>
  );
};
