'use client';

import { useState, useEffect, useRef, type ChangeEvent, type DragEvent } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2, Upload, FileText, CheckCircle2, X, Flame, RefreshCw,
  Download, ArrowLeft, Save, FilePlus, FileSpreadsheet, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CarbonFootprintFormData,
  CarbonFootprintSchema,
  LOAD_MODES,
  LoadMode,
  ApiEmissionGroup,
  ApiEmissionSource,
  ApiEmissionSubsource,
  ApiEmissionUnit,
} from '../types';
import { CarbonFootprintService } from '../services/carbonFootprint.service';
import {
  EmissionGroupsService,
  EmissionSourcesService,
  EmissionSubsourcesService,
  EmissionUnitsService,
} from '../services/catalogs.service';
import { CompanyService } from '../../Companies/services/company.service';
import { ApiHeadquarter } from '../../Companies/types';
import { useRouter } from 'next/navigation';

interface ActiveCompany {
  id: string;
  name: string;
  nit: string;
}

function getActiveCompanyFromSession(): ActiveCompany | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { company?: ActiveCompany | null };
    return parsed.company ?? null;
  } catch {
    return null;
  }
}

const MONTH_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const MONTH_KEYS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const SectionStatus = ({ complete }: { complete: boolean }) =>
  complete
    ? <CheckCircle2 size={15} className="text-teal-500 flex-shrink-0" />
    : <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 flex-shrink-0" />;

