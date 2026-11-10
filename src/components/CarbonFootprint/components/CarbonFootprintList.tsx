"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Leaf,
  SlidersHorizontal,
  X,
  RefreshCw,
} from "lucide-react";
import { ApiCarbonFootprint } from "../types";
import { CarbonFootprintService } from "../services/carbonFootprint.service";
import { EmissionSubsourcesService } from "../services/catalogs.service";
import { CompanyService } from "../../Companies/services/company.service";
import { toast } from "sonner";
import { usePermission } from "@/shared/hooks/usePermission";
import { PermissionCode } from "@/shared/constants/permissions";
import { confirmDelete } from "@/shared/lib/confirm-dialog";
import { escapeHtml, pluralize } from "@/shared/lib/html";
import { getStoredUser } from "@/shared/lib/session";
import { nextSortState, type SortDirection } from "@/shared/lib/list-utils";
import { PageHeader } from "@/shared/components/Common/PageHeader";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { SortableHeader } from "@/shared/components/Common/SortableHeader";
import { Pagination } from "@/shared/components/Common/Pagination";
import { RowActions } from "@/shared/components/Common/RowActions";
import {
  DisplayRow,
  RecordSortKey,
  buildDisplayRows,
  matchesRecordSearch,
  shortGroupName,
  sortRows,
} from "../utils/record-list.utils";

import {
  FORM_LABEL_CLASS,
  formInputClass,
} from "@/shared/components/Common/form-styles";
import { buttonClass } from '@/shared/components/Common/button-styles';
const PAGE_SIZE = 10;

