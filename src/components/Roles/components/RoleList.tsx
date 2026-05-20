'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  ShieldCheck, 
  Edit2, 
  Trash2
} from 'lucide-react';
import { ApiRole } from '../types';
import { RoleService } from '../services/role.service';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';

export const RoleList = () => {
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermission();

  const fetchRoles = async () => {
    try {
      const data = await RoleService.getRoles();
      setRoles(data);
    } catch (error) {
      toast.error('Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este rol? Esta acción podría afectar a los usuarios asociados.')) {
      try {
        await RoleService.deleteRole(id);
        toast.success('Rol eliminado');
        fetchRoles();
      } catch (error) {
        toast.error('Error al eliminar');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Roles y Permisos</h1>
          <p className="text-sm text-zinc-500">Define qué acciones pueden realizar los usuarios en la plataforma.</p>
        </div>
        {hasPermission(PermissionCode.MANAGE_ROLES) && (
          <Link
            href="/roles/nuevo"
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nuevo Rol
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Permisos</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={4} className="px-6 py-8"><div className="h-4 bg-zinc-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                    No hay roles registrados.
                  </td>
                </tr>
              ) : roles.map((role) => (
                <tr key={role.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <ShieldCheck size={20} />
                      </div>
                      <span className="font-bold text-zinc-900">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-zinc-500 max-w-md truncate">{role.description ?? '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200">
                        {(role.permissions || []).length}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">asignados</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {hasPermission(PermissionCode.MANAGE_ROLES) && (
                        <>
                          <Link
                            href={`/roles/${role.id}`}
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                            title="Configurar Permisos"
                          >
                            <Edit2 size={16} />
                          </Link>
                          <button
                            onClick={() => handleDelete(role.id!)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                            title="Eliminar Rol"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
