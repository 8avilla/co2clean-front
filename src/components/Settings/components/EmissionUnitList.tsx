"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, Ruler, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  EmissionUnitService,
  UnitTypeService,
  ApiEmissionUnit,
  ApiUnitType,
} from "@/shared/services/emission-source.service";
import { PageHeader } from "@/shared/components/Common/PageHeader";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { DataTable } from "@/shared/components/Common/DataTable";
import { SortableHeader } from "@/shared/components/Common/SortableHeader";
import { nextSortState, type SortDirection } from "@/shared/lib/list-utils";
import {
  UnitSortKey,
  matchesUnitSearch,
  sortUnits,
} from "../utils/unit-list.utils";

export const EmissionUnitList = () => {
  const [units, setUnits] = useState<ApiEmissionUnit[]>([]);
  const [unitTypes, setUnitTypes] = useState<ApiUnitType[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [unitTypeFilter, setUnitTypeFilter] = useState("");
  const [sortKey, setSortKey] = useState<UnitSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Unit types visible in the filter (exclude internal COMERCIAL type)
  const filterableUnitTypes = useMemo(
    () => unitTypes.filter((t) => t.code.toUpperCase() !== "COMERCIAL"),
    [unitTypes],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedUnits, fetchedTypes] = await Promise.all([
        EmissionUnitService.getUnits({ limit: 1000 }),
        UnitTypeService.getUnitTypes(),
      ]);
      setUnitTypes(fetchedTypes);
      // Filter out units belonging to the internal COMERCIAL unit type
      const commercialTypeIds = new Set(
        fetchedTypes
          .filter((t) => t.code.toUpperCase() === "COMERCIAL")
          .map((t) => t.id),
      );
      setUnits(
        fetchedUnits.filter(
          (u) => !u.unitTypeId || !commercialTypeIds.has(u.unitTypeId),
        ),
      );
    } catch {
      toast.error("Error al cargar las unidades de medida");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unitTypeMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of unitTypes) m.set(t.id, t.name);
    return m;
  }, [unitTypes]);

  const filtered = useMemo(
    () =>
      sortUnits(
        units.filter(
          (unit) =>
            (!unitTypeFilter || unit.unitTypeId === unitTypeFilter) &&
            matchesUnitSearch(unit, search),
        ),
        sortKey,
        sortDirection,
        (unitTypeId) => (unitTypeId ? (unitTypeMap.get(unitTypeId) ?? "") : ""),
      ),
    [units, search, unitTypeFilter, sortKey, sortDirection, unitTypeMap],
  );

  const handleSort = (key: UnitSortKey) => {
    const next = nextSortState({ key: sortKey, direction: sortDirection }, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
  };

  const hasActiveFilters = !!search || !!unitTypeFilter;

  const clearFilters = () => {
    setSearch("");
    setUnitTypeFilter("");
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <PageHeader
          title="Unidades de Medida"
          description="Consulta las unidades utilizadas en factores y registros de emisión."
        />

        {/* Filters */}
        <div className="bg-white rounded-xl border border-zinc-100 shadow-sm p-3 flex flex-wrap items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por nombre o símbolo..."
          />

          <select
            value={unitTypeFilter}
            onChange={(e) => setUnitTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700 sm:w-48"
          >
            <option value="">Todos los tipos</option>
            {filterableUnitTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <span className="text-xs text-zinc-400 ml-auto hidden md:inline-block">
            {filtered.length !== units.length
              ? `${filtered.length} de ${units.length} unidades`
              : `${units.length} ${units.length === 1 ? "unidad" : "unidades"}`}
          </span>
        </div>

        {/* Table */}
        <DataTable
          isLoading={loading}
          loadingText="Cargando unidades..."
          isEmpty={filtered.length === 0}
          emptyIcon={Ruler}
          emptyTitle={
            hasActiveFilters ? "Sin resultados" : "Sin unidades registradas"
          }
          emptyDescription={
            hasActiveFilters
              ? "Prueba con otros filtros o términos de búsqueda"
              : "No hay unidades de medida registradas"
          }
          emptyAction={
            hasActiveFilters && (
              <button
                onClick={clearFilters}
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
                  <SortableHeader
                    label="Nombre"
                    sortKey="name"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="px-4 py-3 text-left"
                  />
                  <SortableHeader
                    label="Símbolo"
                    sortKey="symbol"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="px-4 py-3 text-left"
                  />
                  <SortableHeader
                    label="Tipo"
                    sortKey="type"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                    className="px-4 py-3 text-left"
                  />
                  <th className="px-4 py-3 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-zinc-50/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-zinc-800">
                      {u.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded text-xs">
                        {u.symbol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-sm">
                      {u.unitTypeId ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600">
                          {unitTypeMap.get(u.unitTypeId) ?? u.unitTypeId}
                        </span>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-sm max-w-xs truncate">
                      {u.description ?? (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataTable>
      </div>
    </>
  );
};
