"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Gas } from "../types";
import { GasFormModal } from "./GasFormModal";
import { GasService } from "@/shared/services/gas.service";
import { DeletionImpactService } from "@/shared/services/deletion-impact.service";
import { confirmDeleteWithImpact } from "@/shared/lib/confirm-delete-with-impact";
import { nextSortState, type SortDirection } from "@/shared/lib/list-utils";
import { formatNumber } from "@/shared/lib/format";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { SortableHeader } from "@/shared/components/Common/SortableHeader";
import { RowActions } from "@/shared/components/Common/RowActions";
import { PageHeader } from "@/shared/components/Common/PageHeader";
import {
  CalcFilter,
  GasSortKey,
  matchesCalcFilter,
  matchesGasSearch,
  sortGases,
} from "../utils/gas-list.utils";
import {
  buildGasDeletionWarningHtml,
  buildPlainDeletionHtml,
} from "../utils/deletion-warning";
import { buttonClass } from "@/shared/components/Common/button-styles";

const CALC_FILTERS: { key: CalcFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "biogenic", label: "Biogénico" },
  { key: "non_biogenic", label: "No biogénico" },
];

interface EmptyStateProps {
  colspan?: number;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

const EmptyState = ({
  colspan,
  hasActiveFilters,
  clearFilters,
}: EmptyStateProps) => {
  const content = (
    <div className="px-6 py-16 text-center">
      <p className="text-sm font-semibold text-zinc-500">
        {hasActiveFilters ? "Sin resultados" : "Sin gases registrados"}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {hasActiveFilters
          ? "Prueba con otros filtros o términos de búsqueda"
          : "Crea el primer gas de efecto invernadero"}
      </p>
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="mt-3 text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors cursor-pointer"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
  return colspan ? (
    <tr>
      <td colSpan={colspan}>{content}</td>
    </tr>
  ) : (
    content
  );
};

export const GasesList = () => {
  const [gases, setGases] = useState<Gas[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [calcFilter, setCalcFilter] = useState<CalcFilter>("all");
  const [sortKey, setSortKey] = useState<GasSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGas, setEditingGas] = useState<Gas | undefined>(undefined);

  const fetchGases = useCallback(async () => {
    setLoading(true);
    try {
      const data = await GasService.getGases();
      setGases(data);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al cargar los gases",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGases();
  }, [fetchGases]);

  const displayedGases = useMemo(
    () =>
      sortGases(
        gases.filter(
          (gas) =>
            matchesGasSearch(gas, searchTerm) &&
            matchesCalcFilter(gas, calcFilter),
        ),
        sortKey,
        sortDirection,
      ),
    [gases, searchTerm, calcFilter, sortKey, sortDirection],
  );

  const hasActiveFilters = !!searchTerm || calcFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setCalcFilter("all");
  };

  const handleSort = (key: GasSortKey) => {
    const next = nextSortState({ key: sortKey, direction: sortDirection }, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
  };

  const handleOpenCreate = () => {
    setEditingGas(undefined);
    setModalOpen(true);
  };
  const handleOpenEdit = (gas: Gas) => {
    setEditingGas(gas);
    setModalOpen(true);
  };

  const handleSave = async (data: Omit<Gas, "id"> & { id?: string }) => {
    try {
      if (data.id) {
        const updated = await GasService.updateGas(data.id, data);
        setGases((prev) => prev.map((g) => (g.id === data.id ? updated : g)));
        toast.success("Gas actualizado exitosamente");
      } else {
        const created = await GasService.createGas(data);
        setGases((prev) => [...prev, created]);
        toast.success("Gas creado exitosamente");
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al guardar el gas",
      );
    }
  };

  const handleDelete = async (gas: Gas) => {
    const confirmed = await confirmDeleteWithImpact({
      title: "¿Eliminar este gas?",
      loadImpact: () => DeletionImpactService.forGas(gas.id),
      buildHtml: (impact) =>
        buildGasDeletionWarningHtml(
          `${gas.chemical_name} (${gas.formula})`,
          impact,
        ),
      fallbackHtml: buildPlainDeletionHtml(
        "el gas",
        `${gas.chemical_name} (${gas.formula})`,
      ),
    });
    if (!confirmed) return;

    try {
      await GasService.deleteGas(gas.id);
      setGases((prev) => prev.filter((g) => g.id !== gas.id));
      toast.success("Gas eliminado exitosamente");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar el gas",
      );
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Gases de Efecto Invernadero"
          description="Gestiona los gases y sus valores de Potencial de Calentamiento Global (GWP)."
          actions={
            <>
              <button
                onClick={handleOpenCreate}
                className={buttonClass()}
              >
                <Plus size={18} />
                Nuevo gas
              </button>
            </>
          }
        />

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-zinc-100 flex items-center gap-3 flex-wrap">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar por nombre o fórmula..."
              className="flex-1 min-w-52"
            />

            {/* Calc type filter */}
            <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5 flex-shrink-0">
              {CALC_FILTERS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setCalcFilter(opt.key)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    calcFilter === opt.key
                      ? "bg-white text-zinc-800 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Result count */}
            {!loading && (
              <span className="text-xs text-zinc-400 flex-shrink-0 tabular-nums">
                {displayedGases.length}{" "}
                {displayedGases.length === 1 ? "gas" : "gases"}
                {hasActiveFilters && ` de ${gases.length}`}
              </span>
            )}
          </div>

          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-zinc-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 flex items-center justify-between gap-3 animate-pulse"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex-shrink-0" />
                    <div className="space-y-2">
                      <div className="h-4 bg-zinc-100 rounded w-28" />
                      <div className="h-3 bg-zinc-100 rounded w-16" />
                    </div>
                  </div>
                  <div className="h-8 w-16 bg-zinc-100 rounded" />
                </div>
              ))
            ) : displayedGases.length > 0 ? (
              displayedGases.map((gas) => (
                <div
                  key={gas.id}
                  className="p-4 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold flex-shrink-0 border border-violet-100">
                      <FlaskConical size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-sm">
                        {gas.chemical_name}
                      </p>
                      <span className="font-mono text-xs font-bold text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                        {gas.formula}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-zinc-600">
                          GWP:{" "}
                          <span className="font-bold text-zinc-900">
                            {formatNumber(gas.gwp)}
                          </span>
                        </span>
                        {(gas.calculation_type === "biogenic" ||
                          gas.calculation_type === "both") && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Biogénico
                          </span>
                        )}
                        {(gas.calculation_type === "non_biogenic" ||
                          gas.calculation_type === "both") && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                            No biogénico
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <RowActions
                    entityName={gas.chemical_name}
                    onEdit={() => handleOpenEdit(gas)}
                    onDelete={() => handleDelete(gas)}
                  />
                </div>
              ))
            ) : (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                clearFilters={clearFilters}
              />
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <SortableHeader
                    label="Gas"
                    sortKey="name"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Fórmula"
                    sortKey="formula"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="GWP"
                    sortKey="gwp"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Cálculo
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex-shrink-0" />
                          <div className="h-4 bg-zinc-100 rounded w-36" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-zinc-100 rounded w-16" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-zinc-100 rounded w-10" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 bg-zinc-100 rounded-full w-20" />
                        </div>
                      </td>
                      <td className="px-6 py-4" />
                    </tr>
                  ))
                ) : displayedGases.length > 0 ? (
                  displayedGases.map((gas) => (
                    <tr
                      key={gas.id}
                      onClick={() => handleOpenEdit(gas)}
                      className="cursor-pointer hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 flex-shrink-0">
                            <FlaskConical size={16} />
                          </div>
                          <div>
                            <span className="font-bold text-zinc-900 block">
                              {gas.chemical_name}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-md">
                          {gas.formula}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-zinc-800 tabular-nums">
                          {formatNumber(gas.gwp)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(gas.calculation_type === "biogenic" ||
                            gas.calculation_type === "both") && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Biogénico
                            </span>
                          )}
                          {(gas.calculation_type === "non_biogenic" ||
                            gas.calculation_type === "both") && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              No biogénico
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RowActions
                          entityName={gas.chemical_name}
                          onEdit={() => handleOpenEdit(gas)}
                          onDelete={() => handleDelete(gas)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyState
                    colspan={5}
                    hasActiveFilters={hasActiveFilters}
                    clearFilters={clearFilters}
                  />
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <GasFormModal
          gas={editingGas}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
