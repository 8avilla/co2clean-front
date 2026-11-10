"use client";

import { useEffect, useState, useRef, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  Upload,
  X,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiCompany, CompanyFormData, CompanySchema } from "../types";
import { CompanyService } from "../services/company.service";
import {
  LocationService,
  Department,
  Municipality,
} from "@/shared/services/location.service";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { formatNit } from "../utils/nit";
import { FormCard } from "@/shared/components/Common/FormCard";
import { FormActionsBar } from "@/shared/components/Common/FormActionsBar";
import {
  FORM_FIELD_GRID,
  FORM_LABEL_CLASS,
  FORM_WIDTH,
  formInputClass,
} from "@/shared/components/Common/form-styles";
import { useFileUpload } from "@/shared/hooks/useFileUpload";

interface CompanyFormProps {
  initialData?: ApiCompany;
  isEditing?: boolean;
}

export const CompanyForm = ({
  initialData,
  isEditing = false,
}: CompanyFormProps) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialData?.logoUrl ?? null,
  );
  const { isUploading, uploadFile } = useFileUpload({
    maxSizeBytes: 1024 * 1024,
    allowedTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(CompanySchema),
    defaultValues: {
      name: initialData?.name ?? "",
      nit: initialData?.nit ?? "",
      email: initialData?.email ?? "",
      description: initialData?.description ?? "",
      logoUrl: initialData?.logoUrl ?? "",
      country: initialData?.country ?? "Colombia",
      departmentId: initialData?.departmentId ?? "",
      municipalityId: initialData?.municipalityId ?? "",
      address: initialData?.address ?? "",
    },
  });

  const selectedDepartmentId = watch("departmentId");

  const { confirmLeave } = useUnsavedChangesGuard(isDirty);

  const handleLeave = async () => {
    if (await confirmLeave()) router.back();
  };

  useEffect(() => {
    LocationService.getDepartments()
      .then((deps) => setDepartments(deps))
      .catch(() => toast.error("No se pudieron cargar los departamentos"))
      .finally(() => setLoadingLoc(false));
  }, []);

  useEffect(() => {
    if (!selectedDepartmentId) {
      setMunicipalities([]);
      return;
    }
    LocationService.getMunicipalities(selectedDepartmentId)
      .then((muns) => {
        setMunicipalities(muns);
        if (
          initialData?.municipalityId &&
          selectedDepartmentId === initialData.departmentId
        ) {
          setValue("municipalityId", initialData.municipalityId);
        }
      })
      .catch(() => toast.error("No se pudieron cargar los municipios"));
  }, [selectedDepartmentId, setValue, initialData]);

  const handleDepartmentChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setValue("departmentId", e.target.value, { shouldValidate: true });
    setValue("municipalityId", "", { shouldValidate: false });
  };

  const handleLogoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setLogoPreview(localPreview);
    setValue("logoUrl", "");

    const publicUrl = await uploadFile(file);

    if (publicUrl) {
      setLogoPreview(publicUrl);
      setValue("logoUrl", publicUrl);
    } else {
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.error("No se pudo subir el logo. Intenta de nuevo.");
    }

    URL.revokeObjectURL(localPreview);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setValue("logoUrl", undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (data: CompanyFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await CompanyService.updateCompany(initialData.id, data);
        toast.success("Empresa actualizada exitosamente");
        reset(data);
        router.push("/empresas");
        router.refresh();
      } else {
        // ── Mejora 11: Redirigir a edición tras crear para agregar sedes ──
        const created = await CompanyService.createCompany(data);
        toast.success("Empresa creada. Ahora agrega las sedes de la empresa.");
        router.push(`/empresas/${created.id}?tab=sedes`);
        router.refresh();
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al guardar los datos",
      );
    }
  };

  return (
    <div className={`${FORM_WIDTH.standard} mx-auto space-y-4`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleLeave}
          className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          title="Volver"
          aria-label="Volver"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            {isEditing
              ? `Editando: ${initialData?.name ?? "Empresa"}`
              : "Nueva empresa"}
          </h1>
          <p className="text-sm text-zinc-500">
            {isEditing
              ? "Modifica los datos de la empresa y gestiona sus sedes."
              : "Completa los datos para registrar la empresa. Podrás agregar sedes al finalizar."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <FormCard
          title="Datos de la empresa"
          icon={<Building2 className="text-teal-600" size={16} />}
        >
          <div className="flex flex-col md:flex-row gap-5">
            {/* ── Logo column ── */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div className="relative">
                <button
                  type="button"
                  disabled={isUploading}
                  aria-label={logoPreview ? "Cambiar logo" : "Subir logo"}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-24 h-24 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                    isUploading
                      ? "border-teal-300 bg-teal-50/30 cursor-wait"
                      : logoPreview
                        ? "border-teal-500 bg-teal-50/10 cursor-pointer"
                        : "border-zinc-200 bg-zinc-50 hover:border-teal-300 hover:bg-zinc-100 cursor-pointer"
                  }`}
                >
                  {isUploading ? (
                    <span className="flex flex-col items-center gap-1.5 text-teal-600">
                      <Loader2 size={20} className="animate-spin" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Subiendo...
                      </span>
                    </span>
                  ) : logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Vista previa del logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-1 text-zinc-400">
                      <Upload size={18} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center px-2">
                        Subir logo
                      </span>
                    </span>
                  )}
                </button>
                {logoPreview && !isUploading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLogo();
                    }}
                    aria-label="Quitar logo"
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-all"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 text-center leading-snug">
                JPG, PNG, SVG, WebP
                <br />
                Máx. 1 MB
              </p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
              />
            </div>

            {/* ── Fields ── */}
            <div className={`flex-1 ${FORM_FIELD_GRID}`}>
              <div className="space-y-1 md:col-span-2">
                <label htmlFor="company-name" className={FORM_LABEL_CLASS}>
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  id="company-name"
                  {...register("name")}
                  className={formInputClass()}
                  placeholder="Ej. EcoCore SAS"
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="company-nit" className={FORM_LABEL_CLASS}>
                  NIT <span className="text-red-500">*</span>
                </label>
                <input
                  id="company-nit"
                  {...register("nit", {
                    onBlur: (event) =>
                      setValue("nit", formatNit(event.target.value), {
                        shouldValidate: true,
                        shouldDirty: true,
                      }),
                  })}
                  inputMode="numeric"
                  className={formInputClass()}
                  placeholder="Ej. 890.903.938-8"
                />
                {errors.nit ? (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors.nit.message}
                  </p>
                ) : (
                  <p className="text-[10px] text-zinc-400">
                    Con o sin dígito de verificación
                  </p>
                )}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label htmlFor="company-email" className={FORM_LABEL_CLASS}>
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-2.5 text-zinc-400"
                    size={14}
                  />
                  <input
                    id="company-email"
                    {...register("email")}
                    type="email"
                    className={`${formInputClass()} pl-9`}
                    placeholder="admin@empresa.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="company-country" className={FORM_LABEL_CLASS}>
                  País
                </label>
                <input
                  id="company-country"
                  {...register("country")}
                  readOnly
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 outline-none text-sm cursor-not-allowed"
                />
              </div>

              <div className="space-y-1 md:col-span-3">
                <label
                  htmlFor="company-description"
                  className={FORM_LABEL_CLASS}
                >
                  Descripción
                </label>
                <textarea
                  id="company-description"
                  {...register("description")}
                  rows={2}
                  className={`${formInputClass()} resize-none`}
                  placeholder="Breve descripción de la compañía..."
                />
                {errors.description && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Location ── */}
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <h3 className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
              <MapPin className="text-teal-600" size={14} />
              Ubicación
            </h3>
            <div className={FORM_FIELD_GRID}>
              <div className="space-y-1">
                <label
                  htmlFor="company-departmentId"
                  className={FORM_LABEL_CLASS}
                >
                  Departamento <span className="text-red-500">*</span>
                </label>
                {loadingLoc ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 text-sm">
                    <Loader2 size={14} className="animate-spin" /> Cargando...
                  </div>
                ) : (
                  <select
                    id="company-departmentId"
                    {...register("departmentId")}
                    onChange={handleDepartmentChange}
                    className={`${formInputClass()} appearance-none`}
                  >
                    <option value="">Seleccione...</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.departmentId && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors.departmentId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="company-municipalityId"
                  className={FORM_LABEL_CLASS}
                >
                  Municipio <span className="text-red-500">*</span>
                </label>
                <select
                  id="company-municipalityId"
                  {...register("municipalityId")}
                  disabled={
                    !selectedDepartmentId || municipalities.length === 0
                  }
                  className={`${formInputClass()} appearance-none disabled:bg-zinc-50 disabled:text-zinc-400`}
                >
                  <option value="">
                    {!selectedDepartmentId
                      ? "Primero seleccione un departamento"
                      : municipalities.length === 0
                        ? "Cargando municipios..."
                        : "Seleccione..."}
                  </option>
                  {municipalities.map((mun) => (
                    <option key={mun.id} value={mun.id}>
                      {mun.name}
                    </option>
                  ))}
                </select>
                {errors.municipalityId && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors.municipalityId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="company-address" className={FORM_LABEL_CLASS}>
                  Dirección <span className="text-red-500">*</span>
                </label>
                <input
                  id="company-address"
                  {...register("address")}
                  className={formInputClass()}
                  placeholder="Ej. Carrera 50 # 10 - 20"
                />
                {errors.address && (
                  <p className="text-[10px] text-red-500 font-medium">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </FormCard>

        <FormActionsBar
          onCancel={handleLeave}
          isDirty={isDirty}
          isSubmitting={isSubmitting}
          isSubmitDisabled={isUploading}
          submitLabel={
            isUploading
              ? "Subiendo logo..."
              : isEditing
                ? "Guardar cambios"
                : "Crear empresa"
          }
        />
      </form>
    </div>
  );
};
