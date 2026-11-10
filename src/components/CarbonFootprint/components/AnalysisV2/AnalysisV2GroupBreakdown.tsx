"use client";

import { Fragment, useMemo, useState, useCallback } from "react";
import {
  FlaskConical,
  TriangleAlert,
  X,
  Zap,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  HelpCircle,
} from "lucide-react";
import { Tooltip } from "@/shared/components/Tooltip";
import { GroupedResult, SourceResult } from "./hooks/useAnalysisResults";
import { CHART_COLORS } from "./AnalysisV2EmissionsChart";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { matchesSearchTerms } from "@/shared/lib/list-utils";

interface AnalysisV2GroupBreakdownProps {
  groups: GroupedResult[];
  totalTco2e: number;
  onNavigateToUncovered?: () => void;
}

function fmt(value: number): string {
  if (value === 0) return "0";
  return value.toLocaleString("es-CO", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

function fmtFactor(value: number): string {
  if (value === 0) return "0";
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

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export const AnalysisV2GroupBreakdown = ({
  groups,
  totalTco2e,
  onNavigateToUncovered,
}: AnalysisV2GroupBreakdownProps) => {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [gasFilter, setGasFilter] = useState<string>("");
  const [sourceFilter, setSourceFilter] = useState<string>("");

  // Collapsed sets — empty means all expanded (default)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(
    new Set(),
  );

  const toggleGroup = useCallback(
    (id: string) => setCollapsedGroups((prev) => toggle(prev, id)),
    [],
  );
  const toggleCategory = useCallback(
    (key: string) => setCollapsedCategories((prev) => toggle(prev, key)),
    [],
  );
  const toggleSource = useCallback(
    (key: string) => setCollapsedSources((prev) => toggle(prev, key)),
    [],
  );

  // Collect all composite keys from current filtered groups for expand/collapse all
  const allKeys = useMemo(() => {
    const groupIds: string[] = [];
    const catKeys: string[] = [];
    const srcKeys: string[] = [];
    groups.forEach((g) => {
      groupIds.push(g.groupId);
      g.categories.forEach((c) => {
        const catKey = `${g.groupId}:${c.categoryId}`;
        catKeys.push(catKey);
        c.sources.forEach((s) => {
          srcKeys.push(`${catKey}:${s.sourceId}`);
        });
      });
    });
    return { groupIds, catKeys, srcKeys };
  }, [groups]);

  const isAllCollapsed = allKeys.groupIds.every((id) =>
    collapsedGroups.has(id),
  );

  const collapseAll = () => {
    setCollapsedGroups(new Set(allKeys.groupIds));
    setCollapsedCategories(new Set(allKeys.catKeys));
    setCollapsedSources(new Set(allKeys.srcKeys));
  };

  const expandAll = () => {
    setCollapsedGroups(new Set());
    setCollapsedCategories(new Set());
    setCollapsedSources(new Set());
  };

  const uniqueGases = useMemo(() => {
    const gases = new Set<string>();
    groups.forEach((g) =>
      g.categories.forEach((c) =>
        c.sources.forEach((s) =>
          s.factors.forEach((f) => gases.add(f.gasName)),
        ),
      ),
    );
    return Array.from(gases).sort();
  }, [groups]);

  const uniqueSources = useMemo(() => {
    const map = new Map<string, string>();
    groups.forEach((g) => {
      if (groupFilter && g.groupId !== groupFilter) return;
      g.categories.forEach((c) =>
        c.sources.forEach((s) => map.set(s.sourceId, s.sourceName)),
      );
    });
    return Array.from(map.entries())
      .map(([value, label]) => ({ label, value }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
  }, [groups, groupFilter]);

  const filteredGroups = useMemo<GroupedResult[]>(() => {
    const hasQuery = search.trim() !== "";

    return groups
      .filter((g) => !groupFilter || g.groupId === groupFilter)
      .map((g) => {
        const filteredCats = g.categories
          .map((cat) => {
            const catMatchesQ = matchesSearchTerms(search, cat.categoryName);

            const filteredSources = cat.sources
              .map((src): SourceResult | null => {
                if (sourceFilter && src.sourceId !== sourceFilter) return null;
                const srcMatchesQ = matchesSearchTerms(search, src.sourceName);

                const finalFactors = src.factors.filter((f) => {
                  if (gasFilter && f.gasName !== gasFilter) return false;
                  if (hasQuery && !catMatchesQ && !srcMatchesQ) {
                    return (
                      matchesSearchTerms(search, f.gasName) ||
                      matchesSearchTerms(search, f.formula)
                    );
                  }
                  return true;
                });

                if (finalFactors.length === 0) return null;
                const newSrcTco2e = finalFactors.reduce(
                  (s, f) => s + f.tco2e,
                  0,
                );
                return { ...src, factors: finalFactors, tco2e: newSrcTco2e };
              })
              .filter((s): s is SourceResult => s !== null);

            if (filteredSources.length === 0) return null;
            const newCatTco2e = filteredSources.reduce(
              (s, src) => s + src.tco2e,
              0,
            );
            return { ...cat, sources: filteredSources, tco2e: newCatTco2e };
          })
          .filter((c): c is (typeof g.categories)[0] => c !== null);

        if (filteredCats.length === 0) return null;
        const newGroupTco2e = filteredCats.reduce((s, c) => s + c.tco2e, 0);
        return { ...g, categories: filteredCats, tco2e: newGroupTco2e };
      })
      .filter((g): g is GroupedResult => g !== null);
  }, [groups, groupFilter, search, gasFilter, sourceFilter]);

  const filteredTotalTco2e = useMemo(
    () => filteredGroups.reduce((s, g) => s + g.tco2e, 0),
    [filteredGroups],
  );

  const filteredTotalRecords = useMemo(
    () =>
      filteredGroups.reduce(
        (s, g) => s + g.categories.reduce((cs, c) => cs + c.recordCount, 0),
        0,
      ),
    [filteredGroups],
  );

  const isFiltered = !!search || !!groupFilter || !!gasFilter || !!sourceFilter;

  const clearFilters = () => {
    setSearch("");
    setGroupFilter("");
    setGasFilter("");
    setSourceFilter("");
  };

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center text-zinc-400 text-sm">
        Sin tipos de fuente registrados
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Header + filters */}
      <div className="px-6 py-4 border-b border-zinc-100 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Desglose por factor de emisión
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Grupo › Tipo › Fuente › Gas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={isAllCollapsed ? expandAll : collapseAll}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-800 font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors"
            >
              <ChevronsUpDown size={12} />
              {isAllCollapsed ? "Expandir todo" : "Colapsar todo"}
            </button>
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
        </div>

        <div className="flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar tipo de fuente, fuente o gas..."
            accent="violet"
            className="flex-1 min-w-[180px] max-w-xs"
          />

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700 min-w-[160px]"
          >
            <option value="">Todas las fuentes</option>
            {uniqueSources.map((s) => (
              <option key={s.value} value={s.value} title={s.label}>
                {s.label.length > 35
                  ? `${s.label.substring(0, 32)}...`
                  : s.label}
              </option>
            ))}
          </select>

          <select
            value={gasFilter}
            onChange={(e) => setGasFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700 min-w-[160px]"
          >
            <option value="">Todos los gases</option>
            {uniqueGases.map((gas) => (
              <option key={gas} value={gas}>
                {gas}
              </option>
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
                <th className="px-3 py-2.5 text-right font-bold hidden lg:table-cell">
                  <Tooltip content="Suma de cantidades registradas en la fuente de emisión (datos de actividad)">
                    <span className="flex items-center justify-end gap-1 cursor-default">
                      Cantidad
                      <HelpCircle size={11} className="opacity-60" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-3 py-2.5 text-right font-bold hidden lg:table-cell">
                  <Tooltip content="Masa del gas emitido antes de aplicar el GWP (toneladas de gas puro)">
                    <span className="flex items-center justify-end gap-1 cursor-default">
                      Ton gas
                      <HelpCircle size={11} className="opacity-60" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-3 py-2.5 text-right font-bold">
                  <Tooltip content="Toneladas de CO₂ equivalente — masa de gas × GWP. Unidad estándar para comparar diferentes gases de efecto invernadero.">
                    <span className="flex items-center justify-end gap-1 cursor-default">
                      tCO₂e
                      <HelpCircle size={11} className="opacity-60" />
                    </span>
                  </Tooltip>
                </th>
                <th className="px-4 py-2.5 text-right font-bold">
                  <Tooltip
                    content="Porcentaje sobre el total general de emisiones del inventario"
                    side="bottom"
                  >
                    <span className="flex items-center justify-end gap-1 cursor-default">
                      %
                      <HelpCircle size={11} className="opacity-60" />
                    </span>
                  </Tooltip>
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredGroups.map((group) => {
                const originalIdx = groups.findIndex(
                  (g) => g.groupId === group.groupId,
                );
                const color = CHART_COLORS[originalIdx % CHART_COLORS.length];
                const groupCollapsed = collapsedGroups.has(group.groupId);

                return (
                  <Fragment key={group.groupId}>
                    {/* ── Nivel 1: Grupo ── */}
                    <tr
                      className="border-b border-zinc-600 cursor-pointer select-none"
                      style={{
                        backgroundColor: "#3f3f46",
                        borderLeft: `4px solid ${color}`,
                      }}
                      onClick={() => toggleGroup(group.groupId)}
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          {groupCollapsed ? (
                            <ChevronRight
                              size={14}
                              className="text-zinc-400 shrink-0"
                            />
                          ) : (
                            <ChevronDown
                              size={14}
                              className="text-zinc-400 shrink-0"
                            />
                          )}
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-bold text-white text-[13px]">
                            {group.groupName}
                          </span>
                          {group.groupCode && (
                            <span className="font-mono text-zinc-400 text-[10px]">
                              {group.groupCode}
                            </span>
                          )}
                          {groupCollapsed && (
                            <span className="text-zinc-500 text-[10px] ml-1">
                              ({group.categories.length}{" "}
                              {group.categories.length === 1
                                ? "tipo de fuente"
                                : "tipos de fuente"}
                              )
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden lg:table-cell" />
                      <td className="px-3 py-2.5 hidden lg:table-cell" />
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-bold text-white tabular-nums">
                          {fmt(group.tco2e)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <span className="text-zinc-300 tabular-nums">
                          {totalTco2e > 0
                            ? ((group.tco2e / totalTco2e) * 100).toFixed(1)
                            : "0"}
                          %
                        </span>
                      </td>
                    </tr>

                    {!groupCollapsed &&
                      group.categories.map((cat) => {
                        const catKey = `${group.groupId}:${cat.categoryId}`;
                        const catCollapsed = collapsedCategories.has(catKey);

                        return (
                          <Fragment key={catKey}>
                            {/* ── Nivel 2: Tipo de fuente ── */}
                            <tr
                              className="border-b border-zinc-200 bg-zinc-50 cursor-pointer select-none hover:bg-zinc-100/70 transition-colors"
                              style={{ borderLeft: `4px solid ${color}` }}
                              onClick={() => toggleCategory(catKey)}
                            >
                              <td className="px-5 py-2 pl-9">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {catCollapsed ? (
                                    <ChevronRight
                                      size={12}
                                      className="text-zinc-400 shrink-0"
                                    />
                                  ) : (
                                    <ChevronDown
                                      size={12}
                                      className="text-zinc-400 shrink-0"
                                    />
                                  )}
                                  <span className="font-semibold text-zinc-700">
                                    {cat.categoryName}
                                  </span>
                                  <CoverageBadge
                                    covered={cat.coveredRecordCount}
                                    total={cat.recordCount}
                                  />
                                  {cat.coveredRecordCount < cat.recordCount &&
                                    onNavigateToUncovered && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onNavigateToUncovered();
                                        }}
                                        className="text-[10px] text-amber-600 hover:text-amber-800 underline underline-offset-1"
                                      >
                                        ver →
                                      </button>
                                    )}
                                  {catCollapsed && (
                                    <span className="text-zinc-400 text-[10px]">
                                      ({cat.sources.length}{" "}
                                      {cat.sources.length === 1
                                        ? "fuente"
                                        : "fuentes"}
                                      )
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2 hidden lg:table-cell" />
                              <td className="px-3 py-2 hidden lg:table-cell" />
                              <td className="px-3 py-2 text-right">
                                <span className="font-semibold text-zinc-800 tabular-nums">
                                  {fmt(cat.tco2e)}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <span className="text-zinc-500 tabular-nums">
                                  {totalTco2e > 0
                                    ? ((cat.tco2e / totalTco2e) * 100).toFixed(
                                        1,
                                      )
                                    : "0"}
                                  %
                                </span>
                              </td>
                            </tr>

                            {!catCollapsed &&
                              cat.sources.map((src, srcIdx) => {
                                const srcKey = `${catKey}:${src.sourceId}`;
                                const srcCollapsed =
                                  collapsedSources.has(srcKey);
                                const isLastSource =
                                  srcIdx === cat.sources.length - 1;

                                return (
                                  <Fragment key={srcKey}>
                                    {/* ── Nivel 3: Fuente de emisión ── */}
                                    <tr
                                      className="border-b border-zinc-100 bg-white cursor-pointer select-none hover:bg-zinc-50/80 transition-colors"
                                      style={{
                                        borderLeft: `4px solid ${color}`,
                                      }}
                                      onClick={() => toggleSource(srcKey)}
                                    >
                                      <td className="px-5 py-1.5 pl-14">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {srcCollapsed ? (
                                            <ChevronRight
                                              size={11}
                                              className="text-zinc-300 shrink-0"
                                            />
                                          ) : (
                                            <ChevronDown
                                              size={11}
                                              className="text-zinc-300 shrink-0"
                                            />
                                          )}
                                          <Zap
                                            size={11}
                                            className="text-zinc-400 shrink-0"
                                          />
                                          <span className="font-medium text-zinc-600">
                                            {src.sourceName}
                                          </span>
                                          <CoverageBadge
                                            covered={src.coveredRecordCount}
                                            total={src.recordCount}
                                          />
                                          {srcCollapsed && (
                                            <span className="text-zinc-400 text-[10px]">
                                              ({src.factors.length}{" "}
                                              {src.factors.length === 1
                                                ? "gas"
                                                : "gases"}
                                              )
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-1.5 hidden lg:table-cell text-right">
                                        <span className="tabular-nums text-zinc-600 font-medium">
                                          {src.totalQuantity.toLocaleString(
                                            "es-CO",
                                            { maximumFractionDigits: 2 },
                                          )}
                                          {src.unitSymbol && (
                                            <span className="text-zinc-400 ml-0.5 text-[10px]">
                                              {src.unitSymbol}
                                            </span>
                                          )}
                                        </span>
                                      </td>
                                      <td className="px-3 py-1.5 hidden lg:table-cell" />
                                      <td className="px-3 py-1.5 text-right">
                                        <span className="font-medium text-zinc-700 tabular-nums">
                                          {fmt(src.tco2e)}
                                        </span>
                                      </td>
                                      <td className="px-4 py-1.5 text-right">
                                        <span className="text-zinc-400 tabular-nums">
                                          {totalTco2e > 0
                                            ? (
                                                (src.tco2e / totalTco2e) *
                                                100
                                              ).toFixed(1)
                                            : "0"}
                                          %
                                        </span>
                                      </td>
                                    </tr>

                                    {/* ── Nivel 4: Gas / Factor ── */}
                                    {!srcCollapsed &&
                                      src.factors.map((f, fIdx) => {
                                        const isLastFactor =
                                          fIdx === src.factors.length - 1;
                                        return (
                                          <tr
                                            key={`${srcKey}:${f.factorId}`}
                                            className={`bg-white/70 hover:bg-zinc-50/60 transition-colors ${
                                              isLastFactor && isLastSource
                                                ? "border-b-2 border-zinc-200"
                                                : "border-b border-zinc-50"
                                            }`}
                                            style={{
                                              borderLeft: `4px solid ${color}`,
                                            }}
                                          >
                                            <td className="px-5 py-1.5 pl-20">
                                              <div className="flex items-center gap-1.5">
                                                <FlaskConical
                                                  size={10}
                                                  className="text-violet-400 shrink-0"
                                                />
                                                <span className="text-zinc-500">
                                                  {f.gasName}
                                                </span>
                                                {f.formula && (
                                                  <span className="font-mono text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded text-[10px] leading-none">
                                                    {f.formula}
                                                  </span>
                                                )}
                                              </div>
                                            </td>
                                            <td className="px-3 py-1.5 hidden lg:table-cell" />
                                            <td className="px-3 py-1.5 text-right font-mono hidden lg:table-cell">
                                              <span className="text-zinc-500 tabular-nums">
                                                {fmt(f.gasTonnes)}
                                              </span>
                                              <span className="text-zinc-300 ml-0.5">
                                                t
                                              </span>
                                            </td>
                                            <td className="px-3 py-1.5 text-right">
                                              <span className="font-semibold text-violet-700 tabular-nums">
                                                {fmt(f.tco2e)}
                                              </span>
                                            </td>
                                            <td className="px-4 py-1.5 text-right">
                                              <span className="text-zinc-400 tabular-nums">
                                                {totalTco2e > 0
                                                  ? (
                                                      (f.tco2e / totalTco2e) *
                                                      100
                                                    ).toFixed(1)
                                                  : "0"}
                                                %
                                              </span>
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
                  </Fragment>
                );
              })}
            </tbody>

            <tfoot>
              <tr className="bg-zinc-50 border-t-2 border-zinc-200">
                <td className="px-5 py-3">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider">
                    {isFiltered ? "Subtotal filtrado" : "Total general"}
                  </span>
                  <span className="ml-2 text-zinc-400">
                    {filteredTotalRecords.toLocaleString("es-CO")} reg.
                  </span>
                </td>
                <td className="px-3 py-3 hidden lg:table-cell" />
                <td className="px-3 py-3 hidden lg:table-cell" />
                <td className="px-3 py-3 text-right">
                  <span className="text-sm font-black text-zinc-900 tabular-nums">
                    {fmt(filteredTotalTco2e)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm font-bold text-zinc-700">
                    {isFiltered
                      ? `${totalTco2e > 0 ? ((filteredTotalTco2e / totalTco2e) * 100).toFixed(1) : "0"}%`
                      : "100%"}
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
