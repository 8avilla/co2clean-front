"use client";

import {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  CheckCircle2,
  Flame,
  RefreshCw,
  ArrowLeft,
  Save,
  FilePlus,
  FileSpreadsheet,
  ChevronRight,
} from "lucide-react";
import { UnitPicker } from "./UnitPicker";
import { CarbonFootprintDataStep } from "./carbon-footprint-form/CarbonFootprintDataStep";
import { SectionStatus } from "./carbon-footprint-form/SectionStatus";
import { MONTH_KEYS } from "./carbon-footprint-form/month-constants";
import { toast } from "sonner";
import {
  CarbonFootprintFormData,
  CarbonFootprintSchema,
  LOAD_MODES,
  LoadMode,
  ApiEmissionGroup,
  ApiEmissionSource,
  ApiEmissionSubsource,
  ApiEmissionUnit,
  ApiCommercialUnit,
} from "../types";
import { CarbonFootprintService } from "../services/carbonFootprint.service";
import {
  EmissionGroupsService,
  EmissionSourcesService,
  EmissionSubsourcesService,
  EmissionUnitsService,
} from "../services/catalogs.service";
import { CompanyService } from "../../Companies/services/company.service";
import { ApiHeadquarter } from "../../Companies/types";
import { useRouter } from "next/navigation";
import {
  FORM_WIDTH,
  formInputClass,
  FORM_LABEL_CLASS,
} from "@/shared/components/Common/form-styles";
import { confirmDialog } from "@/shared/lib/confirm-dialog";
import { useUnsavedChangesGuard } from "@/shared/hooks/useUnsavedChangesGuard";
import { getActiveCompany } from "@/shared/lib/session";

interface ActiveCompany {
  id: string;
  name: string;
  nit: string;
}

