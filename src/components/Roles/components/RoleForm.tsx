'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Save, 
  ArrowLeft, 
  Shield, 
  CheckCircle2, 
  Circle,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiRole, ApiPermission, RoleFormData, RoleSchema } from '../types';
import { RoleService } from '../services/role.service';

interface RoleFormProps {
  initialData?: ApiRole;
  isEditing?: boolean;
}

// Group permissions by their code prefix (e.g. "CREATE_USERS" → "Users")
function getCategory(code: string): string {
  const lower = code.toLowerCase();
  if (lower.includes('user')) return 'Usuarios';
  if (lower.includes('role')) return 'Roles';
  if (lower.includes('compan') || lower.includes('empresa')) return 'Empresas';
  if (lower.includes('headquarter') || lower.includes('sede')) return 'Sedes';
  if (lower.includes('report')) return 'Reportes';
  return 'Sistema';
}

export const RoleForm: React.FC<RoleFormProps> = ({ initialData, isEditing = false }) => {
  const router = useRouter();
  const [allPermissions, setAllPermissions] = useState<ApiPermission[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialData?.permissions?.map((p) => p.id) ?? []
  );
  const [loadingPerms, setLoadingPerms] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RoleFormData>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      permissionIds: initialData?.permissions?.map((p) => p.id) ?? [],
    },
  });

  // Load all permissions from API
  useEffect(() => {
    RoleService.getPermissions()
      .then((perms) => setAllPermissions(perms))
      .catch(() => toast.error('No se pudieron cargar los permisos'))
      .finally(() => setLoadingPerms(false));
  }, []);

  const togglePermission = (id: string) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((p) => p !== id)
      : [...selectedIds, id];

    setSelectedIds(updated);
    setValue('permissionIds', updated, { shouldValidate: true });
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await RoleService.updateRole(initialData.id, data);
        toast.success('Rol actualizado');
      } else {
        await RoleService.createRole(data);
        toast.success('Rol creado');
      }
      router.push('/roles');
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      toast.error(msg);
    }
  };

  // Group permissions by category
  const categories = Array.from(new Set(allPermissions.map((p) => getCategory(p.code))));

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-6 border-b border-zinc-50 flex items-center gap-3 bg-zinc-50/50">
            <Shield className="text-zinc-900" size={20} />
            <h2 className="font-bold text-zinc-900">Configuración del Rol</h2>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Nombre del Rol</label>
                <input
                  {...register('name')}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Ej. Auditor Senior"
                />
                {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
              </div>

              {/* Descripción */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Descripción</label>
                <input
                  {...register('description')}
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="Finalidad de este rol..."
                />
                {errors.description && <p className="text-xs text-red-500 font-medium">{errors.description.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-6 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900">Matriz de Permisos</h3>
            {errors.permissionIds && (
              <p className="text-xs text-red-500 font-bold">{errors.permissionIds.message}</p>
            )}
          </div>

          {loadingPerms ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : allPermissions.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 text-sm">
              No hay permisos registrados en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Módulo / Permiso</th>
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Código</th>
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Descripción</th>
                    <th className="px-8 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {categories.map((category) => (
                    <React.Fragment key={category}>
                      <tr className="bg-zinc-50/30">
                        <td colSpan={4} className="px-8 py-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                          {category}
                        </td>
                      </tr>
                      {allPermissions.filter((p) => getCategory(p.code) === category).map((perm) => (
                        <tr
                          key={perm.id}
                          onClick={() => togglePermission(perm.id)}
                          className={`group cursor-pointer transition-colors ${
                            selectedIds.includes(perm.id) ? 'bg-blue-50/10' : 'hover:bg-zinc-50/50'
                          }`}
                        >
                          <td className="px-8 py-4">
                            <span className={`text-sm font-bold ${selectedIds.includes(perm.id) ? 'text-blue-900' : 'text-zinc-700'}`}>
                              {perm.name}
                            </span>
                          </td>
                          <td className="px-8 py-4">
                            <code className="text-xs bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">{perm.code}</code>
                          </td>
                          <td className="px-8 py-4">
                            <p className="text-xs text-zinc-500">{perm.description ?? '—'}</p>
                          </td>
                          <td className="px-8 py-4 text-center">
                            <div className={`inline-flex items-center justify-center ${selectedIds.includes(perm.id) ? 'text-blue-600' : 'text-zinc-300 group-hover:text-zinc-400'}`}>
                              {selectedIds.includes(perm.id) ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || loadingPerms}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : (
              <>
                <Save size={18} />
                {isEditing ? 'Actualizar Rol' : 'Crear Rol'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
