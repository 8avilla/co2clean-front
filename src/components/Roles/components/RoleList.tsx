'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  ShieldCheck,
  Edit2,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { ApiPermission, ApiRole } from '../types';
import { RoleService } from '../services/role.service';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';

// ── Mejora 4: categorías derivadas de los códigos de permiso ──
function getCategory(code: string): string {
  const lower = code.toLowerCase();
  if (lower.includes('user')) return 'Usuarios';
  if (lower.includes('role')) return 'Roles';
  if (lower.includes('compan') || lower.includes('empresa')) return 'Empresas';
  if (lower.includes('headquarter') || lower.includes('sede')) return 'Sedes';
  if (lower.includes('report')) return 'Reportes';
  if (lower.includes('carbon') || lower.includes('footprint') || lower.includes('emission')) return 'Huella de Carbono';
  return 'Sistema';
}

const CATEGORY_COLORS: Record<string, string> = {
  'Usuarios': 'bg-blue-50 text-blue-700 border-blue-200',
  'Roles': 'bg-violet-50 text-violet-700 border-violet-200',
  'Empresas': 'bg-amber-50 text-amber-700 border-amber-200',
  'Sedes': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Reportes': 'bg-rose-50 text-rose-700 border-rose-200',
  'Huella de Carbono': 'bg-teal-50 text-teal-700 border-teal-200',
  'Sistema': 'bg-zinc-50 text-zinc-600 border-zinc-200',
};

const getRoleModules = (permissions: ApiPermission[] = []) =>
  [...new Set(permissions.map(p => getCategory(p.code)))];

// ── Mejora 5: empty state rico ──
const RoleEmptyState = ({ canCreate }: { canCreate: boolean }) => (
  <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
      <ShieldCheck className="text-teal-500" size={22} />
    </div>
    <div>
      <p className="font-semibold text-zinc-900 text-sm">Sin roles registrados</p>
      <p className="text-xs text-zinc-400 mt-1">
        Define los roles del sistema para controlar los accesos de cada usuario.
      </p>
    </div>
    {canCreate && (
      <Link
        href="/roles/nuevo"
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors"
      >
        <Plus size={15} /> Crear primer rol
      </Link>
    )}
  </div>
);

export const RoleList = () => {
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = usePermission();

  // ── Mejora 6: useCallback para exhaustive-deps ──
  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await RoleService.getRoles();
      setRoles(data);
    } catch {
      toast.error('Error al cargar los roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este rol? Esta acción podría afectar a los usuarios asociados.')) {
      try {
        await RoleService.deleteRole(id);
        toast.success('Rol eliminado');
        fetchRoles();
      } catch (err) {
        // ── Mejora 6: error tipado correctamente ──
        toast.error(err instanceof Error ? err.message : 'Error al eliminar el rol');
      }
    }
  };

  // ── Mejora 3: totales dinámicos ──
  const totalPermissions = roles.reduce((sum, r) => sum + (r.permissions?.length ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Roles y Permisos</h1>
          {/* ── Mejora 3: subtítulo dinámico ── */}
          <p className="text-sm text-zinc-500">
            {!loading && roles.length > 0
              ? `${roles.length} ${roles.length === 1 ? 'rol' : 'roles'} · ${totalPermissions} permisos configurados`
              : 'Define qué acciones pueden realizar los usuarios en la plataforma.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* ── Mejora 3: botón refresh ── */}
          <button
            onClick={() => fetchRoles()}
            disabled={loading}
            className="p-2 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            title="Recargar"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
          {/* ── Mejora 1: teal en lugar de zinc-900 ── */}
          {hasPermission(PermissionCode.MANAGE_ROLES) && (
            <Link
              href="/roles/nuevo"
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-sm active:scale-95"
            >
              <Plus size={18} />
              Nuevo Rol
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Descripción</th>
                {/* ── Mejora 4: "Módulos con acceso" en vez de "Permisos" ── */}
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Módulos con acceso</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 flex-shrink-0" />
                        <div className="h-4 bg-zinc-100 rounded w-28" />
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="h-3 bg-zinc-100 rounded w-48" /></td>
                    <td className="px-6 py-5"><div className="h-5 bg-zinc-100 rounded-full w-36" /></td>
                    <td className="px-6 py-5" />
                  </tr>
                ))
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    {/* ── Mejora 5: empty state rico ── */}
                    <RoleEmptyState canCreate={hasPermission(PermissionCode.MANAGE_ROLES)} />
                  </td>
                </tr>
              ) : roles.map((role) => {
                const modules = getRoleModules(role.permissions);
                return (
                  <tr key={role.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck size={20} />
                        </div>
                        <span className="font-bold text-zinc-900">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-zinc-500 max-w-md truncate">{role.description ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {/* ── Mejora 4: badges de módulo ── */}
                      {modules.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {modules.map(mod => (
                            <span
                              key={mod}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[mod] ?? CATEGORY_COLORS['Sistema']}`}
                            >
                              {mod}
                            </span>
                          ))}
                          <span className="text-xs text-zinc-400 ml-1">
                            ({role.permissions?.length ?? 0})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400 italic">Sin permisos asignados</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* ── Mejora 2: acciones hover-only ── */}
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {hasPermission(PermissionCode.MANAGE_ROLES) && (
                          <>
                            <Link
                              href={`/roles/${role.id}`}
                              className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="Configurar Permisos"
                            >
                              <Edit2 size={16} />
                            </Link>
                            <button
                              onClick={() => handleDelete(role.id!)}
                              className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar Rol"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
