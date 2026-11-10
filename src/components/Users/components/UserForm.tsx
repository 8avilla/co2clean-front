"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  User as UserIcon,
  Building2,
  Shield,
  Mail,
  Lock,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiUser, UserFormData, UserSchema } from "../types";
import { UserService } from "../services/user.service";
import { CompanyService } from "@/components/Companies/services/company.service";
import { ApiCompany } from "@/components/Companies/types";
import { RoleService } from "@/components/Roles/services/role.service";
import { ApiRole } from "@/components/Roles/types";
import { FormActionsBar } from "@/shared/components/Common/FormActionsBar";
import {
  FORM_WIDTH,
  formInputClass,
  FORM_LABEL_CLASS,
} from "@/shared/components/Common/form-styles";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";

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

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UserFormData>({
    resolver: zodResolver(UserSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      email: initialData?.email ?? "",
      password: "",
      isAdmin: initialData?.isSuperAdmin ?? false,
      roleId: initialData?.roleId ?? initialData?.role?.id ?? "",
      companyId: initialData?.companyId ?? initialData?.company?.id ?? "",
    },
  });

  const isSuperAdmin = watch("isAdmin");

  // Load companies and roles only once on mount
  useEffect(() => {
    Promise.all([CompanyService.getCompanies(), RoleService.getRoles()])
      .then(([companiesData, rolesData]) => {
        setCompanies(companiesData);
        setRoles(rolesData);
      })
      .catch(() => toast.error("Error al cargar datos"))
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await UserService.updateUser(initialData.id, data);
        toast.success("Usuario actualizado");
      } else {
        await UserService.createUser(data);
        toast.success("Usuario creado exitosamente");
      }
      router.push("/usuarios");
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al guardar";
      toast.error(msg);
    }
  };

  const { confirmLeave } = useUnsavedChangesGuard(isDirty);

  const handleLeave = async () => {
    if (await confirmLeave()) router.back();
  };

  return (
    <div className={`${FORM_WIDTH.standard} mx-auto space-y-4`}>
      {/* ── Mejora 9: Header con título contextual ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handleLeave}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
        <div className="text-right">
          <h1 className="text-xl font-bold text-zinc-900">
            {isEditing
              ? `Editando: ${initialData?.name ?? "Usuario"}`
              : "Nuevo usuario"}
          </h1>
          <p className="text-xs text-zinc-400">
            {isEditing
              ? initialData?.email
              : "Completa los datos para crear la cuenta"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
            <UserIcon className="text-teal-600" size={16} />
            <h2 className="font-bold text-zinc-900 text-sm">
              Perfil de Usuario
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="animate-spin text-zinc-400" size={32} />
              </div>
            ) : (
              <>
                {/* Nombre */}
                <div className="space-y-1">
                  <label htmlFor="user-name" className={FORM_LABEL_CLASS}>
                    Nombre Completo
                  </label>
                  <input
                    id="user-name"
                    {...register("name")}
                    className={formInputClass("teal")}
                    placeholder="Ej. Juan Pérez"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="user-email" className={FORM_LABEL_CLASS}>
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-2.5 text-zinc-400"
                      size={15}
                    />
                    <input
                      id="user-email"
                      type="email"
                      {...register("email")}
                      className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                      placeholder="usuario@dominio.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 font-medium">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* ── Mejora 10: Password con toggle + hint ── */}
                {!isEditing && (
                  <div className="space-y-1">
                    <label htmlFor="user-password" className={FORM_LABEL_CLASS}>
                      Contraseña
                    </label>
                    <div className="relative">
                      <Lock
                        className="absolute left-3 top-2.5 text-zinc-400"
                        size={15}
                      />
                      <input
                        id="user-password"
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-10 pr-11 py-2 text-sm rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                        placeholder="Mínimo 6 caracteres"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-2 text-zinc-400 hover:text-zinc-600 transition-colors p-0.5"
                        tabIndex={-1}
                        aria-label={
                          showPassword
                            ? "Ocultar contraseña"
                            : "Mostrar contraseña"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                      <Info size={12} className="flex-shrink-0" />
                      Mínimo 6 caracteres. El usuario podrá cambiarla luego.
                    </p>
                    {errors.password && (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Super Administrador */}
                <label className="flex items-center gap-3 w-fit cursor-pointer select-none group">
                  <div className="relative">
                    <input
                      {...register("isAdmin")}
                      type="checkbox"
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                        isSuperAdmin
                          ? "bg-teal-600 border-teal-600"
                          : "border-zinc-300 group-hover:border-teal-400"
                      }`}
                    >
                      {isSuperAdmin && (
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 12 12"
                          fill="none"
                        >
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-xs font-bold text-zinc-600 group-hover:text-zinc-900 transition-colors">
                    <ShieldCheck
                      size={16}
                      className={
                        isSuperAdmin ? "text-teal-600" : "text-zinc-400"
                      }
                    />
                    Super Administrador
                  </span>
                </label>

                {/* ── Mejora 12: Mensaje cuando SuperAdmin oculta sección ── */}
                {isSuperAdmin && (
                  <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                    <ShieldCheck
                      size={16}
                      className="text-teal-600 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-xs font-bold text-teal-800">
                        Acceso global activado
                      </p>
                      <p className="text-xs text-teal-700 mt-0.5">
                        Los Super Administradores tienen acceso a todas las
                        empresas del sistema sin necesidad de asociación
                        individual.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Empresa principal */}
                  <div className="space-y-1">
                    <label
                      htmlFor="user-company"
                      className={`${FORM_LABEL_CLASS} flex items-center gap-2`}
                    >
                      <Building2 size={14} /> Empresa Principal
                    </label>
                    <select
                      id="user-company"
                      {...register("companyId")}
                      className={`${formInputClass("teal")} appearance-none`}
                    >
                      <option value="">Ninguna (Administrador Global)</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                    {errors.companyId && (
                      <p className="text-xs text-red-500 font-medium">
                        {errors.companyId.message}
                      </p>
                    )}
                  </div>

                  {/* Rol principal — oculto cuando el usuario es Super Administrador */}
                  {!isSuperAdmin && (
                    <div className="space-y-1">
                      <label
                        htmlFor="user-role"
                        className={`${FORM_LABEL_CLASS} flex items-center gap-2`}
                      >
                        <Shield size={14} /> Rol Principal
                      </label>
                      <select
                        id="user-role"
                        {...register("roleId")}
                        className={`${formInputClass("teal")} appearance-none`}
                      >
                        <option value="">Seleccione rol...</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      {errors.roleId && (
                        <p className="text-xs text-red-500 font-medium">
                          {errors.roleId.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Mejora 2: botones teal ── */}
        <FormActionsBar
          onCancel={handleLeave}
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          isSubmitDisabled={loading}
          submitLabel={isEditing ? "Guardar cambios" : "Crear usuario"}
        />
      </form>
    </div>
  );
};
