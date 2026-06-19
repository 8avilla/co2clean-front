'use client';

import { Fragment, useMemo, useState } from 'react';
import { FlaskConical, Search, TriangleAlert, X } from 'lucide-react';
import { GroupedResult } from './hooks/useAnalysisResults';
import { CHART_COLORS } from './AnalysisV2EmissionsChart';

interface AnalysisV2GroupBreakdownProps {
  groups: GroupedResult[];
  totalTco2e: number;
  onNavigateToUncovered?: () => void;
}

function fmt(value: number): string {
  if (value === 0) return '0';
  if (value >= 1) return Math.round(value).toLocaleString('es-CO');
  return value.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFactor(value: number): string {
  if (value === 0) return '0';
  if (value < 0.0001) return value.toExponential(3);
  return value.toPrecision(4);
}

function CoverageBadge({ covered, total }: { covered: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((covered / total) * 100);
  if (pct === 100) {
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
        100%
      </span>
    );
  }
  if (pct === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-600 border border-red-200">
        <TriangleAlert size={9} />
        Sin factor
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-200">
      {pct}%
    </span>
  );
}

export const AnalysisV2GroupBreakdown = ({
  groups,
  totalTco2e,
  onNavigateToUncovered,
}: AnalysisV2GroupBreakdownProps) => {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [gasFilter, setGasFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('');

  const uniqueGases = useMemo(() => {
    const gases = new Set<string>();
    groups.forEach(g => {
      g.categories.forEach(c => {
        c.factors.forEach(f => gases.add(f.gasName));
      });
    });
    return Array.from(gases).sort();
  }, [groups]);

  const uniqueSources = useMemo(() => {
    const sourcesMap = new Map<string, string>();
    groups.forEach(g => {
      if (groupFilter && g.groupId !== groupFilter) return;
      g.categories.forEach(c => {
        sourcesMap.set(c.categoryId, c.categoryName);
      });
    });
    return Array.from(sourcesMap.entries())
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [groups, groupFilter]);

  const filteredGroups = useMemo<GroupedResult[]>(() => {
    const q = search.trim().toLowerCase();

    return groups
      .filter(g => !groupFilter || g.groupId === groupFilter)
      .map(g => {
        const filteredCats = g.categories.map(cat => {
          // Source filter
          if (sourceFilter && cat.categoryId !== sourceFilter) return null;

          const catMatchesQ = q ? cat.categoryName.toLowerCase().includes(q) : true;

          const finalFactors = cat.factors.filter(f => {
            if (gasFilter && f.gasName !== gasFilter) return false;

            if (q && !catMatchesQ) {
               const fMatch = f.gasName.toLowerCase().includes(q) ||
                              (f.formula && f.formula.toLowerCase().includes(q));
               if (!fMatch) return false;
            }
            return true;
          });

          if (finalFactors.length === 0) return null;
          
          const newCatTco2e = finalFactors.reduce((sum, f) => sum + f.tco2e, 0);
          return { ...cat, factors: finalFactors, tco2e: newCatTco2e };
        }).filter(Boolean) as (typeof g.categories)[0][];

        if (filteredCats.length === 0) return null;

        const newGroupTco2e = filteredCats.reduce((sum, c) => sum + c.tco2e, 0);
        return { ...g, categories: filteredCats, tco2e: newGroupTco2e };
      }).filter(Boolean) as GroupedResult[];
  }, [groups, groupFilter, search, gasFilter, sourceFilter]);

  const filteredTotalTco2e = useMemo(
    () => filteredGroups.reduce((s, g) => s + g.tco2e, 0),
    [filteredGroups]
  );

  const filteredTotalRecords = useMemo(
    () =>
      filteredGroups.reduce(
        (s, g) => s + g.categories.reduce((cs, c) => cs + c.recordCount, 0),
        0
      ),
    [filteredGroups]
  );

  const isFiltered = !!search || !!groupFilter || !!gasFilter || !!sourceFilter;

  const clearFilters = () => {
    setSearch('');
    setGroupFilter('');
    setGasFilter('');
    setSourceFilter('');
  };

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center text-zinc-400 text-sm">
        Sin categorías de emisión registradas
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Header + filters */}
      <div className="px-6 py-4 border-b border-zinc-100 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Desglose por Factor de Emisión</h3>
            <p className="text-xs text-zinc-400 mt-0.5">Grupo · Categoría · Gas</p>
          </div>

          {isFiltered && (
            <button
              onClick={clearFilters}
              className="text-xs text-violet-600 hover:text-violet-800 font-semibold flex items-center gap-1"
            >
              <X size={12} />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoría o gas..."
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X size={11} />
              </button>
            )}
          </div>

          {/* Specific Source Filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700 min-w-[160px]"
          >
            <option value="">Todas las fuentes</option>
            {uniqueSources.map(s => (
              <option key={s.value} value={s.value} title={s.label}>
                {s.label.length > 35 ? s.label.substring(0, 32) + '...' : s.label}
              </option>
            ))}
          </select>

          {/* Gas Filter */}
          <select
            value={gasFilter}
            onChange={e => setGasFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700 min-w-[160px]"
          >
            <option value="">Todos los gases</option>
            {uniqueGases.map(gas => (
              <option key={gas} value={gas}>{gas}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="px-6 py-10 text-center text-zinc-400 text-sm">
          No hay resultados para los filtros aplicados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                <th className="px-5 py-2.5 text-left font-bold">Concepto</th>
                <th className="px-3 py-2.5 text-right font-bold">Reg.</th>
                <th className="px-3 py-2.5 text-right font-bold hidden sm:table-cell">GWP</th>
                <th className="px-3 py-2.5 text-right font-bold hidden md:table-cell">Factor</th>
                <th className="px-3 py-2.5 text-right font-bold hidden lg:table-cell">Ton gas</th>
                <th className="px-3 py-2.5 text-right font-bold">tCO₂e</th>
                <th className="px-4 py-2.5 text-right font-bold">%</th>
              </tr>
            </thead>

            <tbody>
              {filteredGroups.map((group, groupIdx) => {
                const originalIdx = groups.findIndex(g => g.groupId === group.groupId);
                const color = CHART_COLORS[originalIdx % CHART_COLORS.length];

                return (
                  <Fragment key={group.groupId}>
                    {/* ── Nivel 1: Grupo ── */}
                    <tr
                      className="border-b border-zinc-600"
                      style={{ backgroundColor: '#3f3f46', borderLeft: `4px solid ${color}` }}
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          <span className="font-bold text-white text-[13px]">{group.groupName}</span>
                          {group.groupCode && (
                            <span className="font-mono text-zinc-400 text-[10px]">{group.groupCode}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5" />
                      <td className="px-3 py-2.5 hidden sm:table-cell" />
                      <td className="px-3 py-2.5 hidden md:table-cell" />
                      <td className="px-3 py-2.5 hidden lg:table-cell" />
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-bold text-white tabular-nums">{fmt(group.tco2e)}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-zinc-300 tabular-nums">{group.percentage.toFixed(1)}%</span>
                      </td>
                    </tr>

                    {group.categories.map((cat, catIdx) => {
                      const isLastCategory = catIdx === group.categories.length - 1;

                      return (
                        <Fragment key={cat.categoryId}>
                          {/* ── Nivel 2: Categoría ── */}
                          <tr
                            className="border-b border-zinc-100 bg-zinc-50"
                            style={{ borderLeft: `4px solid ${color}` }}
                          >
                            <td className="px-5 py-2 pl-9">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-zinc-700">{cat.categoryName}</span>
                                <CoverageBadge covered={cat.coveredRecordCount} total={cat.recordCount} />
                                {cat.coveredRecordCount < cat.recordCount && onNavigateToUncovered && (
                                  <button
                                    type="button"
                                    onClick={onNavigateToUncovered}
                                    className="text-[10px] text-amber-600 hover:text-amber-800 underline underline-offset-1"
                                  >
                                    ver →
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right text-zinc-400 tabular-nums">
                              {cat.recordCount}
                            </td>
                            <td className="px-3 py-2 hidden sm:table-cell" />
                            <td className="px-3 py-2 hidden md:table-cell" />
                            <td className="px-3 py-2 hidden lg:table-cell" />
                            <td className="px-3 py-2 text-right">
                              <span className="font-semibold text-zinc-800 tabular-nums">{fmt(cat.tco2e)}</span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              <span className="text-zinc-500 tabular-nums">{cat.percentage.toFixed(1)}%</span>
                            </td>
                          </tr>

                          {/* ── Nivel 3: Factores ── */}
                          {cat.factors.map((f, fIdx) => {
                            const isLastFactor = fIdx === cat.factors.length - 1;
                            return (
                              <tr
                                key={f.factorId}
                                className={`bg-white hover:bg-zinc-50/60 transition-colors ${
                                  isLastFactor && isLastCategory
                                    ? 'border-b-2 border-zinc-200'
                                    : 'border-b border-zinc-50'
                                }`}
                                style={{ borderLeft: `4px solid ${color}` }}
                              >
                                <td className="px-5 py-2 pl-14">
                                  <div className="flex items-center gap-1.5">
                                    <FlaskConical size={11} className="text-violet-400 shrink-0" />
                                    <span className="text-zinc-600">{f.gasName}</span>
                                    {f.formula && (
                                      <span className="font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-[10px] leading-none">
                                        {f.formula}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-right text-zinc-400 tabular-nums">
                                  {f.recordCount}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-zinc-500 hidden sm:table-cell tabular-nums">
                                  {f.gwp}
                                </td>
                                <td className="px-3 py-2 text-right font-mono hidden md:table-cell">
                                  <span className="text-zinc-600">{fmtFactor(f.factorValue)}</span>
                                  {f.unitSymbol && (
                                    <span className="text-zinc-300">/{f.unitSymbol}</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-mono hidden lg:table-cell">
                                  <span className="text-zinc-500 tabular-nums">{fmt(f.gasTonnes)}</span>
                                  <span className="text-zinc-300 ml-0.5">t</span>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <span className="font-semibold text-violet-700 tabular-nums">{fmt(f.tco2e)}</span>
                                </td>
                                <td className="px-4 py-2 text-right">
                                  <span className="text-zinc-400 tabular-nums">{f.percentage.toFixed(1)}%</span>
                                </td>
                              </tr>
                            );
                          })}
                        </Fragment>
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>

            {/* Footer */}
            <tfoot>
              <tr className="bg-zinc-50 border-t-2 border-zinc-200">
                <td className="px-5 py-3">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider">
                    {isFiltered ? 'Subtotal filtrado' : 'Total general'}
                  </span>
                  <span className="ml-2 text-zinc-400">
                    {filteredTotalRecords.toLocaleString('es-CO')} reg.
                  </span>
                </td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 hidden sm:table-cell" />
                <td className="px-3 py-3 hidden md:table-cell" />
                <td className="px-3 py-3 hidden lg:table-cell" />
                <td className="px-3 py-3 text-right">
                  <span className="text-sm font-black text-zinc-900 tabular-nums">
                    {fmt(filteredTotalTco2e)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-zinc-700">
                    {isFiltered
                      ? `${totalTco2e > 0 ? ((filteredTotalTco2e / totalTco2e) * 100).toFixed(1) : '0'}%`
                      : '100%'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};
