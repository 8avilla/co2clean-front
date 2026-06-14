'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit2, Trash2, Building2,
  ChevronLeft, ChevronRight, RefreshCw, X,
} from 'lucide-react';
import { ApiCompany } from '../types';
import { CompanyService } from '../services/company.service';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';

const PAGE_SIZE = 10;

// ── Mejora 2: Empty state rico con CTA y distinción ──
const CompanyEmptyState = ({
  hasSearch,
  onClear,
  canCreate,
}: {
  hasSearch: boolean;
  onClear: () => void;
  canCreate: boolean;
}) => (
  <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
      <Building2 className="text-teal-500" size={22} />
    </div>
    <div>
      <p className="font-semibold text-zinc-900 text-sm">
        {hasSearch ? 'Sin resultados' : 'Sin empresas registradas'}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {hasSearch
          ? 'Prueba con otro nombre o NIT.'
          : 'Agrega la primera empresa para comenzar.'}
      </p>
    </div>
    {hasSearch ? (
      <button
        onClick={onClear}
        className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
      >
        <X size={12} /> Limpiar búsqueda
      </button>
    ) : canCreate && (
      <Link
        href="/empresas/nueva"
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"
      >
        <Plus size={15} /> Nueva Empresa
      </Link>
    )}
  </div>
);

export const CompanyList = () => {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { hasPermission } = usePermission();

  // ── Mejora 12: useCallback para evitar warning exhaustive-deps ──
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const data = await CompanyService.getCompanies();
      setCompanies(data);
    } catch {
      toast.error('Error al cargar las empresas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta empresa y todas sus sedes?')) {
      try {
        await CompanyService.deleteCompany(id);
        toast.success('Empresa eliminada exitosamente');
        fetchCompanies();
      } catch (err) {
        // ── Mejora 12: error usado correctamente ──
        toast.error(err instanceof Error ? err.message : 'Error al eliminar la empresa');
      }
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nit.includes(searchTerm)
  );

  // ── Mejora 3: Totales para el subtitle dinámico ──
  const totalSedes = companies.reduce((sum, c) => sum + (c.headquarters?.length ?? 0), 0);
  const hasActiveSearch = !!searchTerm;
  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
  const pagedCompanies = filteredCompanies.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Gestión de Empresas</h1>
          {/* ── Mejora 3: Subtitle dinámico ── */}
          <p className="text-sm text-zinc-500">
            {!loading && companies.length > 0
              ? `${companies.length} ${companies.length === 1 ? 'empresa' : 'empresas'} · ${totalSedes} ${totalSedes === 1 ? 'sede' : 'sedes'}`
              : 'Administra las compañías y sedes registradas en el sistema.'}
          </p>
        </div>
        {hasPermission(PermissionCode.CREATE_COMPANIES) && (
          <Link
            href="/empresas/nueva"
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nueva Empresa
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* ── Mejora 1: Buscador integrado en toolbar de la tabla ── */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o NIT..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm bg-white"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {/* ── Mejora 6: Botón de refresco manual ── */}
          <button
            onClick={() => fetchCompanies()}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            title="Recargar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Mobile card view */}
        <div className="md:hidden divide-y divide-zinc-100">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse space-y-2">
                <div className="h-4 bg-zinc-100 rounded w-2/3" />
                <div className="h-3 bg-zinc-100 rounded w-1/3" />
              </div>
            ))
          ) : pagedCompanies.length > 0 ? (
            pagedCompanies.map((company) => (
              <div key={company.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold overflow-hidden border border-teal-100/50 flex-shrink-0">
                    {company.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      company.name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 text-sm truncate">{company.name}</p>
                    <p className="text-xs text-zinc-500">NIT: {company.nit}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {(company.municipality?.name || company.department?.name) && (
                        <span className="text-xs text-zinc-500">
                          {company.municipality?.name ?? ''}{company.department?.name ? `, ${company.department.name}` : ''}
                        </span>
                      )}
                      {/* ── Mejora 5: Badge de sedes como link ── */}
                      <Link
                        href={`/empresas/${company.id}`}
                        className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                      >
                        {(company.headquarters ?? []).length} sedes
                      </Link>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasPermission(PermissionCode.UPDATE_COMPANIES) && (
                    <Link href={`/empresas/${company.id}`} className="p-2 text-zinc-400 hover:text-teal-600 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </Link>
                  )}
                  {hasPermission(PermissionCode.DELETE_COMPANIES) && (
                    <button onClick={() => handleDelete(company.id!)} className="p-2 text-zinc-400 hover:text-red-600 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <CompanyEmptyState
              hasSearch={hasActiveSearch}
              onClear={() => { setSearchTerm(''); setPage(1); }}
              canCreate={hasPermission(PermissionCode.CREATE_COMPANIES)}
            />
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">NIT</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Sedes</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-zinc-100 flex-shrink-0" />
                        <div className="h-4 bg-zinc-100 rounded w-32" />
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="h-3 bg-zinc-100 rounded w-24" /></td>
                    <td className="px-6 py-5"><div className="h-3 bg-zinc-100 rounded w-28" /></td>
                    <td className="px-6 py-5"><div className="h-3 bg-zinc-100 rounded w-36" /></td>
                    <td className="px-6 py-5"><div className="h-5 bg-zinc-100 rounded-lg w-12" /></td>
                    <td className="px-6 py-5" />
                  </tr>
                ))
              ) : pagedCompanies.length > 0 ? (
                pagedCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold overflow-hidden border border-teal-100/50 flex-shrink-0">
                          {company.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            company.name.charAt(0)
                          )}
                        </div>
                        <span className="font-bold text-zinc-900">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 font-medium">{company.nit}</td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {company.municipality?.name ?? '—'}{company.department?.name ? `, ${company.department.name}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">{company.email}</td>
                    <td className="px-6 py-4">
                      {/* ── Mejora 5: Badge de sedes como link ── */}
                      <Link
                        href={`/empresas/${company.id}`}
                        title="Ver y gestionar sedes"
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 transition-colors"
                      >
                        {(company.headquarters ?? []).length}{' '}
                        {(company.headquarters ?? []).length === 1 ? 'sede' : 'sedes'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* ── Mejora 4: Acciones hover-only ── */}
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasPermission(PermissionCode.UPDATE_COMPANIES) && (
                          <Link
                            href={`/empresas/${company.id}`}
                            className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Editar empresa"
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        {hasPermission(PermissionCode.DELETE_COMPANIES) && (
                          <button
                            onClick={() => handleDelete(company.id!)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar empresa"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <CompanyEmptyState
                      hasSearch={hasActiveSearch}
                      onClear={() => { setSearchTerm(''); setPage(1); }}
                      canCreate={hasPermission(PermissionCode.CREATE_COMPANIES)}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mejora 6: Paginación ── */}
        {!loading && filteredCompanies.length > PAGE_SIZE && (
          <div className="p-4 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between text-sm">
            <span className="text-xs text-zinc-500">
              Página <span className="font-bold text-zinc-700">{page}</span> de{' '}
              <span className="font-bold text-zinc-700">{totalPages}</span>
              {' '}— {filteredCompanies.length} empresas
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
