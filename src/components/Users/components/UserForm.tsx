'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Save,
  ArrowLeft,
  User as UserIcon,
  Building2,
  Shield,
  Mail,
  Lock,
  Loader2,
  Trash2,
  Plus,
  ShieldCheck,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiUser, UserFormData, UserSchema, ApiUserCompany } from '../types';
import { UserService } from '../services/user.service';
import { CompanyService } from '@/components/Companies/services/company.service';
import { ApiCompany } from '@/components/Companies/types';
import { RoleService } from '@/components/Roles/services/role.service';
import { ApiRole } from '@/components/Roles/types';

interface UserFormProps {
  initialData?: ApiUser;
  isEditing?: boolean;
}

export const UserForm = ({ initialData, isEditing = false }: UserFormProps) => {
  const router = useRouter();
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);
  // ── Mejora 10: toggle contraseña ──
  const [showPassword, setShowPassword] = useState(false);

  const [userCompanies, setUserCompanies] = useState<ApiUserCompany[]>([]);
  const [assocCompanyId, setAssocCompanyId] = useState('');
  const [assocRoleId, setAssocRoleId] = useState('');
  const [isAssociating, setIsAssociating] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      email: initialData?.email ?? '',
      password: '',
      isAdmin: initialData?.isSuperAdmin ?? false,
      roleId: initialData?.roleId ?? initialData?.role?.id ?? '',
      companyId: initialData?.companyId ?? initialData?.company?.id ?? '',
    },
  });

  const isSuperAdmin = watch('isAdmin');

  // ── Mejora 8: useCallback para exhaustive-deps ──
  const loadUserCompanies = useCallback(async () => {
    if (isEditing && initialData?.id) {
      setLoadingCompanies(true);
      try {
        const data = await UserService.getUserCompanies(initialData.id);
        setUserCompanies(data);
      } catch {
        toast.error('Error al cargar empresas asociadas');
      } finally {
        setLoadingCompanies(false);
      }
    }
  }, [isEditing, initialData?.id]);

  // Load companies and roles only once on mount
  useEffect(() => {
    Promise.all([
      CompanyService.getCompanies(),
      RoleService.getRoles(),
    ])
      .then(([companiesData, rolesData]) => {
        setCompanies(companiesData);
        setRoles(rolesData);
      })
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUserCompanies();
  }, [loadUserCompanies]);

  // ── Mejora 11: catch sin `any` ──
  const handleAssociate = async () => {
    if (!initialData?.id || !assocCompanyId || !assocRoleId) {
      toast.error('Por favor seleccione una empresa y un rol');
      return;
    }
    setIsAssociating(true);
    try {
      await UserService.associateCompany(initialData.id, assocCompanyId, assocRoleId);
      toast.success('Empresa asociada exitosamente');
      setAssocCompanyId('');
      setAssocRoleId('');
      loadUserCompanies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al asociar empresa');
    } finally {
      setIsAssociating(false);
    }
  };

  // ── Mejora 11: catch sin `any` ──
  const handleDisassociate = async (companyId: string) => {
    if (!initialData?.id) return;
    if (confirm('¿Está seguro de desasociar esta empresa del usuario?')) {
      try {
        await UserService.disassociateCompany(initialData.id, companyId);
        toast.success('Empresa desasociada exitosamente');
        loadUserCompanies();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al desasociar empresa');
      }
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await UserService.updateUser(initialData.id, data);
        toast.success('Usuario actualizado');
      } else {
        await UserService.createUser(data);
        toast.success('Usuario creado exitosamente');
      }
      router.push('/usuarios');
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar';
      toast.error(msg);
    }
  };

  const availableCompanies = companies.filter(
    c => !userCompanies.some(uc => uc.companyId === c.id)
  );

  return (
    <div className="space-y-6 w-full">
      {/* ── Mejora 9: Header con título contextual ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
        <div className="text-right">
          <h1 className="text-xl font-bold text-zinc-900">
            {isEditing ? `Editando: ${initialData?.name ?? 'Usuario'}` : 'Nuevo Usuario'}
          </h1>
          <p className="text-xs text-zinc-400">
            {isEditing ? initialData?.email : 'Completa los datos para crear la cuenta'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-6 border-b border-zinc-50 flex items-center gap-3 bg-zinc-50/50">
            <UserIcon className="text-teal-600" size={20} />
            <h2 className="font-bold text-zinc-900">Perfil de Usuario</h2>
          </div>

          <div className="p-8 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-zinc-400" size={32} />
              </div>
            ) : (
              <>
                {/* Nombre */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Nombre Completo</label>
                  <input
                    {...register('name')}
                    className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                    placeholder="Ej. Juan Pérez"
                  />
                  {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-zinc-400" size={16} />
                    <input
                      {...register('email')}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                      placeholder="usuario@dominio.com"
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
                </div>

                {/* ── Mejora 10: Password con toggle + hint ── */}
                {!isEditing && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700">Contraseña</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-zinc-400" size={16} />
                      <input
                        {...register('password')}
                        type={showPassword ? 'text' : 'password'}
                        className="w-full pl-10 pr-11 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-600 transition-colors p-0.5"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Info size={12} className="flex-shrink-0" />
                      Mínimo 6 caracteres. El usuario podrá cambiarla luego.
                    </p>
                    {errors.password && <p className="text-xs text-red-500 font-medium">{errors.password.message}</p>}
                  </div>
                )}

                {/* Super Administrador */}
                <label className="flex items-center gap-3 w-fit cursor-pointer select-none group">
                  <div className="relative">
                    <input
                      {...register('isAdmin')}
                      type="checkbox"
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                      isSuperAdmin ? 'bg-teal-600 border-teal-600' : 'border-zinc-300 group-hover:border-teal-400'
                    }`}>
                      {isSuperAdmin && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-sm font-semibold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                    <ShieldCheck size={16} className={isSuperAdmin ? 'text-teal-600' : 'text-zinc-400'} />
                    Super Administrador
                  </span>
                </label>

                {/* ── Mejora 12: Mensaje cuando SuperAdmin oculta sección ── */}
                {isSuperAdmin && (
                  <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3.5">
                    <ShieldCheck size={16} className="text-teal-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-teal-800">Acceso global activado</p>
                      <p className="text-xs text-teal-700 mt-0.5">
                        Los Super Administradores tienen acceso a todas las empresas del sistema sin necesidad de asociación individual.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Empresa principal */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                      <Building2 size={16} /> Empresa Principal
                    </label>
                    <select
                      {...register('companyId')}
                      className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none bg-white"
                    >
                      <option value="">Ninguna (Administrador Global)</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                      ))}
                    </select>
                    {errors.companyId && <p className="text-xs text-red-500 font-medium">{errors.companyId.message}</p>}
                  </div>

                  {/* Rol principal — oculto cuando el usuario es Super Administrador */}
                  {!isSuperAdmin && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                        <Shield size={16} /> Rol Principal
                      </label>
                      <select
                        {...register('roleId')}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none bg-white"
                      >
                        <option value="">Seleccione rol...</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                      {errors.roleId && <p className="text-xs text-red-500 font-medium">{errors.roleId.message}</p>}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Mejora 2: botones teal ── */}
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
            disabled={isSubmitting || loading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={18} />
                {isEditing ? 'Actualizar Usuario' : 'Crear Usuario'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* ── Empresas y Roles Asociados ── */}
      {isEditing && initialData?.id && !isSuperAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-6 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <Building2 className="text-teal-600" size={20} />
              <div>
                <h2 className="font-bold text-zinc-900">Empresas y Roles Asociados</h2>
                <p className="text-xs text-zinc-500">Asocie este usuario a múltiples empresas con diferentes permisos.</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {/* Formulario de asociación */}
            <div className="bg-zinc-50 border border-zinc-200 p-6 rounded-2xl">
              <h3 className="text-sm font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <Plus size={16} className="text-teal-600" /> Asociar nueva empresa
              </h3>
              <div className="flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Empresa</label>
                  <select
                    value={assocCompanyId}
                    onChange={(e) => setAssocCompanyId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none bg-white text-sm"
                  >
                    <option value="">Seleccione empresa...</option>
                    {availableCompanies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Rol en esta Empresa</label>
                  <select
                    value={assocRoleId}
                    onChange={(e) => setAssocRoleId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none bg-white text-sm"
                  >
                    <option value="">Seleccione rol...</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* ── Mejora 2: botón teal ── */}
                <button
                  type="button"
                  onClick={handleAssociate}
                  disabled={isAssociating || !assocCompanyId || !assocRoleId}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50 h-[42px] justify-center w-full md:w-auto"
                >
                  {isAssociating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Asociar
                </button>
              </div>
            </div>

            {/* Tabla de asociaciones */}
            {loadingCompanies ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-zinc-400" size={32} />
              </div>
            ) : userCompanies.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-zinc-200 rounded-2xl">
                <Building2 className="mx-auto text-zinc-300 mb-2" size={32} />
                <p className="text-sm font-semibold text-zinc-500">Sin empresas asociadas</p>
                <p className="text-xs text-zinc-400 mt-1">Usa el formulario de arriba para asociar una empresa a este usuario.</p>
              </div>
            ) : (
              <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-200">
                        <th className="p-4 font-bold text-zinc-700">Empresa</th>
                        <th className="p-4 font-bold text-zinc-700">NIT</th>
                        <th className="p-4 font-bold text-zinc-700">Rol Asignado</th>
                        <th className="p-4 font-bold text-zinc-700 text-center w-24">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {userCompanies.map((uc) => (
                        <tr key={uc.id} className="hover:bg-zinc-50/50 transition-colors group">
                          <td className="p-4">
                            <span className="font-bold text-zinc-950 text-sm">{uc.company?.name ?? 'Empresa desconocida'}</span>
                          </td>
                          <td className="p-4 text-zinc-500 font-medium">
                            {uc.company?.nit ?? '—'}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                              {uc.role?.name ?? 'Rol desconocido'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleDisassociate(uc.companyId)}
                              className="text-zinc-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-flex opacity-0 group-hover:opacity-100"
                              title="Desasociar empresa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
