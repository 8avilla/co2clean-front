"use client";

import { useState, useMemo, useEffect } from "react";
import { CheckCircle2, XCircle, Download } from "lucide-react";
import { ApiCarbonFootprint } from "../../types";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { matchesSearchTerms } from "@/shared/lib/list-utils";
import { Pagination } from "@/shared/components/Common/Pagination";
import { buttonClass } from "@/shared/components/Common/button-styles";
import {
  FORM_LABEL_CLASS,
  formInputClass,
} from "@/shared/components/Common/form-styles";

interface AnalysisRecordsTabProps {
  records: ApiCarbonFootprint[];
  recordIdsWithFactors: Set<string>;
  defaultShowUncovered?: boolean;
}

const PAGE_SIZE = 25;

const LOAD_MODE_LABELS: Record<string, string> = {
  Monthly: "Mensual",
  Annual: "Anual",
};

function exportToCsv(
  rows: ApiCarbonFootprint[],
  covered: Set<string>,
  filename: string,
) {
  const headers = [
    "#",
    "Item",
    "Año",
    "Carga",
    "Cantidad",
    "Unidad",
    "Grupo",
    "Tipo de fuente",
    "Fuente de emisión",
    "Tiene factor",
  ];
  const data = rows.map((r, i) => [
    i + 1,
    r.item ?? "",
    r.year,
    LOAD_MODE_LABELS[r.loadMode] ?? r.loadMode,
    r.quantity ?? "",
    r.emissionUnit?.symbol ?? "",
    r.emissionGroup?.name ?? "",
    r.emissionSourceCategory?.name ?? "",
    r.emissionSource?.name ?? "",
    covered.has(r.id) ? "Sí" : "No",
  ]);

  const csv = [headers, ...data]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const AnalysisRecordsTab = ({
  records,
  recordIdsWithFactors,
  defaultShowUncovered = false,
}: AnalysisRecordsTabProps) => {
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [showUncovered, setShowUncovered] = useState(defaultShowUncovered);
  const [page, setPage] = useState(1);

  // Sync filter from parent navigation (e.g. clicking "ver sin factor" in alert banner)
  useEffect(() => {
    if (defaultShowUncovered) {
      setShowUncovered(true);
      setPage(1);
    }
  }, [defaultShowUncovered]);

  // Unique groups derived from records for the filter dropdown
  const uniqueGroups = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of records) {
      if (r.emissionGroupId && r.emissionGroup?.name) {
        map.set(r.emissionGroupId, r.emissionGroup.name);
      }
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [records]);

  const uniqueCategories = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of records) {
      if (r.emissionSourceCategoryId && r.emissionSourceCategory?.name) {
        if (!groupFilter || r.emissionGroupId === groupFilter) {
          map.set(r.emissionSourceCategoryId, r.emissionSourceCategory.name);
        }
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records, groupFilter]);

  const uniqueSources = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of records) {
      if (r.emissionSubsourceId && r.emissionSource?.name) {
        if (!categoryFilter || r.emissionSourceCategoryId === categoryFilter) {
          if (!groupFilter || r.emissionGroupId === groupFilter) {
            map.set(r.emissionSubsourceId, r.emissionSource.name);
          }
        }
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [records, groupFilter, categoryFilter]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (!matchesSearchTerms(search, r.item, r.emissionSource?.name))
        return false;
      if (groupFilter && r.emissionGroupId !== groupFilter) return false;
      if (categoryFilter && r.emissionSourceCategoryId !== categoryFilter)
        return false;
      if (sourceFilter && r.emissionSubsourceId !== sourceFilter) return false;
      if (showUncovered && recordIdsWithFactors.has(r.id)) return false;
      return true;
    });
  }, [
    records,
    search,
    groupFilter,
    categoryFilter,
    sourceFilter,
    showUncovered,
    recordIdsWithFactors,
  ]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, groupFilter, categoryFilter, sourceFilter, showUncovered]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pageRecords = filteredRecords.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const startRow = (page - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(page * PAGE_SIZE, filteredRecords.length);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  const uncoveredCount = records.filter(
    (r) => !recordIdsWithFactors.has(r.id),
  ).length;

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-zinc-100 flex flex-wrap items-end gap-4">
          {/* Search */}
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar por item o subfuente..."
            accent="teal"
            className="flex-1 min-w-48"
          />

          {/* Group filter */}
          {uniqueGroups.length > 1 && (
            <div className="space-y-1">
              <label
                htmlFor="records-group-filter"
                className={FORM_LABEL_CLASS}
              >
                Grupo de emisión
              </label>
              <select
                id="records-group-filter"
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className={`${formInputClass("teal")} min-w-[180px]`}
              >
                <option value="">Todos</option>
                {uniqueGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Category filter */}
          {uniqueCategories.length > 0 && (
            <div className="space-y-1">
              <label
                htmlFor="records-category-filter"
                className={FORM_LABEL_CLASS}
              >
                Tipo de fuente
              </label>
              <select
                id="records-category-filter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`${formInputClass("teal")} min-w-[180px]`}
              >
                <option value="">Todos</option>
                {uniqueCategories.map((c) => (
                  <option key={c.id} value={c.id} title={c.name}>
                    {c.name.length > 30
                      ? c.name.substring(0, 27) + "..."
                      : c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Source filter */}
          {uniqueSources.length > 0 && (
            <div className="space-y-1">
              <label
                htmlFor="records-source-filter"
                className={FORM_LABEL_CLASS}
              >
                Fuente de emisión
              </label>
              <select
                id="records-source-filter"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className={`${formInputClass("teal")} min-w-[180px]`}
              >
                <option value="">Todas</option>
                {uniqueSources.map((s) => (
                  <option key={s.id} value={s.id} title={s.name}>
                    {s.name.length > 30
                      ? s.name.substring(0, 27) + "..."
                      : s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Uncovered toggle */}
          {uncoveredCount > 0 && (
            <button
              type="button"
              onClick={() => setShowUncovered((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                showUncovered
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300"
              }`}
            >
              <XCircle size={14} />
              Sin factor ({uncoveredCount})
            </button>
          )}

          {/* Export */}
          <button
            type="button"
            onClick={() =>
              exportToCsv(
                filteredRecords,
                recordIdsWithFactors,
                "registros-emision.csv",
              )
            }
            title="Exportar registros filtrados a CSV"
            className={`${buttonClass({ variant: "secondary" })} ml-auto`}
          >
            <Download size={14} />
            Exportar CSV
          </button>
        </div>

        {/* Stats row */}
        <div className="px-5 py-2.5 bg-zinc-50/60 border-b border-zinc-100 flex items-center justify-between text-sm text-zinc-500">
          <span>
            {filteredRecords.length !== records.length
              ? `${filteredRecords.length.toLocaleString("es-CO")} de ${records.length.toLocaleString("es-CO")} registros`
              : `${records.length.toLocaleString("es-CO")} registros`}
          </span>
          {filteredRecords.length > PAGE_SIZE && (
            <span>
              {startRow}–{endRow} de{" "}
              {filteredRecords.length.toLocaleString("es-CO")}
            </span>
          )}
        </div>

        {filteredRecords.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-500 text-sm">
            No hay registros que coincidan con los filtros aplicados
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 text-xs font-semibold">
                    <th className="px-4 py-3 text-right w-10">#</th>
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-center">Año</th>
                    <th className="px-4 py-3 text-center hidden sm:table-cell">
                      Carga
                    </th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-left">Unidad</th>
                    <th className="px-4 py-3 text-left hidden md:table-cell">
                      Tipo de fuente
                    </th>
                    <th className="px-4 py-3 text-left">Fuente de emisión</th>
                    <th className="px-4 py-3 text-center">Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {pageRecords.map((record, idx) => {
                    const hasFactor = recordIdsWithFactors.has(record.id);
                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors ${
                          hasFactor
                            ? "hover:bg-zinc-50/70"
                            : "bg-red-50/30 hover:bg-red-50/50"
                        }`}
                      >
                        <td className="px-4 py-3 text-right text-zinc-400 font-mono tabular-nums">
                          {startRow + idx}
                        </td>
                        <td
                          className="px-4 py-3 text-zinc-900 max-w-[220px] truncate"
                          title={record.item ?? ""}
                        >
                          {record.item ?? (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-zinc-600 font-mono">
                          {record.year}
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className="px-1.5 py-0.5 rounded text-zinc-600 bg-zinc-100 text-xs font-medium">
                            {LOAD_MODE_LABELS[record.loadMode] ??
                              record.loadMode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-zinc-800">
                          {record.quantity != null ? (
                            record.quantity.toLocaleString("es-CO", {
                              maximumFractionDigits: 4,
                            })
                          ) : (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-zinc-600">
                          {record.emissionUnit?.symbol ?? (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-zinc-600 max-w-[200px] truncate hidden md:table-cell"
                          title={record.emissionSourceCategory?.name ?? ""}
                        >
                          {record.emissionSourceCategory?.name ?? (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-zinc-600 max-w-[220px] truncate"
                          title={record.emissionSource?.name ?? ""}
                        >
                          {record.emissionSource?.name ?? (
                            <span className="text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {hasFactor ? (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500 mx-auto"
                            />
                          ) : (
                            <XCircle
                              size={16}
                              className="text-red-400 mx-auto"
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalItems={filteredRecords.length}
                totalUnfiltered={records.length}
                itemsLabel={
                  filteredRecords.length === 1 ? "registro" : "registros"
                }
                onPageChange={goTo}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};
