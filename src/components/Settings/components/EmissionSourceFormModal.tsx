"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type SyntheticEvent,
} from "react";
import {
  X,
  Info,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  Copy,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  EmissionSource,
  EmissionSourceCategory,
  EmissionFactor,
  FactorChanges,
  FactorMassUnit,
  Gas,
} from "../types";
import { EmissionSourceCategoryService } from "@/shared/services/emission-source-category.service";
import {
  EmissionFactorService,
  EmissionUnitService,
  UnitTypeService,
  ApiEmissionUnit,
  ApiUnitType,
} from "@/shared/services/emission-source.service";
import { GasService } from "@/shared/services/gas.service";

interface EmissionSourceFormModalProps {
  source: EmissionSource | undefined;
  defaultCategory?: string;
  onSave: (
    data: Omit<EmissionSource, "id"> & { id?: string },
    factorChanges: FactorChanges,
  ) => void | Promise<void>;
  onClose: () => void;
  /** Edit mode only: creates a copy of the source and closes the modal */
  onDuplicate?: () => void | Promise<void>;
  /** Edit mode only: opens the commercial units manager on top of the modal */
  onManageCommercialUnits?: () => void;
}

import { EmissionSourceInfoTab } from "./emission-source-form/EmissionSourceInfoTab";
import { EmissionFactorsTab } from "./emission-source-form/EmissionFactorsTab";
import type {
  FactorRowErrors,
  InfoErrors,
  LocalEmissionFactor,
  TabKey,
} from "./emission-source-form/types";
import { buttonClass } from "@/shared/components/Common/button-styles";

