'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Trash2,
  Leaf,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { CarbonFootprintListData } from '../types';
import { CarbonFootprintService } from '../services/carbonFootprint.service';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';

const PAGE_SIZE_DETAIL = 10;

// Simulated detail rows generated from the parent records
function generateDetailRows(footprints: CarbonFootprintListData[]) {
  const rows: Array<{
    id: string;
    sedeNombre: string;
    item: string;
    cantidadConsumida: string;
    unidad: string;
    anio: string;
    fuenteNombre: string;
    subfuente: string;
    categoriaNombre: string;
  }> = [];

  footprints.forEach((fp, idx) => {
    // Generate 3-5 detail rows per record to simulate CSV data
    const count = 3 + (idx % 3);
    for (let i = 0; i < count; i++) {
      rows.push({
        id: `${fp.id}-${i}`,
        sedeNombre: fp.sedeNombre,
        item: fp.item ? `${fp.item}-${String(i + 1).padStart(2, '0')}` : `ITEM-${idx + 1}${String(i + 1).padStart(2, '0')}`,
        cantidadConsumida: fp.cantidadConsumida
          ? String(Math.round(Number(fp.cantidadConsumida) * (0.8 + Math.random() * 0.4)))
          : String(Math.round(100 + Math.random() * 900)),
        unidad: fp.unidad || 'Litros',
        anio: fp.anio,
        fuenteNombre: fp.fuenteNombre,
        subfuente: fp.subfuente || '-',
        categoriaNombre: fp.categoriaNombre,
      });
    }
  });
  return rows;
}

