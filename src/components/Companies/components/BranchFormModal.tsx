"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Save, Loader2, MapPin } from "lucide-react";
import {
  ApiHeadquarter,
  HeadquarterFormData,
  HeadquarterSchema,
} from "../types";
import {
  LocationService,
  Department,
  Municipality,
} from "@/shared/services/location.service";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";

import {
  formInputClass,
  FORM_LABEL_CLASS,
} from "@/shared/components/Common/form-styles";
import { buttonClass } from "@/shared/components/Common/button-styles";
interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HeadquarterFormData) => Promise<void>;
  initialData?: ApiHeadquarter | null;
  /** Location of the parent company, offered as a shortcut for new headquarters */
  companyLocation?: {
    departmentId?: string;
    municipalityId?: string;
    address?: string;
  };
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  companyLocation,
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<HeadquarterFormData>({
    resolver: zodResolver(HeadquarterSchema),
  });

  const selectedDepartmentId = watch("departmentId");

  // Municipality to select once the options for its department have loaded
  const pendingMunicipalityIdRef = useRef<string | undefined>(undefined);

  // Load departments once
  useEffect(() => {
    LocationService.getDepartments()
      .then((deps) => setDepartments(deps))
      .finally(() => setLoadingLoc(false));
  }, []);

  // Load municipalities when department changes
  useEffect(() => {
    if (!selectedDepartmentId) {
      setMunicipalities([]);
      return;
    }
    LocationService.getMunicipalities(selectedDepartmentId).then(
      setMunicipalities,
    );
  }, [selectedDepartmentId]);

  // The <select> only accepts a value whose option already exists, so apply it after loading
  useEffect(() => {
    const pendingId = pendingMunicipalityIdRef.current;
    if (
      pendingId &&
      municipalities.some((municipality) => municipality.id === pendingId)
    ) {
      setValue("municipalityId", pendingId, { shouldDirty: true });
      pendingMunicipalityIdRef.current = undefined;
    }
  }, [municipalities, setValue]);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description ?? "",
        address: initialData.address ?? "",
        departmentId: initialData.departmentId ?? "",
        municipalityId: initialData.municipalityId ?? "",
      });
      // Municipality options load when the department changes; select it once they arrive
      pendingMunicipalityIdRef.current =
        initialData.municipalityId || undefined;
    } else {
      reset({
        name: "",
        description: "",
        address: "",
        departmentId: "",
        municipalityId: "",
      });
    }
  }, [initialData, reset, isOpen]);

  const canCopyCompanyLocation = !!companyLocation?.departmentId;

  const handleUseCompanyLocation = () => {
    if (!companyLocation?.departmentId) return;
    setValue("address", companyLocation.address ?? "", { shouldDirty: true });
    if (selectedDepartmentId === companyLocation.departmentId) {
      // Same department: options are already loaded, so the municipality can be set right away
      setValue("municipalityId", companyLocation.municipalityId ?? "", {
        shouldDirty: true,
      });
      return;
    }
    pendingMunicipalityIdRef.current =
      companyLocation.municipalityId || undefined;
    setValue("departmentId", companyLocation.departmentId, {
      shouldDirty: true,
    });
    setValue("municipalityId", "");
  };

  // Closing (X, Cancel or Escape) asks first when there are unsaved changes
  const { confirmLeave } = useUnsavedChangesGuard(isOpen && isDirty);
  const requestClose = useCallback(async () => {
    if (await confirmLeave()) onClose();
  }, [confirmLeave, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      // A confirmation dialog handles Escape itself; do not open another one on top of it
      if (event.key === "Escape" && !document.querySelector(".swal2-container"))
        requestClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, requestClose]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue("departmentId", e.target.value, { shouldValidate: true });
    setValue("municipalityId", "", { shouldValidate: false });
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="branch-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-5 py-3 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h3
            id="branch-modal-title"
            className="font-bold text-base text-zinc-900"
          >
            {initialData ? "Editar Sede" : "Nueva sede"}
          </h3>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Cerrar"
            className="p-2 hover:bg-zinc-200 rounded-lg transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-3">
          {!initialData && canCopyCompanyLocation && (
            <button
              type="button"
              onClick={handleUseCompanyLocation}
              className="flex items-center gap-2 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              <MapPin size={14} />
              Usar la ubicación de la empresa
            </button>
          )}

          <div className="grid grid-cols-1 gap-3">
            {/* Nombre */}
            <div className="space-y-1">
              <label htmlFor="branch-name" className={FORM_LABEL_CLASS}>
                Nombre de la Sede
              </label>
              <input
                id="branch-name"
                {...register("name")}
                className={formInputClass("teal")}
                placeholder="Ej. Sede Norte"
                autoFocus
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <label htmlFor="branch-description" className={FORM_LABEL_CLASS}>
                Descripción
              </label>
              <input
                id="branch-description"
                {...register("description")}
                className={formInputClass("teal")}
                placeholder="Ej. Oficina administrativa"
              />
            </div>

            {/* Dirección */}
            <div className="space-y-1">
              <label htmlFor="branch-address" className={FORM_LABEL_CLASS}>
                Dirección
              </label>
              <input
                id="branch-address"
                {...register("address")}
                className={formInputClass("teal")}
                placeholder="Ej. Calle 10 # 20-30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Departamento */}
              <div className="space-y-1">
                <label
                  htmlFor="branch-departmentId"
                  className={FORM_LABEL_CLASS}
                >
                  Departamento
                </label>
                {loadingLoc ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 text-sm">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                ) : (
                  <select
                    id="branch-departmentId"
                    {...register("departmentId")}
                    onChange={handleDepartmentChange}
                    className={`${formInputClass("teal")} appearance-none`}
                  >
                    <option value="">Seleccione...</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        {dep.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Municipio */}
              <div className="space-y-1">
                <label
                  htmlFor="branch-municipalityId"
                  className={FORM_LABEL_CLASS}
                >
                  Municipio
                </label>
                <select
                  id="branch-municipalityId"
                  {...register("municipalityId")}
                  disabled={
                    !selectedDepartmentId || municipalities.length === 0
                  }
                  className={`${formInputClass("teal")} appearance-none disabled:bg-zinc-50 disabled:text-zinc-400`}
                >
                  <option value="">Seleccione...</option>
                  {municipalities.map((mun) => (
                    <option key={mun.id} value={mun.id}>
                      {mun.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-2 rounded-lg text-sm font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={buttonClass()}
            >
              {isSubmitting ? (
                "Guardando..."
              ) : (
                <>
                  <Save size={15} />
                  {initialData ? "Guardar cambios" : "Nueva sede"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