export const EmissionSourceFormModal = ({
  source,
  defaultCategory,
  onSave,
  onClose,
  onDuplicate,
  onManageCommercialUnits,
}: EmissionSourceFormModalProps) => {
  const isEditing = !!source;
  const keyCounterRef = useRef(0);

  const [activeTab, setActiveTab] = useState<TabKey>("info");

  // Info fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unitTypeId, setUnitTypeId] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Validation state
  const [infoErrors, setInfoErrors] = useState<InfoErrors>({});
  const [factorErrors, setFactorErrors] = useState<
    Record<string, FactorRowErrors>
  >({});

  // Catalog data
  const [localCategories, setLocalCategories] = useState<
    EmissionSourceCategory[]
  >([]);
  const [unitTypes, setUnitTypes] = useState<ApiUnitType[]>([]);
  const [emissionUnits, setEmissionUnits] = useState<ApiEmissionUnit[]>([]);
  const [gases, setGases] = useState<Gas[]>([]);
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(true);
  const [isLoadingFactors, setIsLoadingFactors] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Group emission units by type for the factor row unit selector
  const groupedEmissionUnits = useMemo(() => {
    const typeMap = new Map(unitTypes.map((t) => [t.id, t.name]));
    const groups = new Map<
      string,
      { key: string; label: string; units: ApiEmissionUnit[] }
    >();
    for (const u of emissionUnits) {
      const key = u.unitTypeId ?? "__other__";
      const label = u.unitTypeId
        ? (typeMap.get(u.unitTypeId) ?? "Otras")
        : "Otras";
      if (!groups.has(key)) groups.set(key, { key, label, units: [] });
      groups.get(key)!.units.push(u);
    }
    return Array.from(groups.values()).sort((a, b) => {
      if (a.key === "__other__") return 1;
      if (b.key === "__other__") return -1;
      return a.label.localeCompare(b.label, "es");
    });
  }, [unitTypes, emissionUnits]);

  // Factors local state
  const [factors, setFactors] = useState<LocalEmissionFactor[]>([]);

  const activeFactors = factors.filter((f) => !f._deleted);
  const hasFactorErrors = Object.keys(factorErrors).length > 0;
  const hasInfoErrors = Object.keys(infoErrors).length > 0;

  // ── Load catalogs once on mount ──────────────────────────────────────────

  useEffect(() => {
    setIsLoadingCatalogs(true);
    Promise.all([
      EmissionSourceCategoryService.getCategories(),
      UnitTypeService.getUnitTypes(),
      EmissionUnitService.getUnits(),
      GasService.getGases(),
    ])
      .then(([cats, types, units, gasData]) => {
        setLocalCategories(cats);
        setUnitTypes(types);
        setEmissionUnits(units);
        setGases(gasData);
      })
      .catch(() => toast.error("Error al cargar los catálogos"))
      .finally(() => setIsLoadingCatalogs(false));
  }, []);

  // ── Set default category once catalogs are ready (new source only) ───────

  const hasSetDefaultCatRef = useRef(false);

  useEffect(() => {
    if (hasSetDefaultCatRef.current) return;
    if (source || defaultCategory) return;
    if (localCategories.length === 0) return;
    hasSetDefaultCatRef.current = true;
    setCategoryId(localCategories[0].id);
  }, [localCategories, source, defaultCategory]);

  // ── Reset form when source/defaultCategory changes ────────────────────────

  useEffect(() => {
    hasSetDefaultCatRef.current = false;
    keyCounterRef.current = 0;
    setFactors([]);
    setInfoErrors({});
    setFactorErrors({});
    setActiveTab("info");

    if (source) {
      setName(source.name);
      setCode(source.code);
      setCategoryId(source.category_id);
      setUnitTypeId(source.unit_type_id ?? "");
      setIsActive(source.is_active);
    } else {
      setName("");
      setCode("");
      setCategoryId(defaultCategory ?? "");
      setUnitTypeId("");
      setIsActive(true);
    }
  }, [source, defaultCategory]);

  // ── Load existing factors when editing ────────────────────────────────────

  useEffect(() => {
    if (!source?.id) return;
    setIsLoadingFactors(true);
    EmissionFactorService.getFactors({ emissionSourceId: source.id })
      .then((facts) => {
        setFactors(
          facts.map((f) => ({
            _key: f.id ?? `init_${Date.now()}`,
            id: f.id,
            gas_id: f.gas_id,
            gwp: f.gwp,
            factor: f.factor,
            factor_mass_unit: f.factor_mass_unit ?? "kg",
            coefficient: f.coefficient ?? 1,
            uncertainty: f.uncertainty ?? "",
            emission_unit_id: f.emission_unit_id,
            _deleted: false,
          })),
        );
      })
      .catch(() => toast.error("Error al cargar los factores de emisión"))
      .finally(() => setIsLoadingFactors(false));
  }, [source]);

  // ── Validation ────────────────────────────────────────────────────────────

  const validateInfo = (): InfoErrors => {
    const errs: InfoErrors = {};
    if (!name.trim()) {
      errs.name = "El nombre es requerido.";
    } else if (name.trim().length < 2) {
      errs.name = "El nombre debe tener al menos 2 caracteres.";
    }
    if (!categoryId) {
      errs.categoryId = "Debes seleccionar un tipo de fuente.";
    }
    return errs;
  };

  const validateFactors = (): Record<string, FactorRowErrors> => {
    const errs: Record<string, FactorRowErrors> = {};
    for (const f of activeFactors) {
      const rowErrs: FactorRowErrors = {};

      if (!f.gas_id) {
        rowErrs.gas_id = "Selecciona un gas.";
      }

      if (f.factor === "" || f.factor === null) {
        rowErrs.factor = "El factor es requerido.";
      } else if (Number(f.factor) <= 0) {
        rowErrs.factor = "El factor debe ser mayor a 0.";
      }

      if (f.coefficient !== "") {
        if (Number(f.coefficient) <= 0) {
          rowErrs.coefficient = "El coeficiente debe ser mayor a 0.";
        }
      }

      if (f.uncertainty !== "") {
        const u = Number(f.uncertainty);
        if (u < 0) {
          rowErrs.uncertainty = "No puede ser menor a 0%.";
        } else if (u > 100) {
          rowErrs.uncertainty = "No puede superar el 100%.";
        }
      }

      if (!f.emission_unit_id) {
        rowErrs.emission_unit_id = "Selecciona una unidad.";
      }

      if (Object.keys(rowErrs).length > 0) {
        errs[f._key] = rowErrs;
      }
    }
    return errs;
  };

  const clearInfoError = (field: keyof InfoErrors) =>
    setInfoErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const clearFactorError = (key: string, field: keyof FactorRowErrors) =>
    setFactorErrors((prev) => {
      if (!prev[key]) return prev;
      const row = { ...prev[key] };
      delete row[field];
      if (Object.keys(row).length === 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: row };
    });

  // ── Factor helpers ────────────────────────────────────────────────────────

  const handleAddFactor = () => {
    keyCounterRef.current += 1;
    const firstGas = gases[0];
    setFactors((prev) => [
      ...prev,
      {
        _key: `new_${keyCounterRef.current}`,
        gas_id: firstGas?.id ?? "",
        gwp: firstGas?.gwp ?? 0,
        factor: "",
        factor_mass_unit: "kg" as FactorMassUnit,
        coefficient: 1,
        uncertainty: "",
        emission_unit_id: emissionUnits[0]?.id ?? "",
        _deleted: false,
      },
    ]);
  };

  const handleRemoveFactor = (key: string) => {
    setFactors((prev) =>
      prev.reduce<LocalEmissionFactor[]>((acc, f) => {
        if (f._key !== key) return [...acc, f];
        if (f.id) return [...acc, { ...f, _deleted: true }];
        return acc;
      }, []),
    );
    setFactorErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateFactor = (key: string, patch: Partial<LocalEmissionFactor>) => {
    setFactors((prev) =>
      prev.map((f) => (f._key === key ? { ...f, ...patch } : f)),
    );
  };

  const handleGasChange = (key: string, gasId: string) => {
    const selected = gases.find((g) => g.id === gasId);
    updateFactor(key, { gas_id: gasId, gwp: selected?.gwp ?? 0 });
    clearFactorError(key, "gas_id");
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const infoErrs = validateInfo();
    const factorErrs = validateFactors();

    setInfoErrors(infoErrs);
    setFactorErrors(factorErrs);

    const hasInfoErr = Object.keys(infoErrs).length > 0;
    const hasFactorErr = Object.keys(factorErrs).length > 0;

    if (hasInfoErr) {
      setActiveTab("info");
      return;
    }
    if (hasFactorErr) {
      setActiveTab("factors");
      return;
    }

    const toCreate: Omit<EmissionFactor, "id">[] = factors
      .filter((f) => !f.id && !f._deleted)
      .map((f) => ({
        gas_id: f.gas_id,
        gwp: f.gwp,
        factor: typeof f.factor === "number" ? f.factor : 0,
        factor_mass_unit: f.factor_mass_unit,
        coefficient: typeof f.coefficient === "number" ? f.coefficient : 1,
        uncertainty:
          typeof f.uncertainty === "number" ? f.uncertainty : undefined,
        emission_unit_id: f.emission_unit_id,
        emission_source_id: "",
        emission_source_category_id: categoryId,
      }));

    const toUpdate: (EmissionFactor & { id: string })[] = factors
      .filter(
        (f): f is LocalEmissionFactor & { id: string } => !!f.id && !f._deleted,
      )
      .map((f) => ({
        id: f.id,
        gas_id: f.gas_id,
        gwp: f.gwp,
        factor: typeof f.factor === "number" ? f.factor : 0,
        factor_mass_unit: f.factor_mass_unit,
        coefficient: typeof f.coefficient === "number" ? f.coefficient : 1,
        uncertainty:
          typeof f.uncertainty === "number" ? f.uncertainty : undefined,
        emission_unit_id: f.emission_unit_id,
        emission_source_id: source?.id ?? "",
        emission_source_category_id: categoryId,
      }));

    const toDelete: string[] = factors
      .filter(
        (f): f is LocalEmissionFactor & { id: string } => !!f.id && f._deleted,
      )
      .map((f) => f.id);

    setIsSaving(true);
    try {
      await onSave(
        {
          id: source?.id,
          code: code.trim(),
          name: name.trim(),
          category_id: categoryId,
          unit_type_id: unitTypeId || undefined,
          measurement_type:
            unitTypes.find((u) => u.id === unitTypeId)?.name ?? "",
          is_active: isActive,
        },
        { toCreate, toUpdate, toDelete },
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-zinc-900">
              {isEditing
                ? "Editar fuente de emisión"
                : "Nueva fuente de emisión"}
            </h2>
            {isEditing && (
              <p className="text-sm text-zinc-400 mt-0.5">{source.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 px-6 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("info")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "info"
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <Info size={15} />
            Información
            {hasInfoErrors && (
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("factors")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === "factors"
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <SlidersHorizontal size={15} />
            Factores de emisión
            {activeFactors.length > 0 && !hasFactorErrors && (
              <span className="px-1.5 py-0.5 rounded-full text-xs font-black bg-violet-100 text-violet-700">
                {activeFactors.length}
              </span>
            )}
            {hasFactorErrors && (
              <AlertCircle size={13} className="text-red-500 flex-shrink-0" />
            )}
            {isLoadingFactors && (
              <Loader2 size={13} className="animate-spin text-zinc-400" />
            )}
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col flex-1 min-h-0"
        >
          <div className="flex-1 overflow-y-auto">
            {activeTab === "info" && (
              <EmissionSourceInfoTab
                isLoadingCatalogs={isLoadingCatalogs}
                name={name}
                code={code}
                unitTypeId={unitTypeId}
                categoryId={categoryId}
                isActive={isActive}
                infoErrors={infoErrors}
                unitTypes={unitTypes}
                categories={localCategories}
                activeFactorsCount={activeFactors.length}
                hasFactorErrors={hasFactorErrors}
                onNameChange={(value) => {
                  setName(value);
                  clearInfoError("name");
                }}
                onCodeChange={setCode}
                onUnitTypeChange={setUnitTypeId}
                onCategoryChange={(value) => {
                  setCategoryId(value);
                  clearInfoError("categoryId");
                }}
                onToggleActive={() => setIsActive((v) => !v)}
                onGoToFactors={() => setActiveTab("factors")}
              />
            )}

            {activeTab === "factors" && (
              <EmissionFactorsTab
                isLoading={isLoadingFactors}
                activeFactors={activeFactors}
                factorErrors={factorErrors}
                gases={gases}
                groupedEmissionUnits={groupedEmissionUnits}
                onGasChange={handleGasChange}
                onUpdateFactor={updateFactor}
                onClearFactorError={clearFactorError}
                onRemoveFactor={handleRemoveFactor}
                onAddFactor={handleAddFactor}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 flex-shrink-0">
            {isEditing && (onManageCommercialUnits || onDuplicate) && (
              <div className="mr-auto flex items-center gap-2">
                {onManageCommercialUnits && (
                  <button
                    type="button"
                    onClick={onManageCommercialUnits}
                    disabled={isSaving}
                    className={buttonClass({ variant: "secondary", size: "sm" })}
                  >
                    <Layers size={14} />
                    Unidades comerciales
                  </button>
                )}
                {onDuplicate && (
                  <button
                    type="button"
                    onClick={onDuplicate}
                    disabled={isSaving}
                    className={buttonClass({ variant: "secondary", size: "sm" })}
                  >
                    <Copy size={14} />
                    Duplicar
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={buttonClass({ variant: "ghost" })}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={buttonClass()}
            >
              {isSaving && <Loader2 size={16} className="animate-spin" />}
              {isSaving
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear fuente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
