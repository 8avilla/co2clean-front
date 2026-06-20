'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus, Search, Edit2, Trash2, User,
  SlidersHorizontal, X, RefreshCw,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { ApiUser } from '../types';
import { UserService } from '../services/user.service';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';

const PAGE_SIZE = 10;

// ── Mejora 3: Iniciales + color derivado del nombre ──
const getInitials = (name: string) =>
  name.trim().split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
];

const getAvatarColor = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const getRoleBadgeColor = (role?: string) => {
  if (!role) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  const r = role.toUpperCase();
  if (r.includes('ADMIN')) return 'bg-red-100 text-red-700 border-red-200';
  if (r.includes('MANAGER') || r.includes('GERENTE')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (r.includes('AUDITOR')) return 'bg-amber-100 text-amber-700 border-amber-200';
  if (r.includes('DATA') || r.includes('CARGA')) return 'bg-teal-100 text-teal-700 border-teal-200';
  return 'bg-zinc-100 text-zinc-700 border-zinc-200';
};

// ── Mejora 4: Empty state rico ──
const UserEmptyState = ({
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
      <User className="text-teal-500" size={22} />
    </div>
    <div>
      <p className="font-semibold text-zinc-900 text-sm">
        {hasSearch ? 'Sin resultados' : 'Sin usuarios registrados'}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {hasSearch
          ? 'Prueba con otro nombre, correo o ajusta los filtros.'
          : 'Agrega el primer usuario para comenzar.'}
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
        href="/usuarios/nuevo"
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"
      >
        <Plus size={15} /> Nuevo Usuario
      </Link>
    )}
  </div>
);

function getActiveCompanyId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { company?: { id: string } | null };
    return parsed.company?.id ?? null;
  } catch {
    return null;
  }
}

export const UserList = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const { hasPermission } = usePermission();

  const [showFilters, setShowFilters] = useState(false);
  const [filterRol, setFilterRol] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const companyId = getActiveCompanyId() ?? undefined;
      const data = await UserService.getUsers(undefined, undefined, companyId);
      setUsers(data);
    } catch {
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await UserService.deleteUser(id);
        toast.success('Usuario eliminado');
        fetchUsers();
      } catch (err) {
        // ── Mejora 8: error usado correctamente ──
        toast.error(err instanceof Error ? err.message : 'Error al eliminar el usuario');
      }
    }
  };

  const uniqueRoles = [...new Set(users.map(u => u.role?.name).filter(Boolean))].sort() as string[];

  const activeFiltersCount = [filterRol].filter(Boolean).length;
  const hasActiveSearch = !!searchTerm || activeFiltersCount > 0;

  const clearFilters = () => {
    setFilterRol('');
    setSearchTerm('');
    setPage(1);
  };

  const filteredUsers = users.filter(u => {
    const matchSearch =
      !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRol = !filterRol || u.role?.name === filterRol;
    return matchSearch && matchRol;
  });

  // ── Mejora 7: totales para subtitle ──
  const uniqueRolesCount = new Set(users.map(u => u.role?.name).filter(Boolean)).size;
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const pagedUsers = filteredUsers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Gestión de Usuarios</h1>
          {/* ── Mejora 7: Subtitle dinámico ── */}
          <p className="text-sm text-zinc-500">
            {!loading && users.length > 0
              ? `${users.length} ${users.length === 1 ? 'usuario' : 'usuarios'} · ${uniqueRolesCount} ${uniqueRolesCount === 1 ? 'rol' : 'roles'}`
              : 'Administra los accesos y roles de los integrantes de cada empresa.'}
          </p>
        </div>
        {/* ── Mejora 2: teal en lugar de zinc-900 ── */}
        {hasPermission(PermissionCode.CREATE_USERS) && (
          <Link
            href="/usuarios/nuevo"
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nuevo Usuario
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* ── Mejora 1: Buscador + filtros integrados en toolbar ── */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre o correo..."
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
            {/* ── Mejora 2: teal en filtros activos ── */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
                showFilters || activeFiltersCount > 0
                  ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-500/20'
                  : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-white text-teal-700 rounded-full text-xs font-black">
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
            {/* ── Mejora 7: Botón refresco ── */}
            <button
              onClick={() => fetchUsers()}
              disabled={loading}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-50"
              title="Recargar"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-1 max-w-xs">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rol</label>
                <select
                  value={filterRol}
                  onChange={e => { setFilterRol(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white"
                >
                  <option value="">Todos los roles</option>
                  {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Mobile card view */}
        <div className="md:hidden divide-y divide-zinc-100">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 animate-pulse space-y-2">
                <div className="h-4 bg-zinc-100 rounded w-2/3" />
                <div className="h-3 bg-zinc-100 rounded w-1/2" />
              </div>
            ))
          ) : pagedUsers.length > 0 ? (
            pagedUsers.map((user) => (
              <div key={user.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {/* ── Mejora 3: iniciales ── */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${getAvatarColor(user.name)}`}>
                    {getInitials(user.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-900 text-sm truncate">{user.name}</p>
                    <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    <div className="mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role?.name)}`}>
                        {user.role?.name ?? '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasPermission(PermissionCode.UPDATE_USERS) && (
                    <Link href={`/usuarios/${user.id}`} className="p-2 text-zinc-400 hover:text-teal-600 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </Link>
                  )}
                  {hasPermission(PermissionCode.DELETE_USERS) && (
                    <button onClick={() => handleDelete(user.id!)} className="p-2 text-zinc-400 hover:text-red-600 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <UserEmptyState
              hasSearch={hasActiveSearch}
              onClear={clearFilters}
              canCreate={hasPermission(PermissionCode.CREATE_USERS)}
            />
          )}
        </div>

        {/* Desktop table view */}
        {/* ── Mejora 5: "Estado" eliminado (campo inexistente en API) — 4 columnas ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-100 flex-shrink-0" />
                        <div className="space-y-1.5">
                          <div className="h-4 bg-zinc-100 rounded w-28" />
                          <div className="h-3 bg-zinc-100 rounded w-40" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="h-5 bg-zinc-100 rounded-full w-16" /></td>
                    <td className="px-6 py-5" />
                  </tr>
                ))
              ) : pagedUsers.length > 0 ? (
                pagedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* ── Mejora 3: iniciales en desktop ── */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-all ${getAvatarColor(user.name)}`}>
                          {getInitials(user.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900">{user.name}</span>
                          <span className="text-xs text-zinc-500">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role?.name)}`}>
                        {user.role?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* ── Mejora 6: acciones hover-only ── */}
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasPermission(PermissionCode.UPDATE_USERS) && (
                          <Link
                            href={`/usuarios/${user.id}`}
                            className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        {hasPermission(PermissionCode.DELETE_USERS) && (
                          <button
                            onClick={() => handleDelete(user.id!)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar usuario"
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
                  <td colSpan={3}>
                    <UserEmptyState
                      hasSearch={hasActiveSearch}
                      onClear={clearFilters}
                      canCreate={hasPermission(PermissionCode.CREATE_USERS)}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && filteredUsers.length > PAGE_SIZE && (
          <div className="p-4 border-t border-zinc-100 bg-zinc-50/30 flex items-center justify-between text-sm">
            <span className="text-xs text-zinc-500">
              Página <span className="font-bold text-zinc-700">{page}</span> de{' '}
              <span className="font-bold text-zinc-700">{totalPages}</span>
              {' '}— {filteredUsers.length} usuarios
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