export const CarbonFootprintForm = () => {
  const router = useRouter();
  const [activeCompany] = useState(() => getActiveCompany());

  const [branches, setBranches] = useState<ApiHeadquarter[]>([]);
  const [emissionGroups, setEmissionGroups] = useState<ApiEmissionGroup[]>([]);
  const [emissionSources, setEmissionSources] = useState<ApiEmissionSource[]>(
    [],
  );
  const [emissionSubsources, setEmissionSubsources] = useState<
    ApiEmissionSubsource[]
  >([]);
  const [emissionUnits, setEmissionUnits] = useState<ApiEmissionUnit[]>([]);
  const [commercialUnits, setCommercialUnits] = useState<ApiCommercialUnit[]>(
    [],
  );
  const [filteredCatalogUnits, setFilteredCatalogUnits] = useState<
    ApiEmissionUnit[]
  >([]);

  const [registrationMode, setRegistrationMode] = useState<
    "bulk" | "individual"
  >("bulk");
  const [loadMode, setLoadMode] = useState<LoadMode | "">("Annual");
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);

  const [individualItem, setIndividualItem] = useState("");
  const [annualQuantity, setAnnualQuantity] = useState("");
  const [monthlyValues, setMonthlyValues] = useState<string[]>(
    Array(12).fill(""),
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    trigger,
    formState: { errors, isDirty },
    control,
  } = useForm<CarbonFootprintFormData>({
    resolver: zodResolver(CarbonFootprintSchema),
    defaultValues: { year: new Date().getFullYear().toString() },
  });

  const [
    watchHeadquarterId,
    watchYear,
    watchGroupId,
    watchSourceCategoryId,
    watchSubsourceId,
    watchUnitId,
  ] = useWatch({
    control,
    name: [
      "headquarterId",
      "year",
      "emissionGroupId",
      "emissionSourceCategoryId",
      "emissionSubsourceId",
      "emissionUnitId",
    ],
  });

  useEffect(() => {
    if (!activeCompany) return;
    const loadAll = async () => {
      try {
        const [hq, sources, units, groups] = await Promise.all([
          CompanyService.getHeadquarters(activeCompany.id),
          EmissionSourcesService.getAll(),
          EmissionUnitsService.getAll(),
          EmissionGroupsService.getAll(),
        ]);
        setBranches(hq);
        setEmissionSources(sources);
        setEmissionUnits(units);
        setEmissionGroups(groups);
      } catch {
        toast.error("Error al cargar los catálogos");
      }
    };
    loadAll();
  }, [activeCompany]);

  const handleSourceCategoryChange = async (categoryId: string) => {
    setValue("emissionUnitId", undefined);
    setValue("emissionSubsourceId", "");
    setCommercialUnits([]);
    setFilteredCatalogUnits([]);
    if (categoryId) {
      try {
        const data = await EmissionSubsourcesService.getAll({
          emissionSourceCategoryId: categoryId,
        });
        setEmissionSubsources(data);
      } catch {
        toast.error("Error al cargar las fuentes de emisión");
      }
    } else {
      setEmissionSubsources([]);
    }
  };

  const handleSubsourceChange = async (subsourceId: string) => {
    setValue("emissionUnitId", undefined);
    setCommercialUnits([]);
    setFilteredCatalogUnits([]);
    if (!subsourceId) return;

    // Commercial units — failure is non-blocking
    try {
      const commercial =
        await EmissionSubsourcesService.getSourceUnits(subsourceId);
      setCommercialUnits(commercial ?? []);
    } catch {
      // no commercial units for this source, fallback to catalog
    }

    // Catalog units — resolve unitTypeId from full detail, then load matching units
    try {
      const subsourceDetail =
        await EmissionSubsourcesService.getById(subsourceId);
      const unitTypeId = subsourceDetail?.unitTypeId;
      if (unitTypeId) {
        const catalog = await EmissionUnitsService.getAll({ unitTypeId });
        setFilteredCatalogUnits(catalog ?? []);
      }
    } catch {
      toast.error("Error al cargar las unidades de medida");
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text
          .trim()
          .split("\n")
          .filter((l) => l.trim());
        const parsed = lines.map((l) =>
          l.split(",").map((c) => c.trim().replace(/^"|"$/g, "")),
        );
        setCsvPreview(parsed);
        setCsvFile(file);
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      processFile(file);
    } else {
      toast.error("Por favor, sube un archivo CSV válido.");
    }
  };

  const removeCsv = () => {
    setCsvFile(null);
    setCsvPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // The wizard keeps part of its data outside react-hook-form (CSV, quantities), so check those too
  const hasEnteredData =
    isDirty ||
    !!csvFile ||
    individualItem !== "" ||
    annualQuantity !== "" ||
    monthlyValues.some((value) => value !== "");
  const { confirmLeave } = useUnsavedChangesGuard(hasEnteredData);

  const handleLeave = async () => {
    if (await confirmLeave()) router.back();
  };

  const handleClear = async () => {
    const confirmed = await confirmDialog({
      title: "¿Limpiar el formulario?",
      text: "Se borrarán todos los datos ingresados en el formulario.",
      icon: "warning",
      confirmText: "Sí, limpiar",
    });
    if (!confirmed) return;
    reset();
    removeCsv();
    setLoadMode("Annual");
    setIndividualItem("");
    setAnnualQuantity("");
    setMonthlyValues(Array(12).fill(""));
    setCommercialUnits([]);
    setFilteredCatalogUnits([]);
    setEmissionSubsources([]);
    setCurrentStep(1);
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const ok = await trigger(["headquarterId", "year"]);
      if (ok) setCurrentStep(2);
    } else if (currentStep === 2) {
      const ok = await trigger([
        "emissionGroupId",
        "emissionSourceCategoryId",
        "emissionSubsourceId",
      ]);
      if (ok) setCurrentStep(3);
    }
  };

  const generateIndividualFile = (): File => {
    let csv: string;
    if (loadMode === "Annual") {
      csv = `item,cantidad\n${individualItem},${annualQuantity}`;
    } else {
      csv = `item,${MONTH_KEYS.join(",")}\n${individualItem},${monthlyValues.join(",")}`;
    }
    return new File([csv], "registro-individual.csv", { type: "text/csv" });
  };

  const onSubmit = async (data: CarbonFootprintFormData) => {
    if (!loadMode) {
      toast.error("Debe seleccionar un período (Anual o Mensual).");
      return;
    }
    if (!activeCompany?.nit) {
      toast.error("No se encontró el NIT de la empresa activa.");
      return;
    }
    if (registrationMode === "bulk") {
      if (!csvFile) {
        toast.error(
          "Debe cargar el archivo CSV con los datos de huella de carbono.",
        );
        return;
      }
    } else {
      if (!individualItem.trim()) {
        toast.error("Debe ingresar el ítem o descripción del registro.");
        return;
      }
      if (loadMode === "Annual" && !annualQuantity) {
        toast.error("Debe ingresar el consumo anual.");
        return;
      }
      if (loadMode === "Monthly" && monthlyValues.every((v) => !v)) {
        toast.error("Debe ingresar al menos un valor mensual.");
        return;
      }
    }

    const fileToUpload =
      registrationMode === "bulk" ? csvFile! : generateIndividualFile();

    const isCommercialUnit = !!selectedCommercialUnit;

    setIsSubmitting(true);
    try {
      await CarbonFootprintService.uploadCsv(fileToUpload, {
        year: data.year,
        nit: activeCompany.nit,
        headquarterId: data.headquarterId,
        emissionGroupId: data.emissionGroupId!,
        emissionSourceCategoryId: data.emissionSourceCategoryId,
        emissionSubsourceId: data.emissionSubsourceId,
        emissionUnitId: data.emissionUnitId || undefined,
      });
      toast.success("Actividades registradas exitosamente");
      router.push("/huella-carbono");
      router.refresh();
    } catch {
      toast.error("Error al registrar las actividades");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived values
  const selectedGroup = emissionGroups.find((g) => g.id === watchGroupId);
  const selectedSource = emissionSources.find(
    (s) => s.id === watchSourceCategoryId,
  );
  const selectedSubsource = emissionSubsources.find(
    (ss) => ss.id === watchSubsourceId,
  );
  const selectedCommercialUnit = commercialUnits.find(
    (u) => (u.emissionUnitId ?? u.displaySymbol) === watchUnitId,
  );
  const selectedCatalogUnit = !selectedCommercialUnit
    ? (filteredCatalogUnits.find((u) => u.id === watchUnitId) ??
      emissionUnits.find((u) => u.id === watchUnitId))
    : null;
  const unitSymbol =
    selectedCommercialUnit?.displaySymbol ?? selectedCatalogUnit?.symbol ?? "";
  const hasAnyUnits =
    commercialUnits.length > 0 || filteredCatalogUnits.length > 0;

  const monthlyTotal = monthlyValues.reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0,
  );

  // Section completion
  const identificationComplete = !!watchHeadquarterId && !!watchYear;
  const emissionDetailsComplete =
    !!watchGroupId && !!watchSourceCategoryId && !!watchSubsourceId;
  const dataComplete =
    registrationMode === "bulk"
      ? !!csvFile
      : !!individualItem.trim() &&
        ((loadMode === "Annual" && !!annualQuantity) ||
          (loadMode === "Monthly" && monthlyValues.some((v) => !!v)));

  // Pending validation hints
  const pendingItems = [
    !watchHeadquarterId && "Sede",
    !watchYear && "Año de reporte",
    !watchGroupId && "Grupo de Emisiones",
    !watchSourceCategoryId && "Tipo de fuente",
    !watchSubsourceId && "Fuente de emisión",
    registrationMode === "bulk" && !csvFile && "Archivo CSV",
    registrationMode === "individual" &&
      !individualItem.trim() &&
      "Ítem / Descripción",
    registrationMode === "individual" &&
      loadMode === "Annual" &&
      !annualQuantity &&
      "Consumo anual",
    registrationMode === "individual" &&
      loadMode === "Monthly" &&
      monthlyValues.every((v) => !v) &&
      "Al menos un consumo mensual",
  ].filter(Boolean) as string[];

  const csvFormatHref =
    loadMode === "Monthly"
      ? "/formato-huella-mensual.csv"
      : loadMode === "Annual"
        ? "/formato-huella-anual.csv"
        : "#";

  // Cascade steps for the progress indicator
  const cascadeSteps = [
    {
      label: "Grupo",
      display: selectedGroup?.name?.split(" — ")[0] ?? "Grupo",
      done: !!watchGroupId,
    },
    {
      label: "Tipo de fuente",
      display: selectedSource?.name ?? "Tipo de fuente",
      done: !!watchSourceCategoryId,
    },
    {
      label: "Fuente",
      display: selectedSubsource?.name ?? "Fuente",
      done: !!watchSubsourceId,
    },
    {
      label: "Unidad",
      display: selectedCommercialUnit
        ? selectedCommercialUnit.displayName
        : selectedCatalogUnit
          ? `${selectedCatalogUnit.name} (${selectedCatalogUnit.symbol})`
          : "Unidad",
      done: !!watchUnitId,
    },
  ];

  const WIZARD_STEPS = [
    { label: "Identificación", complete: identificationComplete },
    { label: "Fuente de emisión", complete: emissionDetailsComplete },
    { label: "Datos", complete: dataComplete },
  ];

  return (
    <div className={`${FORM_WIDTH.wide} mx-auto space-y-4`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleLeave}
          className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          title="Volver"
          aria-label="Volver"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">
            Registro de datos de actividades
          </h1>
          <p className="text-sm text-zinc-500">
            Paso {currentStep} de 3 — {WIZARD_STEPS[currentStep - 1].label}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0">
        {WIZARD_STEPS.map((step, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < currentStep || step.complete;
          const isActive = stepNum === currentStep;
          return (
            <div
              key={step.label}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                    isDone
                      ? "bg-teal-500 text-white"
                      : isActive
                        ? "bg-teal-600 text-white ring-4 ring-teal-500/20"
                        : "bg-zinc-200 text-zinc-400"
                  }`}
                >
                  {isDone && stepNum < currentStep ? (
                    <CheckCircle2 size={13} />
                  ) : (
                    stepNum
                  )}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:block truncate ${
                    isActive
                      ? "text-teal-700"
                      : isDone
                        ? "text-zinc-500"
                        : "text-zinc-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < WIZARD_STEPS.length - 1 && (
                <div
                  className={`flex-1 mx-2 h-px ${stepNum < currentStep ? "bg-teal-400" : "bg-zinc-200"}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mejora 2 & 3: Panel de configuración unificado (solo Paso 1) ── */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Configuración del registro
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Tipo de registro */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-zinc-500 mb-1.5">
                Tipo de registro
              </p>
              <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRegistrationMode("bulk")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    registrationMode === "bulk"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <FileSpreadsheet size={15} /> Masivo (CSV)
                </button>
                <button
                  type="button"
                  onClick={() => setRegistrationMode("individual")}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    registrationMode === "individual"
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  <FilePlus size={15} /> Individual
                </button>
              </div>
            </div>

            <div className="hidden sm:block w-px bg-zinc-200" />

            {/* Período */}
            <div className="flex-1">
              <p className="text-xs font-semibold text-zinc-500 mb-1.5">
                Período de reporte
              </p>
              <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
                {LOAD_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setLoadMode(m);
                      if (m === "Annual") setMonthlyValues(Array(12).fill(""));
                      if (m === "Monthly") setAnnualQuantity("");
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      loadMode === m
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {m === "Monthly" ? "Mensual" : "Anual"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* ── Paso 1: Identificación ── */}
        {currentStep === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-teal-50/30">
              <div className="flex items-center gap-2">
                <Building2 className="text-teal-600" size={18} />
                <h2 className="font-bold text-sm text-zinc-900">
                  Identificación
                </h2>
              </div>
              <SectionStatus complete={identificationComplete} />
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                <div className="space-y-1">
                  <label className={FORM_LABEL_CLASS}>Empresa</label>
                  <input
                    readOnly
                    value={activeCompany?.name ?? "Sin empresa activa"}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 outline-none text-sm cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1">
                  <label className={FORM_LABEL_CLASS}>
                    Sede <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("headquarterId")}
                    disabled={branches.length === 0}
                    className={`${formInputClass("teal")} disabled:bg-zinc-50 disabled:text-zinc-400`}
                  >
                    <option value="">Seleccione</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {errors.headquarterId && (
                    <p className="text-xs text-red-500">
                      {errors.headquarterId.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="cf-year" className={FORM_LABEL_CLASS}>
                    Año de reporte <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="cf-year"
                    {...register("year")}
                    className={formInputClass("teal")}
                  >
                    <option value="">Seleccione el año</option>
                    {Array.from({ length: 10 }, (_, i) =>
                      String(new Date().getFullYear() - i),
                    ).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  {errors.year && (
                    <p className="text-xs text-red-500">
                      {errors.year.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Paso 2: Detalles de emisión ── */}
        {currentStep === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
            <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-teal-50/30">
              <div className="flex items-center gap-2">
                <Flame className="text-teal-600" size={18} />
                <h2 className="font-bold text-sm text-zinc-900">
                  Detalles de emisión
                </h2>
              </div>
              <SectionStatus complete={emissionDetailsComplete} />
            </div>

            {/* ── Mejora 4: Indicador de cadena de dependencias ── */}
            <div className="px-4 py-2.5 bg-zinc-50/60 border-b border-zinc-100 flex items-center gap-1 flex-wrap overflow-x-auto">
              {cascadeSteps.map((step, i) => (
                <div
                  key={step.label}
                  className="flex items-center gap-1 flex-shrink-0"
                >
                  {i > 0 && (
                    <span className="text-zinc-300 text-sm mx-0.5">›</span>
                  )}
                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                      step.done
                        ? "bg-teal-100 text-teal-700"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                    title={
                      step.done ? step.display : `Pendiente: ${step.label}`
                    }
                  >
                    {step.done && <CheckCircle2 size={10} />}
                    {step.done ? step.display : step.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
              <div className="space-y-1">
                <label className={FORM_LABEL_CLASS}>
                  Grupo de emisión <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("emissionGroupId")}
                  disabled={emissionGroups.length === 0}
                  className={`${formInputClass("teal")} disabled:bg-zinc-50 disabled:text-zinc-400`}
                >
                  <option value="">Seleccione</option>
                  {emissionGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                {errors.emissionGroupId && (
                  <p className="text-xs text-red-500">
                    {errors.emissionGroupId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className={FORM_LABEL_CLASS}>
                  Tipo de fuente <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("emissionSourceCategoryId", {
                    onChange: (e) => handleSourceCategoryChange(e.target.value),
                  })}
                  disabled={emissionSources.length === 0}
                  className={`${formInputClass("teal")} disabled:bg-zinc-50 disabled:text-zinc-400`}
                >
                  <option value="">Seleccione</option>
                  {emissionSources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {errors.emissionSourceCategoryId && (
                  <p className="text-xs text-red-500">
                    {errors.emissionSourceCategoryId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className={FORM_LABEL_CLASS}>
                  Fuente de emisión <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("emissionSubsourceId", {
                    onChange: (e) => handleSubsourceChange(e.target.value),
                  })}
                  disabled={
                    !watchSourceCategoryId || emissionSubsources.length === 0
                  }
                  className={`${formInputClass("teal")} disabled:bg-zinc-50 disabled:text-zinc-400`}
                >
                  <option value="">
                    {!watchSourceCategoryId
                      ? "Seleccione una categoría primero"
                      : "Seleccione"}
                  </option>
                  {emissionSubsources.map((ss) => (
                    <option key={ss.id} value={ss.id}>
                      {ss.name}
                    </option>
                  ))}
                </select>
                {errors.emissionSubsourceId && (
                  <p className="text-xs text-red-500">
                    {errors.emissionSubsourceId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className={FORM_LABEL_CLASS}>
                  Unidad de medida
                  {selectedSubsource?.unitType && (
                    <span className="ml-2 text-[10px] font-normal text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                      {selectedSubsource.unitType.name}
                    </span>
                  )}
                </label>
                <UnitPicker
                  value={watchUnitId ?? ""}
                  onChange={(val) =>
                    setValue("emissionUnitId", val || undefined)
                  }
                  commercialUnits={commercialUnits}
                  catalogUnits={filteredCatalogUnits}
                  disabled={!watchSubsourceId}
                  disabledPlaceholder="Seleccione una fuente primero"
                  accentColor="teal"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Paso 3: Datos ── */}
        {currentStep === 3 && (
          <CarbonFootprintDataStep
            registrationMode={registrationMode}
            loadMode={loadMode}
            dataComplete={dataComplete}
            unitSymbol={unitSymbol}
            csvFormatHref={csvFormatHref}
            showCsvHelp={showCsvHelp}
            setShowCsvHelp={setShowCsvHelp}
            csvFile={csvFile}
            csvPreview={csvPreview}
            fileInputRef={fileInputRef}
            handleDrop={handleDrop}
            handleFileChange={handleFileChange}
            removeCsv={removeCsv}
            individualItem={individualItem}
            setIndividualItem={setIndividualItem}
            annualQuantity={annualQuantity}
            setAnnualQuantity={setAnnualQuantity}
            monthlyValues={monthlyValues}
            setMonthlyValues={setMonthlyValues}
            monthlyTotal={monthlyTotal}
          />
        )}

        {/* ── Navegación del wizard ── */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Pending hint del paso actual */}
          {pendingItems.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
              <span className="font-bold text-zinc-600 flex-shrink-0">
                Pendiente:
              </span>
              <span>{pendingItems.join(" · ")}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-semibold text-zinc-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Limpiar formulario
            </button>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
                  }
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition-all"
                >
                  <ArrowLeft size={15} />
                  Anterior
                </button>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-1.5 px-6 py-2 text-sm font-bold text-white bg-teal-600 rounded-full hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all active:scale-95"
                >
                  Siguiente
                  <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-teal-600 rounded-full hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <RefreshCw size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {isSubmitting ? "Registrando..." : "Registrar actividades"}
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
