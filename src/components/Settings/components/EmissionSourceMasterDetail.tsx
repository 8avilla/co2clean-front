"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import {
  Plus,
  Search,
  Loader2,
  Trash2,
  Copy,
  Edit2,
  SlidersHorizontal,
  ChevronDown,
  X,
  Layers,
} from "lucide-react";

import { toast } from "sonner";
import {
  EmissionSource,
  EmissionSourceCategory,
  EmissionFactor,
  FactorChanges,
} from "../types";
import { EmissionSourceCategoryService } from "@/shared/services/emission-source-category.service";
import {
  EmissionSourceService,
  EmissionFactorService,
} from "@/shared/services/emission-source.service";
import { EmissionSourceFormModal } from "./EmissionSourceFormModal";
import { CommercialUnitsDrawer } from "./CommercialUnitsDrawer";
import { getCategoryIcon } from "../constants/category-icons";
import { SortableHeader } from "@/shared/components/Common/SortableHeader";
import { DeletionImpactService } from "@/shared/services/deletion-impact.service";
import { confirmDeleteWithImpact } from "@/shared/lib/confirm-delete-with-impact";
import { nextSortState, type SortDirection } from "@/shared/lib/list-utils";
import { formatNumber } from "@/shared/lib/format";
import {
  SourceSortKey,
  SourceStatusFilter,
  countInactiveSources,
  matchesSourceSearch,
  matchesSourceStatus,
  sortSources,
} from "../utils/source-list.utils";
import {
  buildPlainDeletionHtml,
  buildSourceDeletionWarningHtml,
} from "../utils/deletion-warning";
import { PageHeader } from "@/shared/components/Common/PageHeader";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { DataTable } from "@/shared/components/Common/DataTable";
import { buttonClass } from "@/shared/components/Common/button-styles";

