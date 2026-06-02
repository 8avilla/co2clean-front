'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  RefreshCw,
  Save,
  Zap,
  Flame,
  Truck,
  FileText,
  Info,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { EmissionFactorsService } from '../services/catalogs.service';
import { ApiEmissionFactor } from '../types';

interface FactorRow extends ApiEmissionFactor {
  isDirty: boolean;
}

export const CarbonFootprintParameters = () => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [factors, setFactors] = useState<FactorRow[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadFactors = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await EmissionFactorsService.getAll({ year: parseInt(selectedYear) });
      setFactors(data.map(f => ({ ...f, isDirty: false })));
    } catch {
      toast.error('Error al cargar los factores de emisión');
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadFactors();
  }, [loadFactors]);

  const handleValueChange = (id: string, val: string) => {
    const parsed = parseFloat(val);
    setFactors(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, value: isNaN(parsed) ? 0 : parsed, isDirty: true };
      }
      return f;
    }));
  };

  const handleSave = async () => {
    const dirtyFactors = factors.filter(f => f.isDirty);
    if (dirtyFactors.length === 0) {
      toast.info('No hay cambios para guardar');
      return;
    }
    setIsSaving(true);
    try {
      await Promise.all(
        dirtyFactors.map(f => EmissionFactorsService.update(f.id, { value: f.value }))
      );
      setFactors(prev => prev.map(f => ({ ...f, isDirty: false })));
      toast.success(`Factores del año ${selectedYear} guardados correctamente`);
    } catch {
      toast.error('Error al guardar los factores');
    } finally {
      setIsSaving(false);
    }
  };

  const uniqueAlcances = Array.from(
    new Map(
      factors
        .filter(f => f.emissionGroup)
        .map(f => [f.emissionGroupId, f.emissionGroup!])
    ).entries()
  ).map(([id, grupo]) => ({ id, nombre: grupo.name }));

  const filteredFactors = activeTab === 'all'
    ? factors
    : factors.filter(f => f.emissionGroupId === activeTab);

  const hasDirtyFactors = factors.some(f => f.isDirty);

  const getCategoryBadge = (factor: ApiEmissionFactor) => {
    const nombre = factor.emissionGroup?.name ?? '';
    const codigo = factor.emissionGroup?.code ?? '';
    if (codigo === '1' || nombre.includes('1')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          {nombre || 'Alcance 1'}
        </span>
      );
    }
    if (codigo === '2' || nombre.includes('2')) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
          {nombre || 'Alcance 2'}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        {nombre || 'Alcance 3'}
      </span>
    );
  };

  const getSourceIcon = (sourceName: string) => {
    if (sourceName.includes('eléctrica') || sourceName.includes('Nacional') || sourceName.includes('SIN')) {
      return <Zap className="text-amber-500" size={16} />;
    }
    if (sourceName.includes('Estacionaria') || sourceName.includes('gas') || sourceName.includes('Gas')) {
      return <Flame className="text-orange-500" size={16} />;
    }
    if (sourceName.includes('Móvil') || sourceName.includes('movil') || sourceName.includes('Transporte')) {
      return <Truck className="text-blue-500" size={16} />;
    }
    return <FileText className="text-zinc-500" size={16} />;
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="text-emerald-600" size={24} />
            <h1 className="text-2xl font-bold text-zinc-950">Factores de emisión</h1>
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Gestione y personalice los Factores de Emisión de CO2e oficiales para cada año de reporte.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-100 rounded-xl px-3 py-2 border border-zinc-200">
            <Calendar className="text-zinc-500" size={16} />
            <span className="text-sm font-semibold text-zinc-600">Año de reporte:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-zinc-900 outline-none cursor-pointer focus:ring-0"
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving || !hasDirtyFactors}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95"
          >
            {isSaving ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            {isSaving ? 'Guardando...' : `Guardar Año ${selectedYear}`}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 gap-1 bg-zinc-50/50 p-1 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Todos los Factores ({selectedYear})
        </button>
        {uniqueAlcances.map(alcance => (
          <button
            key={alcance.id}
            onClick={() => setActiveTab(alcance.id)}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === alcance.id
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            {alcance.nombre.match(/(?:Alcance|Categoría|Grupo)\s*\d+/i)?.[0] ?? alcance.nombre}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-zinc-400">
          <RefreshCw size={24} className="animate-spin mr-3" />
          <span className="text-sm font-medium">Cargando factores de emisión...</span>
        </div>
      ) : factors.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center">
          <FileText className="mx-auto text-zinc-300 mb-3" size={40} />
          <p className="text-zinc-500 font-medium">
            No hay factores de emisión registrados para el año {selectedYear}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="p-4 font-bold text-zinc-700 w-[30%]">Concepto / Factor ({selectedYear})</th>
                  <th className="p-4 font-bold text-zinc-700 w-[18%]">Alcance</th>
                  <th className="p-4 font-bold text-zinc-700 w-[22%]">Fuente de Emisión</th>
                  <th className="p-4 font-bold text-zinc-700 text-right w-[30%]">Valor & Unidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredFactors.map(factor => (
                  <tr
                    key={factor.id}
                    className={`hover:bg-zinc-50/50 transition-colors group ${factor.isDirty ? 'bg-amber-50/30' : ''}`}
                  >
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-zinc-100 rounded-lg group-hover:bg-white transition-colors">
                            {getSourceIcon(factor.emissionSource?.name ?? '')}
                          </div>
                          <span className="font-bold text-zinc-950 text-sm">{factor.name}</span>
                          {factor.isDirty && (
                            <span className="text-xs text-amber-600 font-semibold">• Modificado</span>
                          )}
                        </div>
                        {factor.description && (
                          <p className="text-zinc-500 text-xs leading-relaxed pl-7 max-w-sm">
                            {factor.description}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="p-4 align-middle">
                      {getCategoryBadge(factor)}
                    </td>

                    <td className="p-4 align-middle text-zinc-600 font-medium">
                      <span>{factor.emissionSource?.name ?? factor.emissionSourceId}</span>
                      {factor.emissionSubsource && (
                        <span className="block text-xs text-zinc-400">{factor.emissionSubsource.name}</span>
                      )}
                    </td>

                    <td className="p-4 align-middle text-right">
                      <div className="inline-flex items-center gap-3">
                        <input
                          type="number"
                          step="any"
                          value={factor.value}
                          onChange={(e) => handleValueChange(factor.id, e.target.value)}
                          className="w-28 px-3 py-1.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-right font-bold text-sm text-zinc-800"
                        />
                        <span
                          className="text-xs font-semibold text-zinc-400 w-28 text-left truncate"
                          title={factor.emissionUnit?.name}
                        >
                          {factor.emissionUnit?.symbol ?? factor.emissionUnit?.name ?? factor.emissionUnitId}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info footer */}
      <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-emerald-950 text-sm">
        <div className="p-1 bg-emerald-100/50 rounded-lg h-fit text-emerald-700">
          <Info size={18} />
        </div>
        <div>
          <h4 className="font-bold">Información de los factores anuales de cálculo</h4>
          <p className="text-emerald-800/90 mt-0.5 leading-relaxed">
            Los factores de emisión de fuentes eléctricas o el SIN cambian dinámicamente cada año debido a la composición de la matriz energética nacional. Por favor, asegúrese de seleccionar el año de reporte correcto antes de parametrizar sus factores.
          </p>
        </div>
      </div>
    </div>
  );
};
