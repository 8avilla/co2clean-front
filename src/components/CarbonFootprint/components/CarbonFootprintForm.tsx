'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Upload,
  FileText,
  CheckCircle2,
  X,
  Flame,
  RefreshCw,
  Download,
  ArrowLeft,
  Save,
  FilePlus,
  FileSpreadsheet,
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

const MONTH_LABELS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTH_KEYS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

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

  // Bulk mode state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);

  // Individual mode state
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

  const watchSourceId = useWatch({
    control,
    name: 'emissionSourceId',
  });

  // Load initial catalogs
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



  // Handle emission source changes via event handler
  const handleSourceChange = async (sourceId: string) => {
    setValue('emissionUnitId', undefined);
    setValue('emissionSubsourceId', '');
    if (sourceId) {
      try {
        const data = await EmissionSubsourcesService.getAll({ emissionSourceId: sourceId });
        setEmissionSubsources(data);
      } catch {
        toast.error('Error al cargar las subfuentes de emisión');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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
      toast.error('Debe seleccionar un formato (modo de carga).');
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
        emissionSourceId: data.emissionSourceId,
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

  const csvFormatHref =
    loadMode === 'Monthly'
      ? '/formato-huella-mensual.csv'
      : loadMode === 'Annual'
        ? '/formato-huella-anual.csv'
        : '#';

  const selectedSource = emissionSources.find(s => s.id === watchSourceId);
  const filteredUnits = selectedSource?.unitTypeId
    ? emissionUnits.filter(u => u.unitTypeId === selectedSource.unitTypeId)
    : emissionUnits;

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
            <p className="text-sm text-zinc-500">Complete la información para cargar las emisiones.</p>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setRegistrationMode('bulk')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            registrationMode === 'bulk'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <FileSpreadsheet size={16} /> Masivo (CSV)
        </button>
        <button
          type="button"
          onClick={() => setRegistrationMode('individual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
            registrationMode === 'individual'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          <FilePlus size={16} /> Individual
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Identificación */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center gap-2 bg-teal-50/30">
            <Building2 className="text-teal-600" size={18} />
            <h2 className="font-bold text-sm text-zinc-900">Identificación</h2>
          </div>
          <div className="p-4 space-y-4">
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

        {/* Carga de datos */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex flex-wrap items-center justify-between gap-3 bg-teal-50/30">
            <div className="flex items-center gap-2">
              <Upload className="text-teal-600" size={18} />
              <h2 className="font-bold text-sm text-zinc-900">
                {registrationMode === 'bulk' ? 'Carga masiva (CSV)' : 'Registro individual'}
                <span className="text-red-500 ml-1">*</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={loadMode}
                onChange={(e) => { setLoadMode(e.target.value as LoadMode | ''); setMonthlyValues(Array(12).fill('')); }}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs bg-white font-semibold text-zinc-700"
              >
                <option value="">Modo de carga</option>
                {LOAD_MODES.map(m => (
                  <option key={m} value={m}>{m === 'Monthly' ? 'Mensual' : 'Anual'}</option>
                ))}
              </select>
              {registrationMode === 'bulk' && (
                <a
                  href={csvFormatHref}
                  download
                  className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${loadMode
                    ? 'text-teal-600 hover:text-teal-700 hover:underline'
                    : 'text-zinc-300 cursor-not-allowed pointer-events-none'
                  }`}
                >
                  <Download size={14} /> Descargar formato
                </a>
              )}
            </div>
          </div>

          {registrationMode === 'bulk' ? (
            <div className="p-4 space-y-3">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  csvFile ? 'border-teal-500 bg-teal-50/20' : 'border-zinc-200 bg-zinc-50 hover:border-teal-400'
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

              {csvPreview.length > 0 && (
                <div className="border border-zinc-200 rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center bg-zinc-50 p-2 px-4 border-b border-zinc-200">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Vista Previa (5 filas)
                    </span>
                    <button type="button" onClick={removeCsv} className="text-red-500 hover:text-red-600 text-xs font-bold flex items-center gap-1">
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

              {loadMode === 'Annual' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">
                    Consumo anual <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={annualQuantity}
                    onChange={(e) => setAnnualQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
                  />
                </div>
              )}

              {loadMode === 'Monthly' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700">
                    Consumo mensual <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {MONTH_LABELS.map((month, i) => (
                      <div key={month} className="space-y-1">
                        <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wide">{month}</label>
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
                          className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loadMode && (
                <p className="text-sm text-zinc-400 italic">Seleccione el modo de carga (Mensual / Anual) para ingresar los datos.</p>
              )}
            </div>
          )}
        </div>

        {/* Detalles de emisión */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center gap-2 bg-teal-50/30">
            <Flame className="text-teal-600" size={18} />
            <h2 className="font-bold text-sm text-zinc-900">Detalles de emisión</h2>
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
                Fuente de emisión <span className="text-red-500">*</span>
              </label>
              <select
                {...register('emissionSourceId', {
                  onChange: (e) => handleSourceChange(e.target.value)
                })}
                disabled={emissionSources.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">Seleccione</option>
                {emissionSources.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.emissionSourceId && (
                <p className="text-xs text-red-500">{errors.emissionSourceId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Subfuente de emisión <span className="text-red-500">*</span>
              </label>
              <select
                {...register('emissionSubsourceId')}
                disabled={!watchSourceId || emissionSubsources.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">
                  {!watchSourceId ? 'Seleccione una fuente primero' : 'Seleccione'}
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
                {selectedSource?.unitType && (
                  <span className="ml-2 text-[10px] font-normal text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                    {selectedSource.unitType.name}
                  </span>
                )}
              </label>
              <select
                {...register('emissionUnitId')}
                disabled={filteredUnits.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">
                  {!watchSourceId ? 'Seleccione una fuente primero' : 'Seleccione'}
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

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex gap-2">
          <span className="font-bold">Nota:</span>
          <p>Complete todos los campos obligatorios (*) antes de calcular la huella de carbono.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => { reset(); removeCsv(); setLoadMode(''); setIndividualItem(''); setAnnualQuantity(''); setMonthlyValues(Array(12).fill('')); }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw size={16} /> Limpiar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-full hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            {isSubmitting ? 'Registrando...' : 'Registrar emisiones'}
          </button>
        </div>

      </form>
    </div>
  );
};
