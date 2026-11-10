import type { ChangeEvent, Dispatch, DragEvent, RefObject, SetStateAction } from 'react';
import {
  Upload, FileText, CheckCircle2, X, Download, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { LoadMode } from '../../types';
import { MONTH_KEYS, MONTH_LABELS } from './month-constants';
import { SectionStatus } from './SectionStatus';

import { FORM_LABEL_CLASS, formInputClass } from '@/shared/components/Common/form-styles';
interface CarbonFootprintDataStepProps {
  registrationMode: 'bulk' | 'individual';
  loadMode: LoadMode | '';
  dataComplete: boolean;
  unitSymbol: string;
  csvFormatHref: string;
  showCsvHelp: boolean;
  setShowCsvHelp: Dispatch<SetStateAction<boolean>>;
  csvFile: File | null;
  csvPreview: string[][];
  fileInputRef: RefObject<HTMLInputElement | null>;
  handleDrop: (event: DragEvent<HTMLDivElement>) => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  removeCsv: () => void;
  individualItem: string;
  setIndividualItem: Dispatch<SetStateAction<string>>;
  annualQuantity: string;
  setAnnualQuantity: Dispatch<SetStateAction<string>>;
  monthlyValues: string[];
  setMonthlyValues: Dispatch<SetStateAction<string[]>>;
  monthlyTotal: number;
}

export const CarbonFootprintDataStep = ({
  registrationMode,
  loadMode,
  dataComplete,
  unitSymbol,
  csvFormatHref,
  showCsvHelp,
  setShowCsvHelp,
  csvFile,
  csvPreview,
  fileInputRef,
  handleDrop,
  handleFileChange,
  removeCsv,
  individualItem,
  setIndividualItem,
  annualQuantity,
  setAnnualQuantity,
  monthlyValues,
  setMonthlyValues,
  monthlyTotal,
}: CarbonFootprintDataStepProps) => (
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
          <div className="space-y-1">
            <label className={FORM_LABEL_CLASS}>
              Ítem / Descripción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={individualItem}
              onChange={(e) => setIndividualItem(e.target.value)}
              placeholder="Ej: Gasolina corriente"
              className={formInputClass('teal')}
            />
          </div>

          {/* ── Mejora 6: Unidad junto al input de cantidad ── */}
          {loadMode === 'Annual' && (
            <div className="space-y-1">
              <label className={FORM_LABEL_CLASS}>
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
                <label className={FORM_LABEL_CLASS}>
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
);
