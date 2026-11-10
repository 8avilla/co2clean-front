"use client";

// ── Mejora 12: sin namespace React — imports nombrados ──
import { useState, useEffect, Fragment } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Shield, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiRole, ApiPermission, RoleFormData, RoleSchema } from "../types";
import { RoleService } from "../services/role.service";
import { FormActionsBar } from "@/shared/components/Common/FormActionsBar";
import {
  FORM_WIDTH,
  formInputClass,
  FORM_LABEL_CLASS,
} from "@/shared/components/Common/form-styles";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { getPermissionCategory } from "../utils/permission-categories";

interface RoleFormProps {
  initialData?: ApiRole;
  isEditing?: boolean;
}

// ── Mejora 12: función plain en vez de React.FC ──
export const RoleForm = ({ initialData, isEditing = false }: RoleFormProps) => {
  const router = useRouter();
  const [allPermissions, setAllPermissions] = useState<ApiPermission[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialData?.permissions?.map((p) => p.id) ?? [],
  );
  const [loadingPerms, setLoadingPerms] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RoleFormData>({
    resolver: zodResolver(RoleSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      description: initialData?.description ?? "",
      permissionIds: initialData?.permissions?.map((p) => p.id) ?? [],
    },
  });

  useEffect(() => {
    RoleService.getPermissions()
      .then((perms) => setAllPermissions(perms))
      .catch(() => toast.error("No se pudieron cargar los permisos"))
      .finally(() => setLoadingPerms(false));
  }, []);

  const togglePermission = (id: string) => {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((p) => p !== id)
      : [...selectedIds, id];
    setSelectedIds(updated);
    setValue("permissionIds", updated, { shouldValidate: true });
  };

  // ── Mejora 9: selección masiva por categoría ──
  const toggleCategory = (category: string) => {
    const categoryIds = allPermissions
      .filter((p) => getPermissionCategory(p.code) === category)
      .map((p) => p.id);
    const allSelected = categoryIds.every((id) => selectedIds.includes(id));
    const updated = allSelected
      ? selectedIds.filter((id) => !categoryIds.includes(id))
      : [...new Set([...selectedIds, ...categoryIds])];
    setSelectedIds(updated);
    setValue("permissionIds", updated, { shouldValidate: true });
  };

  // ── Mejora 9: selección global ──
  const selectAll = () => {
    const allIds = allPermissions.map((p) => p.id);
    setSelectedIds(allIds);
    setValue("permissionIds", allIds, { shouldValidate: true });
  };

  const deselectAll = () => {
    setSelectedIds([]);
    setValue("permissionIds", [], { shouldValidate: true });
  };

  const onSubmit = async (data: RoleFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await RoleService.updateRole(initialData.id, data);
        toast.success("Rol actualizado");
      } else {
        await RoleService.createRole(data);
        toast.success("Rol creado");
      }
      router.push("/roles");
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al guardar";
      toast.error(msg);
    }
  };

  const categories = Array.from(
    new Set(allPermissions.map((p) => getPermissionCategory(p.code))),
  );

  const { confirmLeave } = useUnsavedChangesGuard(isDirty);

  const handleLeave = async () => {
    if (await confirmLeave()) router.back();
  };

  return (
    <div className={`${FORM_WIDTH.wide} mx-auto space-y-4`}>
      {/* ── Mejora 7: header con título contextual ── */}
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
              ? `Editando: ${initialData?.name ?? "Rol"}`
              : "Nuevo rol"}
          </h1>
          <p className="text-xs text-zinc-400">
            {isEditing
              ? `${initialData?.permissions?.length ?? 0} permisos actualmente asignados`
              : "Define el nombre y los permisos del nuevo rol"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {/* ── Sección: datos del rol ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center gap-3 bg-zinc-50/50">
            {/* ── Mejora 8: color teal en icono ── */}
            <Shield className="text-teal-600" size={16} />
            <h2 className="font-bold text-zinc-900 text-sm">
              Configuración del Rol
            </h2>
          </div>

          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="space-y-1">
                <label htmlFor="role-name" className={FORM_LABEL_CLASS}>
                  Nombre del Rol
                </label>
                <input
                  id="role-name"
                  {...register("name")}
                  // ── Mejora 8: focus ring teal ──
                  className={formInputClass("teal")}
                  placeholder="Ej. Auditor Senior"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div className="space-y-1">
                <label htmlFor="role-description" className={FORM_LABEL_CLASS}>
                  Descripción
                </label>
                <input
                  id="role-description"
                  {...register("description")}
                  className={formInputClass("teal")}
                  placeholder="Finalidad de este rol..."
                />
                {errors.description && (
                  <p className="text-xs text-red-500 font-medium">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sección: matriz de permisos ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-zinc-900">Matriz de Permisos</h3>
              {/* ── Mejora 10: contador en tiempo real ── */}
              {!loadingPerms && (
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                    selectedIds.length > 0
                      ? "bg-teal-50 text-teal-700 border-teal-200"
                      : "bg-zinc-100 text-zinc-500 border-zinc-200"
                  }`}
                >
                  {selectedIds.length} / {allPermissions.length} seleccionados
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* ── Mejora 9: acciones globales ── */}
              {!loadingPerms && allPermissions.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-teal-600 hover:text-teal-800 transition-colors"
                  >
                    Seleccionar todos
                  </button>
                  <span className="text-zinc-300">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    Ninguno
                  </button>
                </div>
              )}
              {errors.permissionIds && (
                <p className="text-xs text-red-500 font-bold">
                  {errors.permissionIds.message}
                </p>
              )}
            </div>
          </div>

          {loadingPerms ? (
            <div className="flex items-center justify-center py-16">
              {/* ── Mejora 8: spinner teal ── */}
              <Loader2 className="animate-spin text-teal-600" size={32} />
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
                    <th className="px-4 py-2.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Módulo / Permiso
                    </th>
                    <th className="px-4 py-2.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Código
                    </th>
                    <th className="px-4 py-2.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-2.5 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center w-24">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {categories.map((category) => {
                    const categoryPerms = allPermissions.filter(
                      (p) => getPermissionCategory(p.code) === category,
                    );
                    const selectedInCat = categoryPerms.filter((p) =>
                      selectedIds.includes(p.id),
                    ).length;
                    const allInCatSelected =
                      selectedInCat === categoryPerms.length;

                    return (
                      // ── Mejora 12: Fragment nombrado en vez de React.Fragment ──
                      <Fragment key={category}>
                        {/* ── Mejora 9: fila de categoría con toggle masivo ── */}
                        <tr className="bg-zinc-50/40 border-y border-zinc-100">
                          <td colSpan={4} className="px-4 py-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                                {category}
                              </span>
                              <div className="flex items-center gap-3">
                                {selectedInCat > 0 && (
                                  <span className="text-xs font-bold text-teal-600">
                                    {selectedInCat}/{categoryPerms.length}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleCategory(category)}
                                  className="text-xs font-bold text-teal-600 hover:text-teal-800 transition-colors"
                                >
                                  {allInCatSelected
                                    ? "Quitar todos"
                                    : "Seleccionar todos"}
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                        {categoryPerms.map((perm) => {
                          const isSelected = selectedIds.includes(perm.id);
                          return (
                            <tr
                              key={perm.id}
                              onClick={() => togglePermission(perm.id)}
                              // ── Mejora 11: contraste visible en selección ──
                              className={`group cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-teal-50"
                                  : "hover:bg-zinc-50/50"
                              }`}
                            >
                              <td className="px-4 py-2.5">
                                <span
                                  className={`text-sm font-bold transition-colors ${
                                    isSelected
                                      ? "text-teal-800"
                                      : "text-zinc-700"
                                  }`}
                                >
                                  {perm.name}
                                </span>
                              </td>
                              <td className="px-4 py-2.5">
                                <code
                                  className={`text-xs px-2 py-0.5 rounded font-mono transition-colors ${
                                    isSelected
                                      ? "bg-teal-100 text-teal-700"
                                      : "bg-zinc-100 text-zinc-600"
                                  }`}
                                >
                                  {perm.code}
                                </code>
                              </td>
                              <td className="px-4 py-2.5">
                                <p className="text-xs text-zinc-500">
                                  {perm.description ?? "—"}
                                </p>
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {/* ── Mejora 8 + 11: color teal en checkmark ── */}
                                <div
                                  className={`inline-flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? "text-teal-600"
                                      : "text-zinc-300 group-hover:text-zinc-400"
                                  }`}
                                >
                                  {isSelected ? (
                                    <CheckCircle2 size={22} />
                                  ) : (
                                    <Circle size={22} />
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Botones ── */}
        <FormActionsBar
          onCancel={handleLeave}
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          isSubmitDisabled={loadingPerms}
          submitLabel={isEditing ? "Guardar cambios" : "Crear rol"}
        />
      </form>
    </div>
  );
};
