'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Trash2,
  Leaf,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  RefreshCw,
} from 'lucide-react';
import { ApiCarbonFootprint } from '../types';
import { CarbonFootprintService } from '../services/carbonFootprint.service';
import { CompanyService } from '../../Companies/services/company.service';
import { ApiHeadquarter } from '../../Companies/types';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';
import Swal from 'sweetalert2';

interface DisplayRow {
  id: string;
  sedeNombre: string;
  sedeId: string;
  anio: number;
  modoCarga: string;
  item?: string;
  cantidad?: number;
  alcanceNombre: string;
  alcanceId?: string;
  fuenteNombre: string;
  fuenteId?: string;
  subfuenteNombre: string;
  subfuenteId?: string;
  unidadNombre: string;
}

interface ActiveCompany {
  id: string;
  name: string;
}

function getActiveCompanyFromSession(): ActiveCompany | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { company?: ActiveCompany | null };
    return parsed.company ?? null;
  } catch {
    return null;
  }
}

function buildDisplayRows(
  records: ApiCarbonFootprint[],
  hqMap: Map<string, string>
): DisplayRow[] {
  return records.map(r => ({
    id: r.id,
    sedeNombre: hqMap.get(r.headquarterId) ?? r.headquarterId,
    sedeId: r.headquarterId,
    anio: r.year,
    modoCarga: r.loadMode,
    item: r.item,
    cantidad: r.quantity,
    alcanceNombre: r.emissionGroup?.name ?? '-',
    alcanceId: r.emissionGroupId,
    fuenteNombre: r.emissionSource?.name ?? '-',
    fuenteId: r.emissionSourceId,
    subfuenteNombre: r.emissionSubsource?.name ?? '-',
    subfuenteId: r.emissionSubsourceId,
    unidadNombre: r.emissionUnit?.symbol ?? r.emissionUnit?.name ?? '-',
  }));
}

const PAGE_SIZE = 10;

