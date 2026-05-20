'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  CarbonFootprintData, 
  CarbonFootprintSchema, 
  MODOS_CARGA, 
  CATEGORIAS, 
  FUENTES, 
  SUBFUENTES_MOVIL, 
  UNIDADES 
} from '../types';
import { CarbonFootprintService } from '../services/carbonFootprint.service';
import { CompanyService } from '../../Companies/services/company.service';
import { ApiHeadquarter } from '../../Companies/types';
import { useRouter } from 'next/navigation';

function getActiveCompanyFromSession(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { company?: { id: string; name: string } | null };
    return parsed.company ?? null;
  } catch {
    return null;
  }
}

export const CarbonFootprintForm = () => {
  const router = useRouter();
  const [activeCompany] = useState(() => getActiveCompanyFromSession());
  const [branches, setBranches] = useState<ApiHeadquarter[]>([]);
  
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<CarbonFootprintData>({
    resolver: zodResolver(CarbonFootprintSchema),
    defaultValues: {
      anio: new Date().getFullYear().toString()
    }
  });

  const watchFuente = watch('fuente');

  // Set active company in form and load its branches on mount
  useEffect(() => {
    if (!activeCompany) return;
    setValue('empresaId', activeCompany.id);
    const loadBranches = async () => {
      try {
        const data = await CompanyService.getHeadquarters(activeCompany.id);
        setBranches(data);
      } catch {
        toast.error('Error al cargar las sedes');
      }
    };
    loadBranches();
  }, [activeCompany, setValue]);

  // Reset or set subfuente depending on fuente
  useEffect(() => {
    if (watchFuente) {
      if (watchFuente === 'movil') {
        setValue('subfuente', ''); // Reset so they have to choose
      } else {
        const fuenteObj = FUENTES.find(f => f.id === watchFuente);
        if (fuenteObj) {
          setValue('subfuente', fuenteObj.nombre); // Set automatically
        }
      }
    } else {
      setValue('subfuente', '');
    }
  }, [watchFuente, setValue]);

  // Determine subfuente options based on fuente
  const getSubfuenteOptions = () => {
    if (!watchFuente) return [];
    if (watchFuente === 'movil') return SUBFUENTES_MOVIL;
    const fuenteObj = FUENTES.find(f => f.id === watchFuente);
    return fuenteObj ? [fuenteObj.nombre] : [];
  };

  const subfuenteOptions = getSubfuenteOptions();

  // CSV Drag and Drop Handlers
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

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const lines = text.trim().split('\n').filter(l => l.trim());
        const data = lines.map(l => l.split(',').map(c => c.trim().replace(/^"|"$/g, '')));
        setCsvData(data);
        setFileName(file.name);
      }
    };
    reader.readAsText(file);
  };

  const removeCsv = () => {
    setCsvData([]);
    setFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: CarbonFootprintData) => {
    if (csvData.length === 0) {
      toast.error('Debe cargar el archivo CSV con los datos de huella de carbono.');
      return;
    }
    
    try {
      await CarbonFootprintService.createCarbonFootprint(data);
      toast.success('Emisión registrada exitosamente');
      router.push('/huella-carbono');
      router.refresh();
    } catch {
      toast.error('Error al registrar la emisión');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({length: 10}, (_, i) => currentYear - i);

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
        
        {/* Identificación Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center gap-2 bg-teal-50/30">
            <Building2 className="text-teal-600" size={18} />
            <h2 className="font-bold text-sm text-zinc-900">Identificación</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Empresa</label>
              <input
                readOnly
                value={activeCompany?.name ?? 'Sin empresa activa'}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 outline-none text-sm cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Sede <span className="text-red-500">*</span></label>
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
              <label className="text-sm font-semibold text-zinc-700">Año de reporte <span className="text-red-500">*</span></label>
              <select 
                {...register('anio')}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y} {y === currentYear ? '(Actual)' : ''}</option>
                ))}
              </select>
              {errors.anio && <p className="text-xs text-red-500">{errors.anio.message}</p>}
            </div>
          </div>
        </div>

        {/* Carga de Datos Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center justify-between bg-teal-50/30">
            <div className="flex items-center gap-2">
              <Upload className="text-teal-600" size={18} />
              <h2 className="font-bold text-sm text-zinc-900">Carga de datos <span className="text-red-500">*</span></h2>
            </div>
            <a href="#" className="flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:text-teal-700 hover:underline">
              <Download size={14} /> Descargar formato CSV
            </a>
          </div>
          <div className="p-4 space-y-3">
            <div className="space-y-2 lg:w-1/3 mb-4">
              <label className="text-sm font-semibold text-zinc-700">Modo de carga</label>
              <select 
                {...register('modoCarga')}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
              >
                <option value="">Seleccione el modo de carga (formato)</option>
                {MODOS_CARGA.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                csvData.length > 0 
                  ? 'border-teal-500 bg-teal-50/20' 
                  : 'border-zinc-200 bg-zinc-50 hover:border-teal-400'
              }`}
            >
              {csvData.length > 0 ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle2 className="text-teal-500" size={32} />
                  <span className="font-bold text-teal-900">{fileName}</span>
                  <span className="text-xs text-zinc-500">{csvData.length - 1} registros detectados</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="text-zinc-400" size={32} />
                  <p className="text-sm font-semibold text-zinc-700">Arrastra tu archivo CSV aquí o haz clic para seleccionar</p>
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

            {csvData.length > 0 && (
              <div className="mt-4 border border-zinc-200 rounded-lg overflow-hidden">
                <div className="flex justify-between items-center bg-zinc-50 p-2 px-4 border-b border-zinc-200">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Vista Previa (5 filas)</span>
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
                        {csvData[0].map((h, i) => (
                          <th key={i} className="p-3 font-semibold text-zinc-600 border-b border-zinc-200">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {csvData.slice(1, 6).map((row, i) => (
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

        {/* Detalles de Emisión Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-4 border-b border-zinc-50 flex items-center gap-2 bg-teal-50/30">
            <Flame className="text-teal-600" size={18} />
            <h2 className="font-bold text-sm text-zinc-900">Detalles de emisión</h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="space-y-2 lg:col-span-1">
              <label className="text-sm font-semibold text-zinc-700">Categoría <span className="text-red-500">*</span></label>
              <select 
                {...register('categoria')}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
              >
                <option value="">Seleccione</option>
                {CATEGORIAS.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              {errors.categoria && <p className="text-xs text-red-500">{errors.categoria.message}</p>}
            </div>

            <div className="space-y-2 lg:col-span-1">
              <label className="text-sm font-semibold text-zinc-700">Fuente de emisión <span className="text-red-500">*</span></label>
              <select 
                {...register('fuente')}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
              >
                <option value="">Seleccione</option>
                {FUENTES.map(f => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
              {errors.fuente && <p className="text-xs text-red-500">{errors.fuente.message}</p>}
            </div>

            <div className="space-y-2 lg:col-span-1">
              <label className="text-sm font-semibold text-zinc-700">Unidad de medida</label>
              <select 
                {...register('unidad')}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
              >
                <option value="">Seleccione</option>
                {UNIDADES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {watchFuente && (
              <div className="space-y-2 lg:col-span-1 animate-in fade-in slide-in-from-top-2">
                <label className="text-sm font-semibold text-zinc-700">Subfuente de emisión <span className="text-red-500">*</span></label>
                <select 
                  {...register('subfuente')}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-sm"
                >
                  <option value="">Seleccione</option>
                  {subfuenteOptions.map(sf => (
                    <option key={sf} value={sf}>{sf}</option>
                  ))}
                </select>
                {errors.subfuente && <p className="text-xs text-red-500">{errors.subfuente.message}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Warning Note */}
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm flex gap-2">
          <span className="font-bold">Nota:</span>
          <p>Complete todos los campos obligatorios (*) antes de calcular la huella de carbono.</p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
          <button 
            type="button"
            onClick={() => { reset(); removeCsv(); }}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition-colors"
          >
            <RefreshCw size={16} /> Limpiar
          </button>


          <button 
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-full hover:bg-teal-700 shadow-md shadow-teal-500/20 transition-all active:scale-95"
          >
            <Calculator size={16} /> Calcular huella
          </button>
        </div>

      </form>
    </div>
  );
};