const LoadModeBadge = ({ mode }: { mode: string }) => (
  <span
    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
      mode === "Monthly"
        ? "bg-sky-50 text-sky-700 border border-sky-200"
        : "bg-amber-50 text-amber-700 border border-amber-200"
    }`}
  >
    {mode === "Monthly" ? "Mensual" : "Anual"}
  </span>
);

interface RecordEmptyStateProps {
  hasActiveSearch: boolean;
  canCreate: boolean;
  onClear: () => void;
}

const RecordEmptyState = ({
  hasActiveSearch,
  canCreate,
  onClear,
}: RecordEmptyStateProps) => (
  <div className="px-5 py-12 flex flex-col items-center gap-3">
    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
      <Leaf className="text-emerald-500" size={24} />
    </div>
    <div className="space-y-1 text-center">
      <h3 className="font-semibold text-zinc-900">
        {hasActiveSearch ? "Sin resultados" : "Sin registros de actividades"}
      </h3>
      <p className="text-zinc-500 text-sm">
        {hasActiveSearch
          ? "No hay registros que coincidan con los filtros aplicados."
          : "Comienza registrando la primera actividad de tu empresa."}
      </p>
    </div>
    {hasActiveSearch ? (
      <button
        onClick={onClear}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        <X size={15} />
        Limpiar filtros
      </button>
    ) : (
      canCreate && (
        <Link
          href="/huella-carbono/nueva"
          className={buttonClass()}
        >
          <Plus size={16} />
          Registrar primera actividad
        </Link>
      )
    )}
  </div>
);

const TABLE_HEADER_CLASS =
  "px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap text-left normal-case tracking-normal text-sm";

export const CarbonFootprintRegistrationList = () => {
  const { hasPermission } = usePermission();
  const [activeCompany] = useState(() => getStoredUser()?.company ?? null);

  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [recordsMap, setRecordsMap] = useState<Map<string, ApiCarbonFootprint>>(
    new Map(),
  );
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnio, setFilterAnio] = useState("");
  const [filterSede, setFilterSede] = useState("");
  const [filterFuente, setFilterFuente] = useState("");
  const [filterAlcance, setFilterAlcance] = useState("");
  const [sortKey, setSortKey] = useState<RecordSortKey>("anio");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);

  const canCreate = hasPermission(PermissionCode.CREATE_CARBON_FOOTPRINT);
  const canDelete = hasPermission(PermissionCode.DELETE_CARBON_FOOTPRINT);

  const loadData = useCallback(async () => {
    if (!activeCompany) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setHasLoadError(false);
    try {
      const [records, hq] = await Promise.all([
        CarbonFootprintService.fetchAll({ companyId: activeCompany.id }),
        CompanyService.getHeadquarters(activeCompany.id),
      ]);
      const hqMap = new Map(hq.map((h) => [h.id, h.name]));

      // Fetch commercial units for each distinct subsource to display correct unit names
      const subsourceIds = [
        ...new Set(records.map((r) => r.emissionSubsourceId).filter(Boolean)),
      ] as string[];
      const commercialUnitResults = await Promise.allSettled(
        subsourceIds.map((id) =>
          EmissionSubsourcesService.getSourceUnits(id).then((units) => ({
            id,
            units,
          })),
        ),
      );
      // Two keys per commercial unit: by emissionUnitId (if present) and by baseUnitSymbol
      const commercialUnitMap = new Map<string, string>();
      for (const result of commercialUnitResults) {
        if (result.status === "fulfilled") {
          for (const unit of result.value.units) {
            if (unit.emissionUnitId) {
              commercialUnitMap.set(
                `${result.value.id}:id:${unit.emissionUnitId}`,
                unit.displayName,
              );
            }
            commercialUnitMap.set(
              `${result.value.id}:sym:${unit.baseUnitSymbol}`,
              unit.displayName,
            );
          }
        }
      }

      setRows(buildDisplayRows(records, hqMap, commercialUnitMap));
      setRecordsMap(new Map(records.map((r) => [r.id, r])));
    } catch {
      setHasLoadError(true);
      toast.error("Error al cargar los registros");
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // The edit screen reads the record from sessionStorage to avoid refetching it
  const handleEditClick = (id: string) => {
    const record = recordsMap.get(id);
    if (record && typeof window !== "undefined") {
      sessionStorage.setItem(`cf-edit-${id}`, JSON.stringify(record));
    }
  };

  const handleDelete = async (row: DisplayRow) => {
    const confirmed = await confirmDelete({
      title: "¿Eliminar este registro?",
      html: `<p>Vas a eliminar el registro de <b>${escapeHtml(row.item ?? row.fuenteNombre)}</b> de la sede <b>${escapeHtml(row.sedeNombre)}</b> (${row.anio}).</p><p>Esta acción no se puede deshacer.</p>`,
    });
    if (!confirmed) return;

    try {
      await CarbonFootprintService.deleteCarbonFootprint(row.id);
      toast.success("Registro eliminado exitosamente");
      loadData();
    } catch {
      toast.error("Error al eliminar el registro");
    }
  };

  // Unique values for filter dropdowns
  const uniqueAnios = [...new Set(rows.map((r) => String(r.anio)))]
    .sort()
    .reverse();
  const uniqueSedes = [...new Set(rows.map((r) => r.sedeNombre))].sort();
  const uniqueFuentes = [
    ...new Set(rows.map((r) => r.fuenteNombre).filter((v) => v !== "-")),
  ].sort();
  const uniqueAlcances = [
    ...new Set(rows.map((r) => r.alcanceNombre).filter((v) => v !== "-")),
  ].sort();

  // Header summary
  const totalAnios = new Set(rows.map((r) => r.anio)).size;
  const totalSedes = new Set(rows.map((r) => r.sedeNombre)).size;

  const activeFiltersCount = [
    filterAnio,
    filterSede,
    filterFuente,
    filterAlcance,
  ].filter(Boolean).length;
  const hasActiveSearch = !!searchTerm || activeFiltersCount > 0;

  const clearFilters = () => {
    setFilterAnio("");
    setFilterSede("");
    setFilterFuente("");
    setFilterAlcance("");
    setSearchTerm("");
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleSort = (key: RecordSortKey) => {
    const next = nextSortState({ key: sortKey, direction: sortDirection }, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  };

  const filteredRows = useMemo(
    () =>
      sortRows(
        rows.filter(
          (row) =>
            matchesRecordSearch(row, searchTerm) &&
            (!filterAnio || String(row.anio) === filterAnio) &&
            (!filterSede || row.sedeNombre === filterSede) &&
            (!filterFuente || row.fuenteNombre === filterFuente) &&
            (!filterAlcance || row.alcanceNombre === filterAlcance),
        ),
        sortKey,
        sortDirection,
      ),
    [
      rows,
      searchTerm,
      filterAnio,
      filterSede,
      filterFuente,
      filterAlcance,
      sortKey,
      sortDirection,
    ],
  );

  const handleDeleteByFilters = async () => {
    if (!activeCompany || activeFiltersCount === 0) {
      toast.error(
        "Por favor, aplique al menos un filtro para eliminar registros.",
      );
      return;
    }

    const headquarterId = filterSede
      ? rows.find((r) => r.sedeNombre === filterSede)?.sedeId
      : undefined;
    const emissionGroupId = filterAlcance
      ? rows.find((r) => r.alcanceNombre === filterAlcance)?.alcanceId
      : undefined;
    const emissionSourceCategoryId = filterFuente
      ? rows.find((r) => r.fuenteNombre === filterFuente)?.fuenteId
      : undefined;

    const filterDescriptions: string[] = [];
    if (filterAnio)
      filterDescriptions.push(`Año: <b>${escapeHtml(filterAnio)}</b>`);
    if (filterSede)
      filterDescriptions.push(`Sede: <b>${escapeHtml(filterSede)}</b>`);
    if (filterFuente)
      filterDescriptions.push(
        `Tipo de fuente: <b>${escapeHtml(filterFuente)}</b>`,
      );
    if (filterAlcance)
      filterDescriptions.push(`Grupo: <b>${escapeHtml(filterAlcance)}</b>`);

    const confirmed = await confirmDelete({
      title: "¿Eliminar registros filtrados?",
      html: `Se eliminarán permanentemente ${pluralize(filteredRows.length, "registro", "registros")} que coinciden con:<br/><br/>${filterDescriptions.join(", ")}<br/><br/>Esta acción no se puede deshacer.`,
      confirmText: "Sí, eliminar todos",
    });

    if (!confirmed) return;

    setLoading(true);
    try {
      await CarbonFootprintService.deleteByFilters({
        companyId: activeCompany.id,
        year: filterAnio ? parseInt(filterAnio, 10) : undefined,
        headquarterId,
        emissionGroupId,
        emissionSourceCategoryId,
      });
      toast.success("Registros filtrados eliminados exitosamente");
      clearFilters();
      loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar los registros",
      );
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const emptyState = (
    <RecordEmptyState
      hasActiveSearch={hasActiveSearch}
      canCreate={canCreate}
      onClear={clearFilters}
    />
  );

  const sortHeader = (label: string, key: RecordSortKey, extraClass = "") => (
    <SortableHeader
      label={label}
      sortKey={key}
      activeKey={sortKey}
      direction={sortDirection}
      onSort={handleSort}
      className={`${TABLE_HEADER_CLASS} ${extraClass}`}
    />
  );

  return (
    <div className="space-y-6 w-full">
      <PageHeader
        title="Actividades"
        description={
          !loading && rows.length > 0
            ? `${pluralize(rows.length, "registro", "registros")} · ${pluralize(totalAnios, "año", "años")} · ${pluralize(totalSedes, "sede", "sedes")}`
            : "Administra los datos de actividades de las empresas."
        }
        actions={
          canCreate && (
            <Link
              href="/huella-carbono/nueva"
              className={buttonClass()}
            >
              <Plus size={18} />
              Registrar actividad
            </Link>
          )
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
            <SearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por sede, tipo de fuente, ítem o año..."
              accent="emerald"
              className="w-full sm:w-96"
            />

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowFilters((v) => !v)}
                aria-expanded={showFilters}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${
                  showFilters || activeFiltersCount > 0
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                <SlidersHorizontal size={16} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-white text-emerald-700 rounded-full text-xs font-black">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 border border-zinc-200 transition-colors"
                  title="Limpiar filtros"
                  aria-label="Limpiar filtros"
                >
                  <X size={16} />
                </button>
              )}
              <button
                onClick={() => loadData()}
                disabled={loading}
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 border border-zinc-200 transition-colors disabled:opacity-50"
                title="Recargar"
                aria-label="Recargar registros"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
              </button>

              {/* Destructive action — visually separated */}
              {activeFiltersCount > 0 && canDelete && (
                <div className="border-l border-zinc-200 pl-2">
                  <button
                    onClick={handleDeleteByFilters}
                    disabled={loading || filteredRows.length === 0}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Eliminar todos los registros que coinciden con los filtros activos"
                  >
                    <Trash2 size={16} />
                    <span className="hidden sm:inline">
                      Eliminar filtrados ({filteredRows.length})
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-100">
              <div className="space-y-1">
                <label htmlFor="cf-filter-anio" className={FORM_LABEL_CLASS}>
                  Año
                </label>
                <select
                  id="cf-filter-anio"
                  value={filterAnio}
                  onChange={(e) => {
                    setFilterAnio(e.target.value);
                    setPage(1);
                  }}
                  className={formInputClass("emerald")}
                >
                  <option value="">Todos los años</option>
                  {uniqueAnios.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="cf-filter-sede" className={FORM_LABEL_CLASS}>
                  Sede
                </label>
                <select
                  id="cf-filter-sede"
                  value={filterSede}
                  onChange={(e) => {
                    setFilterSede(e.target.value);
                    setPage(1);
                  }}
                  className={formInputClass("emerald")}
                >
                  <option value="">Todas las sedes</option>
                  {uniqueSedes.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="cf-filter-fuente" className={FORM_LABEL_CLASS}>
                  Tipo de fuente
                </label>
                <select
                  id="cf-filter-fuente"
                  value={filterFuente}
                  onChange={(e) => {
                    setFilterFuente(e.target.value);
                    setPage(1);
                  }}
                  className={formInputClass("emerald")}
                >
                  <option value="">Todos los tipos de fuente</option>
                  {uniqueFuentes.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="cf-filter-alcance" className={FORM_LABEL_CLASS}>
                  Grupo de emisión
                </label>
                <select
                  id="cf-filter-alcance"
                  value={filterAlcance}
                  onChange={(e) => {
                    setFilterAlcance(e.target.value);
                    setPage(1);
                  }}
                  className={formInputClass("emerald")}
                >
                  <option value="">Todos los grupos</option>
                  {uniqueAlcances.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {hasLoadError && !loading && (
          <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-zinc-700">
              No pudimos cargar los registros
            </p>
            <button
              onClick={() => loadData()}
              className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        )}

        {!hasLoadError && (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-zinc-100">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1.5 flex-1">
                          <div className="h-4 animate-pulse bg-zinc-200 rounded w-2/3" />
                          <div className="h-3 animate-pulse bg-zinc-100 rounded w-1/2" />
                        </div>
                        <div className="h-5 w-12 animate-pulse bg-zinc-200 rounded" />
                      </div>
                      <div className="h-3.5 animate-pulse bg-zinc-100 rounded w-1/3" />
                    </div>
                  ))
                : pagedRows.length === 0
                  ? emptyState
                  : pagedRows.map((row) => (
                      <div key={row.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 text-sm truncate">
                              {row.sedeNombre}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {row.fuenteNombre}
                            </p>
                            {row.subfuenteNombre !== "-" && (
                              <p className="text-xs text-zinc-400 italic">
                                {row.subfuenteNombre}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="px-2 py-0.5 rounded-md text-xs font-black bg-zinc-100 text-zinc-700 tabular-nums">
                              {row.anio}
                            </span>
                            <LoadModeBadge mode={row.modoCarga} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            {row.item && (
                              <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded font-mono text-xs">
                                {row.item}
                              </span>
                            )}
                            <span className="text-sm font-bold text-zinc-900 tabular-nums">
                              {row.cantidad !== undefined
                                ? row.cantidad.toLocaleString("es-CO")
                                : "—"}
                              {row.unidadNombre !== "-" && (
                                <span className="ml-1 text-xs font-medium text-zinc-400">
                                  {row.unidadNombre}
                                </span>
                              )}
                            </span>
                          </div>
                          <RowActions
                            entityName={`registro de ${row.sedeNombre} ${row.anio}`}
                            editHref={`/huella-carbono/${row.id}/editar`}
                            onEditClick={() => handleEditClick(row.id)}
                            canEdit={canCreate}
                            canDelete={canDelete}
                            onDelete={() => handleDelete(row)}
                          />
                        </div>
                        <p
                          className="text-xs text-zinc-400"
                          title={row.alcanceNombre}
                        >
                          {shortGroupName(row.alcanceNombre)}
                        </p>
                      </div>
                    ))}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-zinc-50/80 border-b border-zinc-100">
                    {sortHeader("Año", "anio")}
                    {sortHeader("Sede", "sede")}
                    {sortHeader("Grupo", "grupo")}
                    {sortHeader("Tipo de fuente", "tipo")}
                    {sortHeader("Fuente de emisión", "fuente")}
                    {sortHeader("Ítem", "item")}
                    {sortHeader("Consumo", "consumo", "text-right")}
                    <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {loading ? (
                    Array.from({ length: 7 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 8 }).map((__, j) => (
                          <td key={j} className="px-5 py-3">
                            <div
                              className={`h-4 animate-pulse bg-zinc-200 rounded ${j === 7 ? "w-16 ml-auto" : ""}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : pagedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8}>{emptyState}</td>
                    </tr>
                  ) : (
                    pagedRows.map((row) => (
                      <tr
                        key={row.id}
                        className="hover:bg-zinc-50/40 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <span className="block text-sm font-bold text-zinc-800 tabular-nums">
                            {row.anio}
                          </span>
                          <LoadModeBadge mode={row.modoCarga} />
                        </td>
                        <td className="px-5 py-3 text-zinc-700 font-medium">
                          {row.sedeNombre}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="text-xs font-semibold text-zinc-600 cursor-default"
                            title={row.alcanceNombre}
                          >
                            {shortGroupName(row.alcanceNombre)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-zinc-700 text-xs font-medium">
                          {row.fuenteNombre}
                        </td>
                        <td className="px-5 py-3 text-zinc-400 text-xs italic">
                          {row.subfuenteNombre !== "-"
                            ? row.subfuenteNombre
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          {row.item ? (
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded font-mono text-xs">
                              {row.item}
                            </span>
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-bold text-zinc-900 tabular-nums">
                            {row.cantidad !== undefined
                              ? row.cantidad.toLocaleString("es-CO")
                              : "—"}
                          </span>
                          {row.unidadNombre !== "-" && (
                            <span className="ml-1 text-xs text-zinc-400 font-medium">
                              {row.unidadNombre}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <RowActions
                            entityName={`registro de ${row.sedeNombre} ${row.anio}`}
                            editHref={`/huella-carbono/${row.id}/editar`}
                            onEditClick={() => handleEditClick(row.id)}
                            canEdit={canCreate}
                            canDelete={canDelete}
                            onDelete={() => handleDelete(row)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={filteredRows.length}
              totalUnfiltered={rows.length}
              itemsLabel={filteredRows.length === 1 ? "registro" : "registros"}
              accent="emerald"
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
