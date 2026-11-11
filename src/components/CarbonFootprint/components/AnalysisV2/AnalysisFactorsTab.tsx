"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";
import {
  ApiEmissionFactor,
  FACTOR_MASS_UNIT_TO_KG,
  FactorMassUnit,
} from "../../types";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { matchesSearchTerms } from "@/shared/lib/list-utils";
import { formatNumber } from "@/shared/lib/format";
import { buttonClass } from "@/shared/components/Common/button-styles";
import {
  FORM_LABEL_CLASS,
  formInputClass,
} from "@/shared/components/Common/form-styles";

interface AnalysisFactorsTabProps {
  factors: ApiEmissionFactor[];
}

// Same significant digits for every factor so columns scan evenly; the exact value stays in the tooltip
function fmtFactor(value: number): string {
  return formatNumber(value, 4);
}

function fmtUncertainty(value: number): string {
  return `${value.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

const pluralFactors = (count: number): string =>
  `${count} ${count === 1 ? "factor" : "factores"}`;

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
      gasName: variants[0].gas?.chemicalName ?? "Gas desconocido",
      formula: variants[0].gas?.formula ?? "",
      gwp: variants[0].gwp,
      variants,
    }))
    .sort((a, b) => {
      const impact = (g: GasGroup) =>
        g.variants.reduce((s, f) => {
          const massKg =
            FACTOR_MASS_UNIT_TO_KG[
              (f.factorMassUnit ?? "kg") as FactorMassUnit
            ] ?? 1;
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
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  // Collapsed sets — empty means all expanded
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(
    new Set(),
  );

  const toggleCategory = useCallback(
    (id: string) => setCollapsedCategories((prev) => toggle(prev, id)),
    [],
  );
  const toggleSource = useCallback(
    (key: string) => setCollapsedSources((prev) => toggle(prev, key)),
    [],
  );

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of factors) {
      if (f.emissionSourceCategoryId && f.emissionSourceCategory?.name) {
        map.set(f.emissionSourceCategoryId, f.emissionSourceCategory.name);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
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
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [factors, categoryFilter]);

  const filteredFactors = useMemo(() => {
    return factors.filter((f) => {
      const matchesSearch = matchesSearchTerms(
        search,
        f.gas?.chemicalName,
        f.gas?.formula,
        f.emissionSource?.name,
        f.emissionSourceCategory?.name,
      );
      if (!matchesSearch) return false;
      if (categoryFilter && f.emissionSourceCategoryId !== categoryFilter)
        return false;
      if (sourceFilter && f.emissionSourceId !== sourceFilter) return false;
      return true;
    });
  }, [factors, search, categoryFilter, sourceFilter]);

  // Group by category → source
  const grouped = useMemo<CategoryGroup[]>(() => {
    const catMap = new Map<
      string,
      {
        categoryName: string;
        sourceMap: Map<
          string,
          { sourceName: string; factors: ApiEmissionFactor[] }
        >;
      }
    >();

    for (const f of filteredFactors) {
      const catId = f.emissionSourceCategoryId ?? "sin-categoria";
      const catName = f.emissionSourceCategory?.name ?? "Sin tipo de fuente";
      const srcId = f.emissionSourceId ?? "sin-fuente";
      const srcName = f.emissionSource?.name ?? "Sin fuente";

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
          .sort((a, b) => a.sourceName.localeCompare(b.sourceName, "es")),
      }))
      .sort((a, b) => a.categoryName.localeCompare(b.categoryName, "es"));
  }, [filteredFactors]);

  // Collect all keys for expand/collapse all
  const allKeys = useMemo(() => {
    const catIds: string[] = [];
    const srcKeys: string[] = [];
    grouped.forEach((g) => {
      catIds.push(g.categoryId);
      g.sources.forEach((s) => srcKeys.push(`${g.categoryId}:${s.sourceId}`));
    });
    return { catIds, srcKeys };
  }, [grouped]);

  const isAllCollapsed = allKeys.catIds.every((id) =>
    collapsedCategories.has(id),
  );

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

  const selectClass = `${formInputClass("teal")} min-w-[200px]`;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-4 items-end">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar gas, fuente o tipo de fuente..."
          accent="teal"
          className="flex-1 min-w-[220px] max-w-sm"
        />

        {uniqueCategories.length > 0 && (
          <div className="space-y-1">
            <label
              htmlFor="factors-category-filter"
              className={FORM_LABEL_CLASS}
            >
              Tipo de fuente
            </label>
            <select
              id="factors-category-filter"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setSourceFilter("");
              }}
              className={selectClass}
            >
              <option value="">Todos</option>
              {uniqueCategories.map((c) => (
                <option key={c.id} value={c.id} title={c.name}>
                  {c.name.length > 30
                    ? `${c.name.substring(0, 27)}...`
                    : c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {uniqueSources.length > 0 && (
          <div className="space-y-1">
            <label htmlFor="factors-source-filter" className={FORM_LABEL_CLASS}>
              Fuente de emisión
            </label>
            <select
              id="factors-source-filter"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className={selectClass}
            >
              <option value="">Todas</option>
              {uniqueSources.map((s) => (
                <option key={s.id} value={s.id} title={s.name}>
                  {s.name.length > 30
                    ? `${s.name.substring(0, 27)}...`
                    : s.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={isAllCollapsed ? expandAll : collapseAll}
          className={`${buttonClass({ variant: "secondary" })} ml-auto`}
        >
          <ChevronsUpDown size={14} />
          {isAllCollapsed ? "Expandir todo" : "Colapsar todo"}
        </button>
      </div>

      {filteredFactors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-100 p-10 text-center text-zinc-500 text-sm">
          No hay factores que coincidan con la búsqueda
        </div>
      ) : (
        grouped.map((group) => {
          const catCollapsed = collapsedCategories.has(group.categoryId);
          const totalFactors = group.sources.reduce(
            (sum, src) => sum + src.factors.length,
            0,
          );

          return (
            <section key={group.categoryId} className="space-y-3">
              {/* ── Level 1: source type (section heading) ── */}
              <button
                type="button"
                className="w-full flex items-center gap-2 text-left"
                aria-expanded={!catCollapsed}
                onClick={() => toggleCategory(group.categoryId)}
              >
                {catCollapsed ? (
                  <ChevronRight size={16} className="text-zinc-500 shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-zinc-500 shrink-0" />
                )}
                <h3 className="text-base font-bold text-zinc-900">
                  {group.categoryName}
                </h3>
                <span className="text-xs font-semibold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded-full">
                  {group.sources.length}{" "}
                  {group.sources.length === 1 ? "fuente" : "fuentes"} ·{" "}
                  {pluralFactors(totalFactors)}
                </span>
              </button>

              {/* ── Level 2: one card per emission source ── */}
              {!catCollapsed &&
                group.sources.map((src) => {
                  const srcKey = `${group.categoryId}:${src.sourceId}`;
                  const srcCollapsed = collapsedSources.has(srcKey);

                  return (
                    <div
                      key={srcKey}
                      className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden"
                    >
                      <button
                        type="button"
                        className="w-full px-5 py-3.5 flex items-center justify-between gap-3 text-left hover:bg-zinc-50 transition-colors"
                        aria-expanded={!srcCollapsed}
                        onClick={() => toggleSource(srcKey)}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          {srcCollapsed ? (
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
                          <span className="text-sm font-semibold text-zinc-900 truncate">
                            {src.sourceName}
                          </span>
                        </span>
                        <span className="text-xs text-zinc-500 shrink-0">
                          {pluralFactors(src.factors.length)}
                        </span>
                      </button>

                      {/* ── Level 3: factors table ── */}
                      {!srcCollapsed && (
                        <div className="overflow-x-auto border-t border-zinc-100">
                          <table className="w-full max-w-4xl text-sm">
                            <thead>
                              <tr className="bg-zinc-50/70 text-xs font-semibold text-zinc-500">
                                <th className="px-5 py-2.5 text-left">Gas</th>
                                <th className="px-4 py-2.5 text-right">GWP</th>
                                <th className="px-4 py-2.5 text-right">
                                  Factor
                                </th>
                                <th className="px-4 py-2.5 text-left">
                                  Unidad
                                </th>
                                <th className="px-4 py-2.5 text-right hidden sm:table-cell">
                                  Incertidumbre
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {groupFactorsByGas(src.factors).map(
                                (gasGroup) => {
                                  const hasVariants =
                                    gasGroup.variants.length > 1;
                                  const stackClass = `flex flex-col ${hasVariants ? "gap-1.5" : ""}`;
                                  return (
                                    <tr
                                      key={gasGroup.gasId}
                                      className="hover:bg-zinc-50/60 transition-colors"
                                    >
                                      <td className="px-5 py-3">
                                        <div className="flex items-center gap-2">
                                          <span className="text-zinc-900 font-medium">
                                            {gasGroup.gasName}
                                          </span>
                                          {gasGroup.formula && (
                                            <span className="font-mono text-xs text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded">
                                              {gasGroup.formula}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-700">
                                        {formatNumber(gasGroup.gwp)}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                                        <div className={stackClass}>
                                          {gasGroup.variants.map((f) => (
                                            <span
                                              key={f.id}
                                              className="text-zinc-900 font-semibold"
                                              title={`Valor exacto: ${f.factor}`}
                                            >
                                              {fmtFactor(f.factor)}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className={stackClass}>
                                          {gasGroup.variants.map((f) => {
                                            const massUnit =
                                              (f.factorMassUnit ??
                                                "kg") as FactorMassUnit;
                                            const actSymbol =
                                              f.emissionUnit?.symbol;
                                            const unitLabel = actSymbol
                                              ? `${massUnit}/${actSymbol}`
                                              : massUnit;
                                            const unitTitle =
                                              actSymbol && f.emissionUnit?.name
                                                ? `${massUnit} por ${f.emissionUnit.name}`
                                                : massUnit;
                                            return (
                                              <span
                                                key={f.id}
                                                className="font-mono text-xs text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded w-fit"
                                                title={unitTitle}
                                              >
                                                {unitLabel}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right tabular-nums hidden sm:table-cell">
                                        <div
                                          className={`${stackClass} items-end`}
                                        >
                                          {gasGroup.variants.map((f) => (
                                            <span
                                              key={f.id}
                                              className={
                                                f.uncertainty != null
                                                  ? "text-zinc-600"
                                                  : "text-zinc-400"
                                              }
                                            >
                                              {f.uncertainty != null
                                                ? fmtUncertainty(f.uncertainty)
                                                : "—"}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                },
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
            </section>
          );
        })
      )}
    </div>
  );
};
