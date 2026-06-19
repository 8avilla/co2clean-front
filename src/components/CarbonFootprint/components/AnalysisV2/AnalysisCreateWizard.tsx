'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  AlertCircle,
  BarChart2,
  CheckCircle2,
  ChevronRight,
  Loader2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { ApiCarbonFootprintAnalysis, CarbonFootprintAnalysisStandard } from '../../types';

interface AnalysisCreateWizardProps {
  companyId: string;
  existingAnalyses: ApiCarbonFootprintAnalysis[];
  onConfirm: (year: number, standard: CarbonFootprintAnalysisStandard) => Promise<void>;
  onClose: () => void;
  getRecordCount: (companyId: string, year: number) => Promise<number>;
}

const CURRENT_YEAR = new Date().getFullYear();
const AVAILABLE_YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export const AnalysisCreateWizard = ({
  companyId,
  existingAnalyses,
  onConfirm,
  onClose,
  getRecordCount,
}: AnalysisCreateWizardProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [standard, setStandard] = useState<CarbonFootprintAnalysisStandard>('GHG_Protocol');
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const alreadyExists = existingAnalyses.some(
    a => a.year === year && a.standard === standard && a.status !== 'Deleted'
  );

  const loadCount = useCallback(async () => {
    setLoadingCount(true);
    setRecordCount(null);
    try {
      const count = await getRecordCount(companyId, year);
      setRecordCount(count);
    } catch {
      setRecordCount(0);
    } finally {
      setLoadingCount(false);
    }
  }, [companyId, year, getRecordCount]);

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  const handleNext = () => {
    if (alreadyExists) return;
    setStep(2);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onConfirm(year, standard);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear el análisis');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />

      <div className="relative bg-white rounded-2xl shadow-xl border border-zinc-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <BarChart2 size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">Nuevo análisis</h2>
              <p className="text-xs text-zinc-500">
                Paso {step} de 2 — {step === 1 ? 'Parámetros' : 'Confirmación'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-5 flex items-center gap-2">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-2 flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black border-2 flex-shrink-0 transition-colors ${
                  step === n
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : step > n
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : 'bg-white border-zinc-300 text-zinc-400'
                }`}
              >
                {step > n ? <CheckCircle2 size={12} /> : n}
              </div>
              {n < 2 && (
                <div
                  className={`flex-1 h-0.5 rounded-full ${step > n ? 'bg-emerald-400' : 'bg-zinc-200'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="px-6 py-5 space-y-5">
          {step === 1 ? (
            <>
              {/* Year selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Año de reporte
                </label>
                <select
                  value={year}
                  onChange={e => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                >
                  {AVAILABLE_YEARS.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Standard selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Estándar de reporte
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['GHG_Protocol', 'ISO_14064'] as const).map(std => (
                    <button
                      key={std}
                      type="button"
                      onClick={() => setStandard(std)}
                      className={`px-3 py-2.5 rounded-xl border text-sm font-bold transition-all ${
                        standard === std
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                          : 'bg-white text-zinc-700 border-zinc-200 hover:border-blue-300'
                      }`}
                    >
                      {std === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data availability indicator */}
              {loadingCount ? (
                <div className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl text-sm text-zinc-500">
                  <Loader2 size={14} className="animate-spin" />
                  Verificando registros disponibles...
                </div>
              ) : alreadyExists ? (
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0 text-red-500" />
                  <p>
                    Ya existe un análisis activo para <strong>{year}</strong> con{' '}
                    <strong>
                      {standard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064'}
                    </strong>
                    . Elimínalo primero para crear uno nuevo.
                  </p>
                </div>
              ) : recordCount === 0 ? (
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                  <p>
                    No hay registros de emisiones para <strong>{year}</strong>. El análisis se
                    creará vacío.
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                  <p>
                    Se encontraron <strong>{recordCount} registros</strong> de emisiones para{' '}
                    <strong>{year}</strong>. Listos para analizar.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Step 2: Confirmation summary */}
              <div className="bg-zinc-50 rounded-xl p-4 space-y-3 text-sm">
                <h3 className="font-bold text-zinc-700 text-xs uppercase tracking-wider">
                  Resumen del análisis
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-zinc-400">Año</p>
                    <p className="font-bold text-zinc-900 text-lg">{year}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Estándar</p>
                    <p className="font-bold text-zinc-900">
                      {standard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-zinc-400">Registros de emisión</p>
                    <p className="font-bold text-zinc-900">
                      {recordCount !== null ? `${recordCount} registros` : 'Cargando...'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-zinc-500 leading-relaxed">
                Al confirmar, se creará el análisis y se iniciará el procesamiento en el servidor. El
                estado pasará a <strong>En proceso</strong> mientras se calculan las emisiones.
              </p>

              {submitError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  <TriangleAlert size={14} className="shrink-0" />
                  {submitError}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-5 flex gap-3">
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleNext}
                disabled={alreadyExists || loadingCount}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight size={15} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-zinc-600 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50"
              >
                Atrás
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear e Inicializar'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