export const CarbonFootprintForm = () => {
  const router = useRouter();
  const [activeCompany] = useState(() => getActiveCompanyFromSession());

  const [branches, setBranches] = useState<ApiHeadquarter[]>([]);
  const [emissionGroups, setEmissionGroups] = useState<ApiEmissionGroup[]>([]);
  const [emissionSources, setEmissionSources] = useState<ApiEmissionSource[]>([]);
  const [emissionSubsources, setEmissionSubsources] = useState<ApiEmissionSubsource[]>([]);
  const [emissionUnits, setEmissionUnits] = useState<ApiEmissionUnit[]>([]);

  const [registrationMode, setRegistrationMode] = useState<'bulk' | 'individual'>('bulk');
  const [loadMode, setLoadMode] = useState<LoadMode | ''>('Annual');
  const [showCsvHelp, setShowCsvHelp] = useState(false);

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);

  const [individualItem, setIndividualItem] = useState('');
  const [annualQuantity, setAnnualQuantity] = useState('');
  const [monthlyValues, setMonthlyValues] = useState<string[]>(Array(12).fill(''));

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
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
    name: ['headquarterId', 'year', 'emissionGroupId', 'emissionSourceCategoryId', 'emissionSubsourceId', 'emissionUnitId'],
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
        toast.error('Error al cargar los catálogos');
      }
    };
    loadAll();
  }, [activeCompany]);

  const handleSourceCategoryChange = async (categoryId: string) => {
    setValue('emissionUnitId', undefined);
    setValue('emissionSubsourceId', '');
    if (categoryId) {
      try {
        const data = await EmissionSubsourcesService.getAll({ emissionSourceCategoryId: categoryId });
        setEmissionSubsources(data);
      } catch {
        toast.error('Error al cargar las fuentes de emisión');
      }
    } else {
      setEmissionSubsources([]);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text.trim().split('\n').filter(l => l.trim());
        const parsed = lines.map(l =>
          l.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
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
    if (file && file.name.endsWith('.csv')) {
      processFile(file);
    } else {
      toast.error('Por favor, sube un archivo CSV válido.');
    }
  };

  const removeCsv = () => {
    setCsvFile(null);
    setCsvPreview([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    if (!confirm('¿Estás seguro? Se borrarán todos los datos ingresados en el formulario.')) return;
    reset();
    removeCsv();
    setLoadMode('Annual');
    setIndividualItem('');
    setAnnualQuantity('');
    setMonthlyValues(Array(12).fill(''));
  };

  const generateIndividualFile = (): File => {
    let csv: string;
    if (loadMode === 'Annual') {
      csv = `item,cantidad\n${individualItem},${annualQuantity}`;
    } else {
      csv = `item,${MONTH_KEYS.join(',')}\n${individualItem},${monthlyValues.join(',')}`;
    }
    return new File([csv], 'registro-individual.csv', { type: 'text/csv' });
  };

  const onSubmit = async (data: CarbonFootprintFormData) => {
    if (!loadMode) {
      toast.error('Debe seleccionar un período (Anual o Mensual).');
      return;
    }
    if (!activeCompany?.nit) {
      toast.error('No se encontró el NIT de la empresa activa.');
      return;
    }
    if (registrationMode === 'bulk') {
      if (!csvFile) {
        toast.error('Debe cargar el archivo CSV con los datos de huella de carbono.');
        return;
      }
    } else {
      if (!individualItem.trim()) {
        toast.error('Debe ingresar el ítem o descripción del registro.');
        return;
      }
      if (loadMode === 'Annual' && !annualQuantity) {
        toast.error('Debe ingresar el consumo anual.');
        return;
      }
      if (loadMode === 'Monthly' && monthlyValues.every(v => !v)) {
        toast.error('Debe ingresar al menos un valor mensual.');
        return;
      }
    }

    const fileToUpload = registrationMode === 'bulk' ? csvFile! : generateIndividualFile();

    setIsSubmitting(true);
    try {
      await CarbonFootprintService.uploadCsv(fileToUpload, {
        year: data.year,
        nit: activeCompany.nit,
        headquarterId: data.headquarterId,
        emissionGroupId: data.emissionGroupId!,
        emissionSourceCategoryId: data.emissionSourceCategoryId,
        emissionSubsourceId: data.emissionSubsourceId,
        emissionUnitId: data.emissionUnitId,
      });
      toast.success('Emisiones registradas exitosamente');
      router.push('/huella-carbono');
      router.refresh();
    } catch {
      toast.error('Error al registrar las emisiones');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Derived values
  const selectedGroup = emissionGroups.find(g => g.id === watchGroupId);
  const selectedSource = emissionSources.find(s => s.id === watchSourceCategoryId);
  const selectedSubsource = emissionSubsources.find(ss => ss.id === watchSubsourceId);
  const filteredUnits = selectedSubsource?.unitTypeId
    ? emissionUnits.filter(u => u.unitTypeId === selectedSubsource.unitTypeId)
    : [];
  const selectedUnit = emissionUnits.find(u => u.id === watchUnitId);
  const unitSymbol = selectedUnit?.symbol ?? '';

  const monthlyTotal = monthlyValues.reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  // Section completion
  const identificationComplete = !!watchHeadquarterId && !!watchYear;
  const emissionDetailsComplete = !!watchGroupId && !!watchSourceCategoryId && !!watchSubsourceId;
  const dataComplete = registrationMode === 'bulk'
    ? !!csvFile
    : !!individualItem.trim() && (
      (loadMode === 'Annual' && !!annualQuantity) ||
      (loadMode === 'Monthly' && monthlyValues.some(v => !!v))
    );

  // Pending validation hints
  const pendingItems = [
    !watchHeadquarterId && 'Sede',
    !watchYear && 'Año de reporte',
    !watchGroupId && 'Grupo de Emisiones',
    !watchSourceCategoryId && 'Categoría de fuente',
    !watchSubsourceId && 'Fuente de emisión',
    registrationMode === 'bulk' && !csvFile && 'Archivo CSV',
    registrationMode === 'individual' && !individualItem.trim() && 'Ítem / Descripción',
    registrationMode === 'individual' && loadMode === 'Annual' && !annualQuantity && 'Consumo anual',
    registrationMode === 'individual' && loadMode === 'Monthly' && monthlyValues.every(v => !v) && 'Al menos un consumo mensual',
  ].filter(Boolean) as string[];

  const csvFormatHref = loadMode === 'Monthly'
    ? '/formato-huella-mensual.csv'
    : loadMode === 'Annual'
      ? '/formato-huella-anual.csv'
      : '#';

  // Cascade steps for the progress indicator
  const cascadeSteps = [
    {
      label: 'Grupo',
      display: selectedGroup?.name?.split(' — ')[0] ?? 'Grupo',
      done: !!watchGroupId,
    },
    {
      label: 'Categoría',
      display: selectedSource?.name ?? 'Categoría',
      done: !!watchSourceCategoryId,
    },
    {
      label: 'Fuente',
      display: selectedSubsource?.name ?? 'Fuente',
      done: !!watchSubsourceId,
    },
    {
      label: 'Unidad',
      display: selectedUnit ? `${selectedUnit.name} (${selectedUnit.symbol})` : 'Unidad',
      done: !!watchUnitId,
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
          title="Volver"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Registro de Emisiones de Huella de Carbono</h1>
          <p className="text-sm text-zinc-500">
            {identificationComplete && emissionDetailsComplete && dataComplete
              ? 'Todo listo. Revisa los datos y registra las emisiones.'
              : 'Complete la información para registrar las emisiones.'}
          </p>
        </div>
      </div>

      {/* ── Mejora 2 & 3: Panel de configuración unificado ── */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">
          Configuración del registro
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Tipo de registro */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-zinc-500 mb-1.5">Tipo de registro</p>
            <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
              <button
                type="button"
                onClick={() => setRegistrationMode('bulk')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  registrationMode === 'bulk'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <FileSpreadsheet size={15} /> Masivo (CSV)
              </button>
              <button
                type="button"
                onClick={() => setRegistrationMode('individual')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  registrationMode === 'individual'
                    ? 'bg-white text-zinc-900 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                <FilePlus size={15} /> Individual
              </button>
            </div>
          </div>

          <div className="hidden sm:block w-px bg-zinc-200" />

          {/* Período */}
          <div className="flex-1">
            <p className="text-xs font-semibold text-zinc-500 mb-1.5">Período de reporte</p>
            <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl">
              {LOAD_MODES.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setLoadMode(m);
                    if (m === 'Annual') setMonthlyValues(Array(12).fill(''));
                    if (m === 'Monthly') setAnnualQuantity('');
                  }}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                    loadMode === m
                      ? 'bg-white text-zinc-900 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700'
                  }`}
                >
                  {m === 'Monthly' ? 'Mensual' : 'Anual'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ── Mejora 1: Sección 1 — Identificación (antes primero) ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-teal-50/30">
            <div className="flex items-center gap-2">
              <Building2 className="text-teal-600" size={18} />
              <h2 className="font-bold text-sm text-zinc-900">Identificación</h2>
            </div>
            <SectionStatus complete={identificationComplete} />
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Empresa</label>
                <input
                  readOnly
                  value={activeCompany?.name ?? 'Sin empresa activa'}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 outline-none text-sm cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">
                  Sede <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('headquarterId')}
                  disabled={branches.length === 0}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                  <option value="">Seleccione</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.headquarterId && (
                  <p className="text-xs text-red-500">{errors.headquarterId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">
                  Año de reporte <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('year')}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm bg-white"
                >
                  <option value="">Seleccione el año</option>
                  {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i)).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                {errors.year && (
                  <p className="text-xs text-red-500">{errors.year.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Mejora 1: Sección 2 — Detalles de emisión (movida arriba) ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-teal-50/30">
            <div className="flex items-center gap-2">
              <Flame className="text-teal-600" size={18} />
              <h2 className="font-bold text-sm text-zinc-900">Detalles de emisión</h2>
            </div>
            <SectionStatus complete={emissionDetailsComplete} />
          </div>

          {/* ── Mejora 4: Indicador de cadena de dependencias ── */}
          <div className="px-4 py-2.5 bg-zinc-50/60 border-b border-zinc-100 flex items-center gap-1 flex-wrap overflow-x-auto">
            {cascadeSteps.map((step, i) => (
              <div key={step.label} className="flex items-center gap-1 flex-shrink-0">
                {i > 0 && <span className="text-zinc-300 text-sm mx-0.5">›</span>}
                <span
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                    step.done
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}
                  title={step.done ? step.display : `Pendiente: ${step.label}`}
                >
                  {step.done && <CheckCircle2 size={10} />}
                  {step.done ? step.display : step.label}
                </span>
              </div>
            ))}
          </div>

          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Grupo de Emisiones <span className="text-red-500">*</span>
              </label>
              <select
                {...register('emissionGroupId')}
                disabled={emissionGroups.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">Seleccione</option>
                {emissionGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              {errors.emissionGroupId && (
                <p className="text-xs text-red-500">{errors.emissionGroupId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Categoría de fuente de emisión <span className="text-red-500">*</span>
              </label>
              <select
                {...register('emissionSourceCategoryId', {
                  onChange: (e) => handleSourceCategoryChange(e.target.value),
                })}
                disabled={emissionSources.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">Seleccione</option>
                {emissionSources.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.emissionSourceCategoryId && (
                <p className="text-xs text-red-500">{errors.emissionSourceCategoryId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Fuente de emisión <span className="text-red-500">*</span>
              </label>
              <select
                {...register('emissionSubsourceId', {
                  onChange: () => {
                    setValue('emissionUnitId', undefined);
                  },
                })}
                disabled={!watchSourceCategoryId || emissionSubsources.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">
                  {!watchSourceCategoryId ? 'Seleccione una categoría primero' : 'Seleccione'}
                </option>
                {emissionSubsources.map(ss => (
                  <option key={ss.id} value={ss.id}>{ss.name}</option>
                ))}
              </select>
              {errors.emissionSubsourceId && (
                <p className="text-xs text-red-500">{errors.emissionSubsourceId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Unidad de medida
                {selectedSubsource?.unitType && (
                  <span className="ml-2 text-[10px] font-normal text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                    {selectedSubsource.unitType.name}
                  </span>
                )}
              </label>
              <select
                {...register('emissionUnitId')}
                disabled={!watchSubsourceId || filteredUnits.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">
                  {!watchSubsourceId ? 'Seleccione una fuente primero' : 'Seleccione'}
                </option>
                {filteredUnits.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Mejora 1: Sección 3 — Datos (movida al final) ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-teal-50/30">
            <div className="flex items-center gap-2">
              <Upload className="text-teal-600" size={18} />
              <h2 className="font-bold text-sm text-zinc-900">
                {registrationMode === 'bulk' ? 'Carga masiva (CSV)' : 'Registro individual'}
                <span className="text-red-500 ml-1">*</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* ── Mejora 10: Download link (solo en bulk) ── */}
              {registrationMode === 'bulk' && (
                <a
                  href={csvFormatHref}
                  download
                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${
                    loadMode
                      ? 'text-teal-600 hover:text-teal-700 hover:underline'
                      : 'text-zinc-300 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  <Download size={14} /> Descargar formato
                </a>
              )}
              <SectionStatus complete={dataComplete} />
            </div>
          </div>

          {registrationMode === 'bulk' ? (
            <div className="p-4 space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  csvFile
                    ? 'border-teal-500 bg-teal-50/20'
                    : 'border-zinc-200 bg-zinc-50 hover:border-teal-400'
                }`}
              >
                {csvFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="text-teal-500" size={32} />
                    <span className="font-bold text-teal-900">{csvFile.name}</span>
                    <span className="text-xs text-zinc-500">{csvPreview.length - 1} registros detectados</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="text-zinc-400" size={32} />
                    <p className="text-sm font-semibold text-zinc-700">
                      Arrastra tu archivo CSV aquí o haz clic para seleccionar
                    </p>
                    <span className="text-xs text-zinc-500">Solo archivos .csv admitidos</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />

              {/* ── Mejora 10: Ayuda de columnas CSV ── */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowCsvHelp(v => !v)}
                  className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-semibold transition-colors"
                >
                  {showCsvHelp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  ¿Qué columnas debe tener el CSV?
                </button>
                {showCsvHelp && (
                  <div className="mt-2 p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-xs space-y-1.5">
                    <p className="font-semibold text-zinc-700">
                      Columnas requeridas {loadMode ? `(modo ${loadMode === 'Annual' ? 'anual' : 'mensual'})` : ''}:
                    </p>
                    <ul className="space-y-1 text-zinc-600">
                      <li>
                        <code className="bg-zinc-200 px-1.5 py-0.5 rounded font-mono">item</code>
                        {' '}— Descripción del registro
                      </li>
                      {loadMode === 'Annual' && (
                        <li>
                          <code className="bg-zinc-200 px-1.5 py-0.5 rounded font-mono">cantidad</code>
                          {' '}— Valor numérico del consumo{unitSymbol ? ` (en ${unitSymbol})` : ''}
                        </li>
                      )}
                      {loadMode === 'Monthly' && MONTH_KEYS.map((k, i) => (
                        <li key={k}>
                          <code className="bg-zinc-200 px-1.5 py-0.5 rounded font-mono">{k}</code>
                          {' '}— Consumo de {MONTH_LABELS[i]}{unitSymbol ? ` (en ${unitSymbol})` : ''}
                        </li>
                      ))}
                      {!loadMode && (
                        <li className="text-zinc-400 italic">Selecciona el período para ver las columnas exactas.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {csvPreview.length > 0 && (
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center bg-zinc-50 p-2 px-4 border-b border-zinc-200">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Vista previa (5 filas)
                    </span>
                    <button
                      type="button"
                      onClick={removeCsv}
                      className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1"
                    >
                      <X size={14} /> Eliminar
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-zinc-50">
                          {csvPreview[0].map((h, i) => (
                            <th key={i} className="p-3 font-semibold text-zinc-600 border-b border-zinc-200">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {csvPreview.slice(1, 6).map((row, i) => (
                          <tr key={i} className="hover:bg-zinc-50/50">
                            {row.map((cell, j) => (
                              <td key={j} className="p-3 text-zinc-600">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">
                  Ítem / Descripción <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={individualItem}
                  onChange={(e) => setIndividualItem(e.target.value)}
                  placeholder="Ej: Gasolina corriente"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
                />
              </div>

              {/* ── Mejora 6: Unidad junto al input de cantidad ── */}
              {loadMode === 'Annual' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">
                    Consumo anual
                    {unitSymbol && (
                      <span className="ml-2 text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                        {unitSymbol}
                      </span>
                    )}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={annualQuantity}
                      onChange={(e) => setAnnualQuantity(e.target.value)}
                      placeholder="0"
                      className={`w-full px-3 py-2 ${unitSymbol ? 'pr-16' : ''} rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm`}
                    />
                    {unitSymbol && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded pointer-events-none">
                        {unitSymbol}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ── Mejoras 5 & 6: Grid mensual con total y unidad ── */}
              {loadMode === 'Monthly' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-700">
                      Consumo mensual
                      {unitSymbol && (
                        <span className="ml-2 text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                          {unitSymbol}
                        </span>
                      )}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    {/* ── Mejora 5: Total acumulado en tiempo real ── */}
                    {monthlyTotal > 0 && (
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">Total anual</span>
                        <span className="text-sm font-black text-teal-700 tabular-nums">
                          {monthlyTotal.toLocaleString('es-CO')}{unitSymbol && ` ${unitSymbol}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Grid agrupado por trimestre */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[0, 3, 6, 9].map(startIdx => (
                      <div key={startIdx} className="space-y-2">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider text-center">
                          T{Math.floor(startIdx / 3) + 1}
                        </p>
                        {[0, 1, 2].map(offset => {
                          const i = startIdx + offset;
                          return (
                            <div key={MONTH_LABELS[i]} className="space-y-1">
                              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide block">
                                {MONTH_LABELS[i]}
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={monthlyValues[i]}
                                  onChange={(e) => {
                                    const updated = [...monthlyValues];
                                    updated[i] = e.target.value;
                                    setMonthlyValues(updated);
                                  }}
                                  placeholder="0"
                                  className={`w-full px-2 py-1.5 ${unitSymbol ? 'pr-10' : ''} rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm tabular-nums`}
                                />
                                {unitSymbol && (
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-400 pointer-events-none">
                                    {unitSymbol}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loadMode && (
                <p className="text-sm text-zinc-400 italic">
                  Seleccione el período (Anual / Mensual) en el panel de configuración superior para ingresar los datos.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Mejoras 7 & 8: Validaciones inline y acciones separadas ── */}
        <div className="flex flex-col gap-3 pt-2">
          {/* Pending items (reemplaza el banner ámbar) */}
          {pendingItems.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3">
              <span className="font-bold text-zinc-600 flex-shrink-0">Pendiente:</span>
              <span>{pendingItems.join(' · ')}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* ── Mejora 8: Limpiar separado visualmente y con confirmación ── */}
            <button
              type="button"
              onClick={handleClear}
              className="text-sm font-semibold text-zinc-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
            >
              Limpiar formulario
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-full hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
              {isSubmitting ? 'Registrando...' : 'Registrar emisiones'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