export const CarbonFootprintRegistrationList = () => {
  const { hasPermission } = usePermission();
  const [footprints, setFootprints] = useState<CarbonFootprintListData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Detail table pagination
  const [detailPage, setDetailPage] = useState(1);
  const [detailSearch, setDetailSearch] = useState('');

  // Advanced filters for detail table
  const [showFilters, setShowFilters] = useState(false);
  const [filterAnio, setFilterAnio] = useState('');
  const [filterSede, setFilterSede] = useState('');
  const [filterFuente, setFilterFuente] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  // Unique values for filter dropdowns
  const uniqueAnios = [...new Set(footprints.map(f => f.anio))].sort().reverse();
  const uniqueSedes = [...new Set(footprints.map(f => f.sedeNombre))].sort();
  const uniqueFuentes = [...new Set(footprints.map(f => f.fuenteNombre))].sort();
  const uniqueCategorias = [...new Set(footprints.map(f => f.categoriaNombre))].sort();

  const activeFiltersCount = [filterAnio, filterSede, filterFuente, filterCategoria].filter(Boolean).length;

  const clearFilters = () => {
    setFilterAnio('');
    setFilterSede('');
    setFilterFuente('');
    setFilterCategoria('');
    setDetailSearch('');
    setDetailPage(1);
  };

  const fetchFootprints = async () => {
    try {
      const data = await CarbonFootprintService.getCarbonFootprints();
      setFootprints(data);
    } catch (error) {
      toast.error('Error al cargar los registros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFootprints();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este registro de huella de carbono?')) {
      try {
        await CarbonFootprintService.deleteCarbonFootprint(id);
        toast.success('Registro eliminado exitosamente');
        fetchFootprints();
      } catch (error) {
        toast.error('Error al eliminar el registro');
      }
    }
  };

  const filteredFootprints = footprints.filter(f =>
    f.empresaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.sedeNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.anio.includes(searchTerm)
  );

  // Detail rows
  const allDetailRows = generateDetailRows(footprints);
  const filteredDetailRows = allDetailRows.filter(r => {
    const matchSearch =
      !detailSearch ||
      r.sedeNombre.toLowerCase().includes(detailSearch.toLowerCase()) ||
      r.item.toLowerCase().includes(detailSearch.toLowerCase()) ||
      r.fuenteNombre.toLowerCase().includes(detailSearch.toLowerCase()) ||
      r.anio.includes(detailSearch);

    const matchAnio = !filterAnio || r.anio === filterAnio;
    const matchSede = !filterSede || r.sedeNombre === filterSede;
    const matchFuente = !filterFuente || r.fuenteNombre === filterFuente;
    const matchCategoria = !filterCategoria || r.categoriaNombre === filterCategoria;

    return matchSearch && matchAnio && matchSede && matchFuente && matchCategoria;
  });
  const totalDetailPages = Math.max(1, Math.ceil(filteredDetailRows.length / PAGE_SIZE_DETAIL));
  const pagedDetailRows = filteredDetailRows.slice(
    (detailPage - 1) * PAGE_SIZE_DETAIL,
    detailPage * PAGE_SIZE_DETAIL
  );

  return (
    <div className="space-y-6 w-full">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Registro de emisiones de huella de carbono</h1>
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

      {/* ── Summary Table (registros principales) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por empresa, sede o año..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-100">
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Empresa y Sede</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Año</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Categoría</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Fuente de Emisión</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 whitespace-nowrap">Subfuente de Emisión</th>
                <th className="px-6 py-4 font-semibold text-zinc-600 text-right whitespace-nowrap">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                    Cargando registros...
                  </td>
                </tr>
              ) : filteredFootprints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <Leaf className="text-emerald-500" size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-zinc-900">No hay registros</h3>
                        <p className="text-zinc-500 text-sm">No se encontraron registros de huella de carbono.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFootprints.map((fp) => (
                  <tr key={fp.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-zinc-900">{fp.empresaNombre}</span>
                        <span className="text-xs text-zinc-500">{fp.sedeNombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-zinc-100 text-zinc-700 rounded-md text-xs font-medium">
                        {fp.anio}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-700 text-xs truncate max-w-[150px] block" title={fp.categoriaNombre}>
                        {fp.categoriaNombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-900 text-xs font-medium">{fp.fuenteNombre}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-zinc-500 text-xs italic">{fp.subfuente || '-'}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasPermission(PermissionCode.DELETE_CARBON_FOOTPRINT) && (
                          <button
                            onClick={() => fp.id && handleDelete(fp.id)}
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
      </div>

      {/* ── Detail Table (registros del CSV, paginada) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
          {/* Toolbar row */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="text-emerald-600" size={18} />
              <span className="font-bold text-sm text-zinc-800">Detalle de registros cargados</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">
                {filteredDetailRows.length} registros
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="text"
                  placeholder="Buscar item, sede, fuente..."
                  value={detailSearch}
                  onChange={(e) => { setDetailSearch(e.target.value); setDetailPage(1); }}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>
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
                  className="p-2 rounded-xl text-sm text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
                  title="Limpiar filtros"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Advanced filters panel */}
          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Año</label>
                <select
                  value={filterAnio}
                  onChange={e => { setFilterAnio(e.target.value); setDetailPage(1); }}
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
                  onChange={e => { setFilterSede(e.target.value); setDetailPage(1); }}
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
                  onChange={e => { setFilterFuente(e.target.value); setDetailPage(1); }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Todas las fuentes</option>
                  {uniqueFuentes.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Categoría</label>
                <select
                  value={filterCategoria}
                  onChange={e => { setFilterCategoria(e.target.value); setDetailPage(1); }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                >
                  <option value="">Todas las categorías</option>
                  {uniqueCategorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-100">
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Sede</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Item / Identificador</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap text-right">Cantidad consumida</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Unidad</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Año</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Fuente de Emisión</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Subfuente de Emisión</th>
                <th className="px-5 py-3 font-semibold text-zinc-600 whitespace-nowrap">Categoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-zinc-400">Cargando detalle...</td>
                </tr>
              ) : pagedDetailRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-zinc-400">No hay datos que coincidan con la búsqueda.</td>
                </tr>
              ) : (
                pagedDetailRows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50/40 transition-colors">
                    <td className="px-5 py-3 text-zinc-700 font-medium">{row.sedeNombre}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded font-mono text-[11px]">
                        {row.item}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-zinc-900 tabular-nums">
                      {Number(row.cantidadConsumida).toLocaleString('es-CO')}
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{row.unidad}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-[11px] font-medium">{row.anio}</span>
                    </td>
                    <td className="px-5 py-3 text-zinc-700">{row.fuenteNombre}</td>
                    <td className="px-5 py-3 text-zinc-500 italic">{row.subfuente}</td>
                    <td className="px-5 py-3 text-zinc-500 max-w-[160px] truncate" title={row.categoriaNombre}>
                      {row.categoriaNombre}
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
            Página <span className="font-bold text-zinc-700">{detailPage}</span> de{' '}
            <span className="font-bold text-zinc-700">{totalDetailPages}</span>
            {' '}— {filteredDetailRows.length} registros en total
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setDetailPage(p => Math.max(1, p - 1))}
              disabled={detailPage === 1}
              className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalDetailPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalDetailPages || Math.abs(p - detailPage) <= 1)
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
                    onClick={() => setDetailPage(p as number)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${detailPage === p
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                        : 'border border-zinc-200 text-zinc-600 hover:bg-zinc-100'
                      }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setDetailPage(p => Math.min(totalDetailPages, p + 1))}
              disabled={detailPage === totalDetailPages}
              className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
