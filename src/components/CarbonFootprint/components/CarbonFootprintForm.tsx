'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Building2,
  Upload,
  FileText,
  CheckCircle2,
  X,
  Flame,
  Calculator,
  RefreshCw,
  Download,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  CarbonFootprintFormData,
  CarbonFootprintSchema,
  MODOS_CARGA,
  ApiGrupoEmision,
  ApiFuenteEmision,
  ApiSubfuenteEmision,
  ApiUnidadEmision,
  ApiCarbonFootprintAnalysis,
} from '../types';
import { CarbonFootprintService } from '../services/carbonFootprint.service';
import { CarbonFootprintAnalysisService } from '../services/carbonFootprintAnalysis.service';
import {
  GruposEmisionService,
  FuentesEmisionService,
  SubfuentesEmisionService,
  UnidadesEmisionService,
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

export const CarbonFootprintForm = () => {
  const router = useRouter();
  const [activeCompany] = useState(() => getActiveCompanyFromSession());

  const [analyses, setAnalyses] = useState<ApiCarbonFootprintAnalysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState('');

  const [branches, setBranches] = useState<ApiHeadquarter[]>([]);
  const [alcances, setAlcances] = useState<ApiGrupoEmision[]>([]);
  const [fuentes, setFuentes] = useState<ApiFuenteEmision[]>([]);
  const [subfuentes, setSubfuentes] = useState<ApiSubfuenteEmision[]>([]);
  const [unidades, setUnidades] = useState<ApiUnidadEmision[]>([]);

  const [modoCarga, setModoCarga] = useState<'Mensual' | 'Anual' | ''>('Anual');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CarbonFootprintFormData>({
    resolver: zodResolver(CarbonFootprintSchema),
    defaultValues: { anio: new Date().getFullYear().toString() },
  });

  const watchFuenteId = watch('fuenteEmisionId');

  // Load initial catalogs and available analyses in parallel (grupos excluded — loaded per analysis)
  useEffect(() => {
    if (!activeCompany) return;
    const loadAll = async () => {
      try {
        const [hq, fue, uni, availableAnalyses] = await Promise.all([
          CompanyService.getHeadquarters(activeCompany.id),
          FuentesEmisionService.getAll(),
          UnidadesEmisionService.getAll(),
          CarbonFootprintAnalysisService.getAll({
            empresaId: activeCompany.id,
            estado: 'WithoutStarting',
          }),
        ]);
        setBranches(hq);
        setFuentes(fue);
        setUnidades(uni);
        setAnalyses(availableAnalyses);
      } catch {
        toast.error('Error al cargar los catálogos');
      }
    };
    loadAll();
  }, [activeCompany]);

  // When analysis changes: auto-fill year, reset grupo, and load grupos filtered by standard
  useEffect(() => {
    const analysis = analyses.find(a => a.id === selectedAnalysisId);
    setValue('grupoEmisionId', undefined);
    setAlcances([]);

    if (!analysis) return;

    setValue('anio', String(analysis.anio));

    if (analysis.standard) {
      GruposEmisionService.getAll({ standard: analysis.standard })
        .then(setAlcances)
        .catch(() => toast.error('Error al cargar los grupos de emisión'));
    }
  }, [selectedAnalysisId, analyses, setValue]);

  // Load subfuentes and reset unidad when fuenteEmisionId changes
  const loadSubfuentes = useCallback(async (fuenteEmisionId: string) => {
    try {
      const data = await SubfuentesEmisionService.getAll(fuenteEmisionId);
      setSubfuentes(data);
    } catch {
      toast.error('Error al cargar las subfuentes de emisión');
    }
  }, []);

  useEffect(() => {
    setValue('unidadEmisionId', undefined);
    if (watchFuenteId) {
      setValue('subfuenteEmisionId', undefined);
      loadSubfuentes(watchFuenteId);
    } else {
      setSubfuentes([]);
    }
  }, [watchFuenteId, setValue, loadSubfuentes]);

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

  const onSubmit = async (data: CarbonFootprintFormData) => {
    if (!selectedAnalysisId) {
      toast.error('Debe seleccionar un análisis de huella de carbono al que cargar las emisiones.');
      return;
    }
    if (!csvFile) {
      toast.error('Debe cargar el archivo CSV con los datos de huella de carbono.');
      return;
    }
    if (!activeCompany?.nit) {
      toast.error('No se encontró el NIT de la empresa activa.');
      return;
    }

    setIsSubmitting(true);
    try {
      await CarbonFootprintService.uploadCsv(csvFile, {
        anio: data.anio,
        nit: activeCompany.nit,
        sedeId: data.sedeId,
        grupoEmisionId: data.grupoEmisionId,
        fuenteEmisionId: data.fuenteEmisionId,
        subfuenteEmisionId: data.subfuenteEmisionId,
        unidadEmisionId: data.unidadEmisionId,
        modoCarga: modoCarga || undefined,
      });
      toast.success('Emisiones cargadas exitosamente');
      router.push('/huella-carbono');
      router.refresh();
    } catch {
      toast.error('Error al cargar las emisiones');
    } finally {
      setIsSubmitting(false);
    }
  };

  const csvFormatHref =
    modoCarga === 'Mensual'
      ? '/formato-huella-mensual.csv'
      : modoCarga === 'Anual'
        ? '/formato-huella-anual.csv'
        : '#';

  const selectedAnalysis = analyses.find(a => a.id === selectedAnalysisId);
  const selectedFuente = fuentes.find(f => f.id === watchFuenteId);
  const filteredUnidades = selectedFuente?.tipoUnidadId
    ? unidades.filter(u => u.tipoUnidadId === selectedFuente.tipoUnidadId)
    : unidades;

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
            <h1 className="text-xl font-bold text-zinc-900">Registro de Huella de Carbono</h1>
            <p className="text-sm text-zinc-500">Complete la información para cargar o calcular emisiones.</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Identificación */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center gap-2 bg-teal-50/30">
            <Building2 className="text-teal-600" size={18} />
            <h2 className="font-bold text-sm text-zinc-900">Identificación</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Analysis selector — full width */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Análisis de huella de carbono <span className="text-red-500">*</span>
              </label>
              {analyses.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm">
                  <span className="font-bold">Sin análisis disponibles.</span>
                  No existen análisis en estado &quot;Sin Iniciar&quot;. Crea uno desde la sección de Análisis antes de cargar emisiones.
                </div>
              ) : (
                <select
                  value={selectedAnalysisId}
                  onChange={(e) => setSelectedAnalysisId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
                >
                  <option value="">Seleccione un análisis</option>
                  {analyses.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.anio} — {a.standard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064'}
                    </option>
                  ))}
                </select>
              )}
            </div>

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
                  {...register('sedeId')}
                  disabled={branches.length === 0}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                  <option value="">Seleccione</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
                {errors.sedeId && <p className="text-xs text-red-500">{errors.sedeId.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Año de reporte</label>
                <input
                  readOnly
                  value={
                    selectedAnalysisId
                      ? (analyses.find(a => a.id === selectedAnalysisId)?.anio ?? '')
                      : 'Seleccione un análisis'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 outline-none text-sm cursor-not-allowed"
                />
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
                Carga de datos <span className="text-red-500">*</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={modoCarga}
                onChange={(e) => setModoCarga(e.target.value as 'Mensual' | 'Anual' | '')}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-xs bg-white font-semibold text-zinc-700"
              >
                <option value="">Seleccione formato (Modo de carga)</option>
                {MODOS_CARGA.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <a
                href={csvFormatHref}
                download
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${modoCarga
                    ? 'text-teal-600 hover:text-teal-700 hover:underline'
                    : 'text-zinc-300 cursor-not-allowed pointer-events-none'
                  }`}
              >
                <Download size={14} /> Descargar formato CSV
              </a>
            </div>
          </div>
          <div className="p-4 space-y-3">

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${csvFile
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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />

            {csvPreview.length > 0 && (
              <div className="mt-4 border border-zinc-200 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center bg-zinc-50 p-2 px-4 border-b border-zinc-200">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Vista Previa (5 filas)
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
                          <th key={i} className="p-3 font-semibold text-zinc-600 border-b border-zinc-200">
                            {h}
                          </th>
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
        </div>

        {/* Detalles de emisión */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center gap-2 bg-teal-50/30">
            <Flame className="text-teal-600" size={18} />
            <h2 className="font-bold text-sm text-zinc-900">Detalles de emisión</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Grupo de Emisiones</label>
              <select
                {...register('grupoEmisionId')}
                disabled={alcances.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">
                  {!selectedAnalysisId ? 'Seleccione un análisis primero' : 'Seleccione'}
                </option>
                {alcances.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Fuente de emisión <span className="text-red-500">*</span>
              </label>
              <select
                {...register('fuenteEmisionId')}
                disabled={fuentes.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">Seleccione</option>
                {fuentes.map(f => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
              {errors.fuenteEmisionId && (
                <p className="text-xs text-red-500">{errors.fuenteEmisionId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">
                Unidad de medida
                {selectedFuente?.tipoUnidad && (
                  <span className="ml-2 text-[10px] font-normal text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full">
                    {selectedFuente.tipoUnidad.nombre}
                  </span>
                )}
              </label>
              <select
                {...register('unidadEmisionId')}
                disabled={filteredUnidades.length === 0}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
              >
                <option value="">
                  {!watchFuenteId ? 'Seleccione una fuente primero' : 'Seleccione'}
                </option>
                {filteredUnidades.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.simbolo})
                  </option>
                ))}
              </select>
            </div>

            {watchFuenteId && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-semibold text-zinc-700">Subfuente de emisión</label>
                <select
                  {...register('subfuenteEmisionId')}
                  disabled={subfuentes.length === 0}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                  <option value="">Seleccione</option>
                  {subfuentes.map(sf => (
                    <option key={sf.id} value={sf.id}>{sf.nombre}</option>
                  ))}
                </select>
              </div>
            )}
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
            onClick={() => { reset(); removeCsv(); setModoCarga(''); }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw size={16} /> Limpiar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-full hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSubmitting ? 'Registrando...' : 'Registrar emisiones'}
          </button>
        </div>

      </form>
    </div>
  );
};
