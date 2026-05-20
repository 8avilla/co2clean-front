'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User, 
  Building2,
  Mail,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { ApiUser } from '../types';
import { UserService } from '../services/user.service';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';

export const UserList = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasPermission } = usePermission();

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterRol, setFilterRol] = useState('');
  const [filterEmpresa, setFilterEmpresa] = useState('');

  const fetchUsers = async () => {
    try {
      const data = await UserService.getUsers();
      setUsers(data);
    } catch (error) {
      toast.error('Error al cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      try {
        await UserService.deleteUser(id);
        toast.success('Usuario eliminado');
        fetchUsers();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  // Unique values for filter dropdowns
  const uniqueRoles = [...new Set(users.map(u => u.role?.name).filter(Boolean))].sort() as string[];
  const uniqueEmpresas = [...new Set(users.map(u => u.company?.name).filter(Boolean))].sort() as string[];

  const activeFiltersCount = [filterRol, filterEmpresa].filter(Boolean).length;

  const clearFilters = () => {
    setFilterRol('');
    setFilterEmpresa('');
    setSearchTerm('');
  };

  const filteredUsers = users.filter(u => {
    const matchSearch =
      !searchTerm ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchRol = !filterRol || u.role?.name === filterRol;
    const matchEmpresa = !filterEmpresa || u.company?.name === filterEmpresa;

    return matchSearch && matchRol && matchEmpresa;
  });

  const getRoleBadgeColor = (role?: string) => {
    if (!role) return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    const r = role.toUpperCase();
    if (r.includes('ADMIN')) return 'bg-red-100 text-red-700 border-red-200';
    if (r.includes('MANAGER') || r.includes('GERENTE')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (r.includes('AUDITOR')) return 'bg-amber-100 text-amber-700 border-amber-200';
    if (r.includes('DATA') || r.includes('CARGA')) return 'bg-teal-100 text-teal-700 border-teal-200';
    return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Gestión de Usuarios</h1>
          <p className="text-sm text-zinc-500">Administra los accesos y roles de los integrantes de cada empresa.</p>
        </div>
        {hasPermission(PermissionCode.CREATE_USERS) && (
          <Link
            href="/usuarios/nuevo"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nuevo Usuario
          </Link>
        )}
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex flex-col gap-3">
        {/* Search + toggle row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-950/20 focus:border-zinc-950 transition-all text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold border transition-all whitespace-nowrap ${
              showFilters || activeFiltersCount > 0
                ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
            }`}
          >
            <SlidersHorizontal size={16} />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 flex items-center justify-center bg-white text-zinc-900 rounded-full text-xs font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 border border-red-100 transition-colors"
              title="Limpiar filtros"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter dropdowns panel */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-100 animate-in fade-in slide-in-from-top-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Rol</label>
              <select
                value={filterRol}
                onChange={e => setFilterRol(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 outline-none bg-white"
              >
                <option value="">Todos los roles</option>
                {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Empresa</label>
              <select
                value={filterEmpresa}
                onChange={e => setFilterEmpresa(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-zinc-900/20 focus:border-zinc-900 outline-none bg-white"
              >
                <option value="">Todas las empresas</option>
                {uniqueEmpresas.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-8"><div className="h-4 bg-zinc-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                          <User size={20} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900">{user.name}</span>
                          <span className="text-xs text-zinc-500 flex items-center gap-1">
                            <Mail size={12} /> {user.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-600">
                        <Building2 size={16} className="text-zinc-400" />
                        {user.company?.name ?? '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role?.name)}`}>
                        {user.role?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-sm text-zinc-600 capitalize">Activo</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission(PermissionCode.UPDATE_USERS) && (
                          <Link
                            href={`/usuarios/${user.id}`}
                            className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        {hasPermission(PermissionCode.DELETE_USERS) && (
                          <button
                            onClick={() => handleDelete(user.id!)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
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
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
