'use client';

import { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Download, Search, X } from 'lucide-react';
import { ApiCarbonFootprint } from '../../types';

interface AnalysisRecordsTabProps {
  records: ApiCarbonFootprint[];
  recordIdsWithFactors: Set<string>;
  defaultShowUncovered?: boolean;
}

const PAGE_SIZE = 25;

const LOAD_MODE_LABELS: Record<string, string> = {
  Monthly: 'Mensual',
  Annual: 'Anual',
};

function exportToCsv(rows: ApiCarbonFootprint[], covered: Set<string>, filename: string) {
  const headers = [
    '#', 'Item', 'Año', 'Carga', 'Cantidad', 'Unidad',
    'Grupo', 'Categoría de fuente', 'Fuente de emision', 'Tiene factor',
  ];
  const data = rows.map((r, i) => [
    i + 1,
    r.item ?? '',
    r.year,
    LOAD_MODE_LABELS[r.loadMode] ?? r.loadMode,
    r.quantity ?? '',
    r.emissionUnit?.symbol ?? '',
    r.emissionGroup?.name ?? '',
    r.emissionSourceCategory?.name ?? '',
    r.emissionSource?.name ?? '',
    covered.has(r.id) ? 'Sí' : 'No',
  ]);

  const csv = [headers, ...data]
    .map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    )
    .join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
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
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
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
    const q = search.trim().toLowerCase();
    return records.filter(r => {
      if (q) {
        const matchItem = r.item?.toLowerCase().includes(q);
        const matchSource = r.emissionSource?.name.toLowerCase().includes(q);
        if (!matchItem && !matchSource) return false;
      }
      if (groupFilter && r.emissionGroupId !== groupFilter) return false;
      if (categoryFilter && r.emissionSourceCategoryId !== categoryFilter) return false;
      if (sourceFilter && r.emissionSubsourceId !== sourceFilter) return false;
      if (showUncovered && recordIdsWithFactors.has(r.id)) return false;
      return true;
    });
  }, [records, search, groupFilter, categoryFilter, sourceFilter, showUncovered, recordIdsWithFactors]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, groupFilter, categoryFilter, sourceFilter, showUncovered]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pageRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const startRow = (page - 1) * PAGE_SIZE + 1;
  const endRow = Math.min(page * PAGE_SIZE, filteredRecords.length);

  const goTo = (p: number) => setPage(Math.max(1, Math.min(totalPages, p)));

  const uncoveredCount = records.filter(r => !recordIdsWithFactors.has(r.id)).length;

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-3.5 border-b border-zinc-100 flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por item o subfuente..."
              className="w-full pl-8 pr-8 py-1.5 text-xs rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white"
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

          {/* Group filter */}
          {uniqueGroups.length > 1 && (
            <select
              value={groupFilter}
              onChange={e => setGroupFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700"
            >
              <option value="">Todos los grupos</option>
              {uniqueGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}

          {/* Category filter */}
          {uniqueCategories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700"
            >
              <option value="">Todas las categorías de fuente</option>
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
              className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none transition-all bg-white text-zinc-700"
            >
              <option value="">Todas las fuentes de emision</option>
              {uniqueSources.map(s => (
                <option key={s.id} value={s.id} title={s.name}>
                  {s.name.length > 30 ? s.name.substring(0, 27) + '...' : s.name}
                </option>
              ))}
            </select>
          )}

          {/* Uncovered toggle */}
          {uncoveredCount > 0 && (
            <button
              type="button"
              onClick={() => setShowUncovered(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                showUncovered
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-300'
              }`}
            >
              <XCircle size={12} />
              Sin factor ({uncoveredCount})
            </button>
          )}

          {/* Export */}
          <button
            type="button"
            onClick={() => exportToCsv(filteredRecords, recordIdsWithFactors, 'registros-emision.csv')}
            title="Exportar registros filtrados a CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-100 transition-colors ml-auto"
          >
            <Download size={12} />
            CSV
          </button>
        </div>

        {/* Stats row */}
        <div className="px-5 py-2 bg-zinc-50/60 border-b border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
          <span>
            {filteredRecords.length !== records.length
              ? `${filteredRecords.length.toLocaleString('es-CO')} de ${records.length.toLocaleString('es-CO')} registros`
              : `${records.length.toLocaleString('es-CO')} registros`}
          </span>
          {filteredRecords.length > PAGE_SIZE && (
            <span>{startRow}–{endRow} de {filteredRecords.length.toLocaleString('es-CO')}</span>
          )}
        </div>

        {filteredRecords.length === 0 ? (
          <div className="px-6 py-12 text-center text-zinc-400 text-sm">
            No hay registros que coincidan con los filtros aplicados
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider">
                    <th className="px-4 py-2.5 text-right w-10">#</th>
                    <th className="px-4 py-2.5 text-left">Item</th>
                    <th className="px-4 py-2.5 text-center">Año</th>
                    <th className="px-4 py-2.5 text-center hidden sm:table-cell">Carga</th>
                    <th className="px-4 py-2.5 text-right">Cantidad</th>
                    <th className="px-4 py-2.5 text-left">Unidad</th>
                    <th className="px-4 py-2.5 text-left hidden md:table-cell">Categoría de fuente</th>
                    <th className="px-4 py-2.5 text-left">Fuente de emision</th>
                    <th className="px-4 py-2.5 text-center">Factor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {pageRecords.map((record, idx) => {
                    const hasFactor = recordIdsWithFactors.has(record.id);
                    return (
                      <tr
                        key={record.id}
                        className={`transition-colors ${
                          hasFactor ? 'hover:bg-zinc-50/70' : 'bg-red-50/30 hover:bg-red-50/50'
                        }`}
                      >
                        <td className="px-4 py-2.5 text-right text-zinc-300 font-mono tabular-nums">
                          {startRow + idx}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-700 max-w-[180px] truncate" title={record.item ?? ''}>
                          {record.item ?? <span className="text-zinc-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center text-zinc-600 font-mono">
                          {record.year}
                        </td>
                        <td className="px-4 py-2.5 text-center hidden sm:table-cell">
                          <span className="px-1.5 py-0.5 rounded text-zinc-500 bg-zinc-100 text-[10px] font-medium">
                            {LOAD_MODE_LABELS[record.loadMode] ?? record.loadMode}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-zinc-800">
                          {record.quantity != null
                            ? record.quantity.toLocaleString('es-CO', { maximumFractionDigits: 4 })
                            : <span className="text-zinc-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500">
                          {record.emissionUnit?.symbol ?? <span className="text-zinc-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500 max-w-[140px] truncate hidden md:table-cell" title={record.emissionSourceCategory?.name ?? ''}>
                          {record.emissionSourceCategory?.name ?? <span className="text-zinc-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500 max-w-[160px] truncate" title={record.emissionSource?.name ?? ''}>
                          {record.emissionSource?.name ?? <span className="text-zinc-300">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {hasFactor ? (
                            <CheckCircle2 size={14} className="text-emerald-500 mx-auto" />
                          ) : (
                            <XCircle size={14} className="text-red-400 mx-auto" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-zinc-100 flex items-center justify-between gap-4 bg-zinc-50/50">
                <span className="text-xs text-zinc-400">
                  Página {page} de {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goTo(1)}
                    disabled={page === 1}
                    className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    «
                  </button>
                  <button
                    onClick={() => goTo(page - 1)}
                    disabled={page === 1}
                    className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let p: number;
                    if (totalPages <= 5) p = i + 1;
                    else if (page <= 3) p = i + 1;
                    else if (page >= totalPages - 2) p = totalPages - 4 + i;
                    else p = page - 2 + i;
                    return (
                      <button
                        key={p}
                        onClick={() => goTo(p)}
                        className={`w-7 h-7 text-xs rounded-lg font-medium transition-colors ${
                          p === page
                            ? 'bg-violet-600 text-white'
                            : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => goTo(page + 1)}
                    disabled={page === totalPages}
                    className="p-1.5 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => goTo(totalPages)}
                    disabled={page === totalPages}
                    className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