export const CarbonFootprintRegistrationList = () => {
  const { hasPermission } = usePermission();
  const [activeCompany] = useState(() => getActiveCompanyFromSession());

  const [rows, setRows] = useState<DisplayRow[]>([]);
  const [headquarters, setHeadquarters] = useState<ApiHeadquarter[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnio, setFilterAnio] = useState('');
  const [filterSede, setFilterSede] = useState('');
  const [filterFuente, setFilterFuente] = useState('');
  const [filterAlcance, setFilterAlcance] = useState('');
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    if (!activeCompany) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [records, hq] = await Promise.all([
        CarbonFootprintService.getCarbonFootprints({ companyId: activeCompany.id }),
        CompanyService.getHeadquarters(activeCompany.id),
      ]);
      setHeadquarters(hq);
      const hqMap = new Map(hq.map(h => [h.id, h.name]));
      setRows(buildDisplayRows(records, hqMap));
    } catch {
      toast.error('Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  }, [activeCompany]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleDelete = async (row: DisplayRow) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    try {
      await CarbonFootprintService.deleteCarbonFootprint(row.id);
      toast.success('Registro eliminado exitosamente');
      loadData();
    } catch {
      toast.error('Error al eliminar el registro');
    }
  };

  const handleDeleteByFilters = async () => {
    if (!activeCompany) return;
    if (activeFiltersCount === 0) {
      toast.error('Por favor, aplique al menos un filtro para eliminar registros.');
      return;
    }

    const headquarterId = filterSede
      ? rows.find(r => r.sedeNombre === filterSede)?.sedeId
      : undefined;

    const emissionGroupId = filterAlcance
      ? rows.find(r => r.alcanceNombre === filterAlcance)?.alcanceId
      : undefined;

    const emissionSourceId = filterFuente
      ? rows.find(r => r.fuenteNombre === filterFuente)?.fuenteId
      : undefined;

    const count = filteredRows.length;

    const filterDescriptions: string[] = [];
    if (filterAnio) filterDescriptions.push(`Año: <b>${filterAnio}</b>`);
    if (filterSede) filterDescriptions.push(`Sede: <b>${filterSede}</b>`);
    if (filterFuente) filterDescriptions.push(`Fuente: <b>${filterFuente}</b>`);
    if (filterAlcance) filterDescriptions.push(`Grupo: <b>${filterAlcance}</b>`);

    const filtersHtml = filterDescriptions.join(', ');

    const result = await Swal.fire({
      title: '¿Eliminar registros filtrados?',
      html: `Se eliminarán permanentemente los <b>${count}</b> registros que coinciden con los siguientes filtros:<br/><br/>${filtersHtml}<br/><br/>Esta acción no se puede deshacer y afectará los informes de estos años.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar todos',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626', // red-600
      cancelButtonColor: '#71717a', // zinc-500
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await CarbonFootprintService.deleteByFilters({
        companyId: activeCompany.id,
        year: filterAnio ? parseInt(filterAnio, 10) : undefined,
        headquarterId,
        emissionGroupId,
        emissionSourceId,
      });
      toast.success('Registros filtrados eliminados exitosamente');
      clearFilters();
      loadData();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error al eliminar los registros';
      toast.error(errMsg);
      setLoading(false);
    }
  };

  // Unique values for filter dropdowns
  const uniqueAnios = [...new Set(rows.map(r => String(r.anio)))].sort().reverse();
  const uniqueSedes = [...new Set(rows.map(r => r.sedeNombre))].sort();
  const uniqueFuentes = [...new Set(rows.map(r => r.fuenteNombre).filter(v => v !== '-'))].sort();
  const uniqueAlcances = [...new Set(rows.map(r => r.alcanceNombre).filter(v => v !== '-'))].sort();

  const activeFiltersCount = [filterAnio, filterSede, filterFuente, filterAlcance].filter(Boolean).length;

  const clearFilters = () => {
    setFilterAnio('');
    setFilterSede('');
    setFilterFuente('');
    setFilterAlcance('');
    setSearchTerm('');
    setPage(1);
  };

  const filteredRows = rows.filter(r => {
    const matchSearch =
      !searchTerm ||
      r.sedeNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.fuenteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.anio).includes(searchTerm) ||
      (r.item ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    return (
      matchSearch &&
      (!filterAnio || String(r.anio) === filterAnio) &&
      (!filterSede || r.sedeNombre === filterSede) &&
      (!filterFuente || r.fuenteNombre === filterFuente) &&
      (!filterAlcance || r.alcanceNombre === filterAlcance)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Emisiones de huella de carbono</h1>
          <p className="text-sm text-zinc-500">Administra los registros de emisiones de las empresas.</p>
        </div>
        {hasPermission(PermissionCode.CREATE_CARBON_FOOTPRINT) && (
          <Link
            href="/huella-carbono/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-500/20"
          >
            <Plus size={18} />
            Registrar Emisión
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por sede, fuente, ítem o año..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-all ${showFilters || activeFiltersCount > 0
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/20'
                    : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
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
                >
                  <X size={16} />
                </button>
              )}
              {activeFiltersCount > 0 && hasPermission(PermissionCode.DELETE_CARBON_FOOTPRINT) && (
                <button
                  onClick={handleDeleteByFilters}
                  disabled={loading || filteredRows.length === 0}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border border-red-200 text-red-600 bg-white hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Eliminar registros filtrados"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Eliminar filtrados ({filteredRows.length})</span>
                </button>
              )}
              <button
                onClick={() => loadData()}
                disabled={loading}
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 border border-zinc-200 transition-colors disabled:opacity-50"
                title="Recargar"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Año</label>
                <select
                  value={filterAnio}
                  onChange={e => { setFilterAnio(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Todos los años</option>
                  {uniqueAnios.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Sede</label>
                <select
                  value={filterSede}
                  onChange={e => { setFilterSede(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Todas las sedes</option>
                  {uniqueSedes.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Fuente de emisión</label>
                <select
                  value={filterFuente}
                  onChange={e => { setFilterFuente(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Todas las fuentes</option>
                  {uniqueFuentes.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Grupo de Emisiones</label>
                <select
                  value={filterAlcance}
                  onChange={e => { setFilterAlcance(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Todos los grupos</option>
                  {uniqueAlcances.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Mobile card view */}
        <div className="md:hidden divide-y divide-zinc-100">
          {loading ? (
            <div className="px-4 py-10 text-center text-zinc-400">
              <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
              Cargando registros...
            </div>
          ) : pagedRows.length === 0 ? (
            <div className="px-4 py-12 flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                <Leaf className="text-emerald-500" size={24} />
              </div>
              <p className="text-zinc-500 text-sm text-center">
                {activeFiltersCount > 0 || searchTerm
                  ? 'No hay registros que coincidan con los filtros aplicados.'
                  : 'No se encontraron registros de huella de carbono.'}
              </p>
            </div>
          ) : (
            pagedRows.map((row) => (
              <div key={row.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-zinc-900 text-sm truncate">{row.sedeNombre}</p>
                    <p className="text-xs text-zinc-500">{row.fuenteNombre}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-sm font-bold text-zinc-800">{row.anio}</span>
                    {hasPermission(PermissionCode.DELETE_CARBON_FOOTPRINT) && (
                      <button onClick={() => handleDelete(row)} className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {row.item && (
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded font-mono text-xs">{row.item}</span>
                  )}
                  <span className="text-xs font-bold text-zinc-900 tabular-nums">
                    {row.cantidad !== undefined ? row.cantidad.toLocaleString('es-CO') : '-'} {row.unidadNombre}
                  </span>
                  <span className="text-xs text-zinc-500 italic">{row.subfuenteNombre}</span>
                </div>
                <p className="text-xs text-zinc-400">{row.alcanceNombre}</p>
              </div>
            ))
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-100">
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Sede</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Ítem</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap text-right">Consumo</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Unidad</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Año</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Grupo de Emisiones</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Fuente de emisión</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Subfuente</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-zinc-400">
                    <RefreshCw size={20} className="animate-spin mx-auto mb-2" />
                    Cargando registros...
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Leaf className="text-emerald-500" size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-900">No hay registros</h3>
                        <p className="text-zinc-500 text-sm">
                          {activeFiltersCount > 0 || searchTerm
                            ? 'No hay registros que coincidan con los filtros aplicados.'
                            : 'No se encontraron registros de huella de carbono.'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/40 transition-colors group">
                    <td className="px-5 py-3 text-zinc-700 font-medium">{row.sedeNombre}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded font-mono text-xs">
                        {row.item ?? '-'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-zinc-900 tabular-nums">
                      {row.cantidad !== undefined ? row.cantidad.toLocaleString('es-CO') : '-'}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{row.unidadNombre}</td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-zinc-800">
                        {row.anio}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-600 text-xs">{row.alcanceNombre}</td>
                    <td className="px-5 py-3 text-zinc-700 text-xs font-medium">{row.fuenteNombre}</td>
                    <td className="px-5 py-3 text-zinc-500 text-xs italic">{row.subfuenteNombre}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasPermission(PermissionCode.DELETE_CARBON_FOOTPRINT) && (
                          <button
                            onClick={() => handleDelete(row)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-zinc-100 bg-zinc-50/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <span className="text-zinc-500 text-xs">
            Página <span className="font-bold text-zinc-700">{page}</span> de{' '}
            <span className="font-bold text-zinc-700">{totalPages}</span>
            {' '}— {filteredRows.length} registros en total
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce<(number | '...')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-zinc-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${page === p
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                        : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Hidden — used only by filter to pass headquarters to loadData */}
      {headquarters.length === 0 && null}
    </div>
  );
};
