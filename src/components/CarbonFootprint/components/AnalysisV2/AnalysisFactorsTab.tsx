'use client';

import { useState, useMemo } from 'react';
import { FlaskConical, Search, X } from 'lucide-react';
import { ApiEmissionFactor, FACTOR_MASS_UNIT_TO_KG, FactorMassUnit } from '../../types';

interface AnalysisFactorsTabProps {
  factors: ApiEmissionFactor[];
}

function fmtFactor(value: number): string {
  if (value === 0) return '0';
  if (value < 0.0001) return value.toExponential(3);
  return value.toPrecision(5);
}

interface CategoryGroup {
  categoryId: string;
  categoryName: string;
  factors: ApiEmissionFactor[];
}

export const AnalysisFactorsTab = ({ factors }: AnalysisFactorsTabProps) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of factors) {
      if (f.emissionSourceCategoryId && f.emissionSourceCategory?.name) {
        map.set(f.emissionSourceCategoryId, f.emissionSourceCategory.name);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [factors, categoryFilter]);

  const filteredFactors = useMemo(() => {
    const q = search.trim().toLowerCase();
    return factors.filter(f => {
      if (q) {
        const match = f.gas?.chemicalName.toLowerCase().includes(q) ||
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

  const grouped = useMemo<CategoryGroup[]>(() => {
    const map = new Map<string, CategoryGroup>();
    for (const f of filteredFactors) {
      const catId = f.emissionSourceCategoryId ?? 'sin-categoria';
      const catName = f.emissionSourceCategory?.name ?? 'Sin categoría';
      if (!map.has(catId)) map.set(catId, { categoryId: catId, categoryName: catName, factors: [] });
      map.get(catId)!.factors.push(f);
    }
    return Array.from(map.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'es'));
  }, [filteredFactors]);

  if (factors.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-12 text-center text-zinc-400 text-sm">
        No hay factores de emisión asociados a este análisis
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search bar & Filters */}
      <div className="flex flex-wrap gap-3">
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

        {/* Category filter */}
        {uniqueCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700 min-w-[160px]"
          >
            <option value="">Todas las categorías de emisión</option>
            {uniqueCategories.map(c => (
              <option key={c.id} value={c.id} title={c.name}>
                {c.name.length > 30 ? c.name.substring(0, 27) + '...' : c.name}
              </option>
            ))}
          </select>
        )}

        {/* Source filter */}
        {uniqueSources.length > 0 && (
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="text-xs px-2.5 py-2 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700 min-w-[160px]"
          >
            <option value="">Todas las fuentes de emision</option>
            {uniqueSources.map(s => (
              <option key={s.id} value={s.id} title={s.name}>
                {s.name.length > 30 ? s.name.substring(0, 27) + '...' : s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {filteredFactors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 p-10 text-center text-zinc-400 text-sm">
          No hay factores que coincidan con la búsqueda
        </div>
      ) : (
        grouped.map(group => (
          <div
            key={group.categoryId}
            className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden"
          >
            {/* Category header */}
            <div className="px-5 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                {group.categoryName}
              </h3>
              <span className="text-xs text-zinc-400">
                {group.factors.length} factor{group.factors.length !== 1 ? 'es' : ''}
              </span>
            </div>

            {/* Factors table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="px-5 py-2 text-left">Gas</th>
                    <th className="px-4 py-2 text-right">GWP</th>
                    <th className="px-4 py-2 text-right">Factor</th>
                    <th className="px-4 py-2 text-left">Unidad de medida</th>
                    <th className="px-4 py-2 text-right hidden sm:table-cell">Incert. %</th>
                    <th className="px-4 py-2 text-left">Fuente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {group.factors
                    .slice()
                    .sort((a, b) => {
                      const massA = (a.factorMassUnit ?? 'kg') as FactorMassUnit;
                      const massB = (b.factorMassUnit ?? 'kg') as FactorMassUnit;
                      const impactA = a.factor * (FACTOR_MASS_UNIT_TO_KG[massA] ?? 1) * a.gwp;
                      const impactB = b.factor * (FACTOR_MASS_UNIT_TO_KG[massB] ?? 1) * b.gwp;
                      return impactB - impactA;
                    })
                    .map(f => {
                      const massUnit = (f.factorMassUnit ?? 'kg') as FactorMassUnit;
                      const activitySymbol = f.emissionUnit?.symbol;
                      const unitLabel = activitySymbol
                        ? `${massUnit}/${activitySymbol}`
                        : massUnit;
                      const unitTitle = activitySymbol && f.emissionUnit?.name
                        ? `${massUnit} por ${f.emissionUnit.name}`
                        : massUnit;

                      return (
                        <tr key={f.id} className="hover:bg-zinc-50/60 transition-colors">
                          {/* Gas */}
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <FlaskConical size={12} className="text-violet-400 shrink-0" />
                              <span className="text-zinc-700 font-medium">
                                {f.gas?.chemicalName ?? 'Gas desconocido'}
                              </span>
                              {f.gas?.formula && (
                                <span className="font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-[10px]">
                                  {f.gas.formula}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* GWP */}
                          <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-700 font-semibold">
                            {f.gwp}
                          </td>

                          {/* Factor value */}
                          <td className="px-4 py-3 text-right font-mono tabular-nums">
                            <span className="text-zinc-800 font-semibold">{fmtFactor(f.factor)}</span>
                          </td>

                          {/* Unidad de medida: masa/actividad */}
                          <td className="px-4 py-3">
                            <span
                              className="font-mono text-zinc-700 font-semibold bg-zinc-100 px-2 py-0.5 rounded"
                              title={unitTitle}
                            >
                              {unitLabel}
                            </span>
                          </td>

                          {/* Uncertainty */}
                          <td className="px-4 py-3 text-right hidden sm:table-cell">
                            {f.uncertainty != null ? (
                              <span className="text-zinc-500">{f.uncertainty}%</span>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>

                          {/* Source */}
                          <td className="px-4 py-3 max-w-[160px]">
                            <span
                              className="text-zinc-600 truncate block"
                              title={f.emissionSource?.name ?? ''}
                            >
                              {f.emissionSource?.name ?? <span className="text-zinc-300">—</span>}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