export const EmissionSourceMasterDetail = () => {
  const [categories, setCategories] = useState<EmissionSourceCategory[]>([]);
  const [sources, setSources] = useState<EmissionSource[]>([]);
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<SourceStatusFilter>("all");
  const [sortKey, setSortKey] = useState<SourceSortKey>("category");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedSourceIds, setExpandedSourceIds] = useState<Set<string>>(
    new Set(),
  );

  // Source modal
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<
    EmissionSource | undefined
  >(undefined);
  const [defaultCategoryForSource, setDefaultCategoryForSource] = useState<
    string | undefined
  >(undefined);

  // Commercial units drawer
  const [commercialUnitsSource, setCommercialUnitsSource] = useState<
    EmissionSource | undefined
  >(undefined);

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
      toast.error("Error al cargar las fuentes de emisión");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

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

  const factorsForSource = (sourceId: string) =>
    factorsBySource.get(sourceId) ?? [];

  const inactiveCount = useMemo(() => countInactiveSources(sources), [sources]);

  const incompleteCount = useMemo(
    () => sources.filter((s) => (factorCountMap.get(s.id) ?? 0) === 0).length,
    [sources, factorCountMap],
  );

  const categoryById = useMemo(() => {
    const map = new Map<string, EmissionSourceCategory>();
    for (const c of categories) map.set(c.id, c);
    return map;
  }, [categories]);

  const filteredSources = useMemo(() => {
    const matching = sources.filter((source) => {
      if (categoryFilter && source.category_id !== categoryFilter) return false;
      if (showIncompleteOnly && (factorCountMap.get(source.id) ?? 0) > 0)
        return false;
      if (!matchesSourceStatus(source, statusFilter)) return false;
      return matchesSourceSearch(
        source,
        categoryById.get(source.category_id),
        search,
      );
    });
    return sortSources(
      matching,
      sortKey,
      sortDirection,
      (categoryId) => categoryById.get(categoryId)?.name ?? "",
      (sourceId) => factorCountMap.get(sourceId) ?? 0,
    );
  }, [
    sources,
    categoryById,
    search,
    categoryFilter,
    statusFilter,
    showIncompleteOnly,
    factorCountMap,
    sortKey,
    sortDirection,
  ]);

  const handleSort = (key: SourceSortKey) => {
    const next = nextSortState({ key: sortKey, direction: sortDirection }, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
  };

  const toggleExpand = (id: string) => {
    setExpandedSourceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Modal handlers ────────────────────────────────────────────────────────

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

  // ── Source CRUD ────────────────────────────────────────────────────────────

  const handleDuplicateSource = async (s: EmissionSource) => {
    try {
      const created = await EmissionSourceService.createSource({
        ...s,
        name: `Copia de ${s.name}`,
        code: `${s.code}_COPY`,
      });
      setSources((prev) => [...prev, created]);
      toast.success("Fuente de emisión duplicada exitosamente");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error al duplicar la fuente",
      );
    }
  };

  const handleSaveSource = async (
    data: Omit<EmissionSource, "id"> & { id?: string },
    factorChanges: FactorChanges,
  ) => {
    try {
      let savedSource: EmissionSource;
      if (data.id) {
        savedSource = await EmissionSourceService.updateSource(data.id, data);
        setSources((prev) =>
          prev.map((s) => (s.id === savedSource.id ? savedSource : s)),
        );
      } else {
        savedSource = await EmissionSourceService.createSource(data);
        setSources((prev) => [...prev, savedSource]);
      }

      const { toCreate, toUpdate, toDelete } = factorChanges;
      await Promise.all([
        ...toCreate.map((f) =>
          EmissionFactorService.createFactor({
            ...f,
            emission_source_id: savedSource.id,
            emission_source_category_id: savedSource.category_id,
          }),
        ),
        ...toUpdate.map((f) => EmissionFactorService.updateFactor(f.id, f)),
        ...toDelete.map((id) => EmissionFactorService.deleteFactor(id)),
      ]);

      // Refresh all factors
      const refreshed = await EmissionFactorService.getFactors();
      setFactors(refreshed);

      toast.success(
        data.id
          ? "Fuente de emisión actualizada exitosamente"
          : "Fuente de emisión creada exitosamente",
      );
      setSourceModalOpen(false);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al guardar la fuente de emisión",
      );
    }
  };

  const handleDeleteSource = async (s: EmissionSource) => {
    const confirmed = await confirmDeleteWithImpact({
      title: "¿Eliminar esta fuente de emisión?",
      loadImpact: () => DeletionImpactService.forEmissionSource(s.id),
      buildHtml: (impact) => buildSourceDeletionWarningHtml(s.name, impact),
      fallbackHtml: buildPlainDeletionHtml("la fuente", s.name),
    });
    if (!confirmed) return;
    try {
      await EmissionSourceService.deleteSource(s.id);
      setSources((prev) => prev.filter((src) => src.id !== s.id));
      setFactors((prev) => prev.filter((f) => f.emission_source_id !== s.id));
      toast.success("Fuente de emisión eliminada exitosamente");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar la fuente",
      );
    }
  };

  return (
    <>
      <div className="space-y-4">
        {/* Page header */}
        <PageHeader
          title="Fuentes de Emisión"
          description="Gestiona los tipos de fuente y sus fuentes de emisión con factores de cálculo."
          actions={
            <>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleOpenCreateSource()}
                  className={buttonClass()}
                >
                  <Plus size={15} />
                  Nueva fuente
                </button>
              </div>
            </>
          }
        />

        {/* Filters bar */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-3 flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar tipo de fuente o fuente..."
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700 sm:w-56"
          >
            <option value="">Todos los tipos de fuente</option>
            {categories
              .slice()
              .sort((a, b) => a.name.localeCompare(b.name, "es"))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as SourceStatusFilter)
            }
            aria-label="Estado de la fuente"
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700 sm:w-40"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activas</option>
            <option value="inactive">
              Inactivas{inactiveCount > 0 ? ` (${inactiveCount})` : ""}
            </option>
          </select>

          {incompleteCount > 0 && (
            <button
              onClick={() => setShowIncompleteOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors whitespace-nowrap ${
                showIncompleteOnly
                  ? "bg-red-50 text-red-600 border-red-200"
                  : "text-zinc-500 border-zinc-200 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
              }`}
            >
              Sin factores
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black ${
                  showIncompleteOnly
                    ? "bg-red-200 text-red-700"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {incompleteCount}
              </span>
            </button>
          )}

          <span className="text-xs text-zinc-400 ml-auto hidden md:inline-block">
            {filteredSources.length !== sources.length
              ? `${filteredSources.length} de ${sources.length} fuentes`
              : `${sources.length} ${sources.length === 1 ? "fuente" : "fuentes"}`}
          </span>
        </div>

        {/* Flat table */}
        <DataTable
          isLoading={isLoading}
          loadingText="Cargando datos..."
          isEmpty={filteredSources.length === 0}
          emptyIcon={SlidersHorizontal}
          emptyTitle="Sin resultados"
          emptyDescription={
            search || categoryFilter || showIncompleteOnly
              ? "Prueba con otros filtros"
              : "Agrega la primera fuente de emisión"
          }
          emptyAction={
            (search ||
              categoryFilter ||
              showIncompleteOnly ||
              statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("");
                  setShowIncompleteOnly(false);
                  setStatusFilter("all");
                }}
                className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                Limpiar filtros
              </button>
            )
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="w-8 px-3 py-3" />
                  <SortableHeader
                    label="Tipo de fuente"
                    sortKey="category"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="px-4 py-3 text-left"
                  />
                  <SortableHeader
                    label="Fuente de emisión"
                    sortKey="name"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="px-4 py-3 text-left"
                  />
                  <SortableHeader
                    label="Factores"
                    sortKey="factors"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="px-4 py-3 text-center"
                  />
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredSources.map((src) => {
                  const cat = categoryById.get(src.category_id);
                  const isExpanded = expandedSourceIds.has(src.id);
                  const srcFactors = factorsForSource(src.id);
                  const hasNoFactors = srcFactors.length === 0;

                  return (
                    <Fragment key={src.id}>
                      {/* ── Source row ── */}
                      <tr
                        onClick={() => handleOpenEditSource(src)}
                        className="cursor-pointer hover:bg-zinc-50/70 transition-colors group/src"
                      >
                        {/* Expand toggle */}
                        <td
                          className="px-3 py-3 text-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => toggleExpand(src.id)}
                            className="p-1 text-zinc-300 hover:text-zinc-500 rounded transition-colors"
                            title={
                              isExpanded
                                ? "Colapsar factores"
                                : "Ver factores de emisión"
                            }
                            aria-label={`${isExpanded ? "Colapsar" : "Ver"} factores de ${src.name}`}
                            aria-expanded={isExpanded}
                          >
                            <ChevronDown
                              size={14}
                              className={`transition-transform duration-200 ${isExpanded ? "" : "-rotate-90"}`}
                            />
                          </button>
                        </td>

                        {/* Source type */}
                        <td className="px-4 py-3">
                          {cat ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-7 h-7 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center flex-shrink-0">
                                {(() => {
                                  const Icon = getCategoryIcon(cat.icon);
                                  return (
                                    <Icon
                                      size={12}
                                      className="text-violet-600"
                                    />
                                  );
                                })()}
                              </div>
                              <div className="min-w-0">
                                <span
                                  className="font-medium text-zinc-700 block truncate text-xs"
                                  title={cat.name}
                                >
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
                              <span
                                className="font-semibold text-zinc-800 block truncate"
                                title={src.name}
                              >
                                {src.name}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                {!src.is_active && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Inactiva
                                  </span>
                                )}
                                {src.code && (
                                  <span className="font-mono text-[10px] text-zinc-400">
                                    {src.code}
                                  </span>
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
                              {srcFactors.length}{" "}
                              {srcFactors.length === 1 ? "factor" : "factores"}
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td
                          className="px-4 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1 ">
                            <button
                              onClick={() => handleOpenEditSource(src)}
                              className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                              title="Editar fuente"
                              aria-label={`Editar ${src.name}`}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteSource(src)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200"
                              title="Eliminar fuente"
                              aria-label={`Eliminar ${src.name}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ── Expanded: emission factors ── */}
                      {isExpanded && (
                        <tr className="bg-zinc-50/50">
                          <td colSpan={5} className="px-6 py-3 pl-16">
                            <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-sm">
                              {srcFactors.length > 0 ? (
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-zinc-50 border-b border-zinc-200">
                                      <th className="px-4 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        Gas
                                      </th>
                                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        Factor
                                      </th>
                                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        Unidad masa
                                      </th>
                                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        Coeficiente
                                      </th>
                                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        GWP
                                      </th>
                                      <th className="px-4 py-2 text-right text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                        U. actividad
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-100">
                                    {srcFactors.map((f) => (
                                      <tr
                                        key={f.id}
                                        className="hover:bg-zinc-50/80 transition-colors"
                                      >
                                        <td className="px-4 py-2.5 font-mono font-semibold text-zinc-700">
                                          {f.gas_formula ?? f.gas_id}
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-zinc-800 tabular-nums">
                                          {formatNumber(f.factor)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                          <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-mono font-bold text-[10px]">
                                            {f.factor_mass_unit ?? "kg"}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right tabular-nums">
                                          {f.coefficient !== undefined &&
                                          f.coefficient !== 1 ? (
                                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-mono font-bold text-[10px] border border-amber-200">
                                              ×{formatNumber(f.coefficient)}
                                            </span>
                                          ) : (
                                            <span className="text-zinc-300 text-[10px]">
                                              ×1
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-zinc-500 tabular-nums">
                                          {formatNumber(f.gwp)}
                                        </td>
                                        <td className="px-4 py-2.5 text-right">
                                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-700 font-mono font-bold text-[10px]">
                                            {f.emission_unit_symbol ??
                                              f.emission_unit_id}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-xs text-zinc-400 py-3 text-center">
                                  Sin factores configurados — edita la fuente
                                  para agregarlos.
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
        </DataTable>
      </div>

      {/* Modals */}
      {sourceModalOpen && (
        <EmissionSourceFormModal
          source={editingSource}
          defaultCategory={defaultCategoryForSource}
          onSave={handleSaveSource}
          onClose={() => setSourceModalOpen(false)}
          onDuplicate={
            editingSource
              ? async () => {
                  setSourceModalOpen(false);
                  await handleDuplicateSource(editingSource);
                }
              : undefined
          }
          onManageCommercialUnits={
            editingSource
              ? () => setCommercialUnitsSource(editingSource)
              : undefined
          }
        />
      )}

      {commercialUnitsSource && (
        <CommercialUnitsDrawer
          source={commercialUnitsSource}
          onClose={() => setCommercialUnitsSource(undefined)}
        />
      )}
    </>
  );
};
