'use client';

import React, { useState, useEffect } from 'react';
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

interface EmissionFactor {
  id: string;
  name: string;
  category: 'alcance_1' | 'alcance_2' | 'alcance_3';
  source: string;
  value: number;
  unit: string;
  description: string;
}

const DEFAULT_FACTORS: EmissionFactor[] = [
  // Alcance 1
  {
    id: 'f_gasoline',
    name: 'Gasolina',
    category: 'alcance_1',
    source: 'Combustión Móvil',
    value: 8.78,
    unit: 'kg CO2e / Galón',
    description: 'Factor de emisión para el consumo de gasolina de motor en vehículos de la organización.'
  },
  {
    id: 'f_diesel',
    name: 'Diesel (ACPM)',
    category: 'alcance_1',
    source: 'Combustión Móvil',
    value: 10.21,
    unit: 'kg CO2e / Galón',
    description: 'Factor de emisión para vehículos pesados u operativos que consumen Diesel.'
  },
  {
    id: 'f_gnv',
    name: 'Gas Natural Vehicular (GNV)',
    category: 'alcance_1',
    source: 'Combustión Móvil',
    value: 1.92,
    unit: 'kg CO2e / m³',
    description: 'Factor de emisión para vehículos convertidos a gas natural.'
  },
  {
    id: 'f_gas_natural',
    name: 'Gas Natural (Residencial/Industrial)',
    category: 'alcance_1',
    source: 'Combustión Estacionaria',
    value: 1.90,
    unit: 'kg CO2e / m³',
    description: 'Uso de gas natural en calderas, cocinas o calentadores estacionarios.'
  },
  {
    id: 'f_extinguisher',
    name: 'Recarga de Extintores CO2',
    category: 'alcance_1',
    source: 'Recarga de Extintores',
    value: 1.00,
    unit: 'kg CO2e / kg',
    description: 'Emisiones directas por liberación de gases refrigerantes o carga de extintores.'
  },
  // Alcance 2
  {
    id: 'f_sin',
    name: 'Sistema Interconectado Nacional (SIN)',
    category: 'alcance_2',
    source: 'Uso de energía eléctrica',
    value: 0.126,
    unit: 'kg CO2e / kWh',
    description: 'Factor de emisión de la red eléctrica nacional de Colombia (XM / UPME).'
  },
  // Alcance 3
  {
    id: 'f_paper',
    name: 'Uso de Papel de Oficina',
    category: 'alcance_3',
    source: 'Uso de papel',
    value: 2.90,
    unit: 'kg CO2e / kg',
    description: 'Emisiones indirectas asociadas al ciclo de vida del papel de oficina consumido.'
  },
  {
    id: 'f_waste',
    name: 'Residuos Sólidos Ordinarios',
    category: 'alcance_3',
    source: 'Eliminación de Residuos',
    value: 0.45,
    unit: 'kg CO2e / kg',
    description: 'Emisiones de metano y otros asociadas a la disposición de residuos ordinarios en rellenos.'
  },
  {
    id: 'f_wastewater',
    name: 'Tratamiento de Aguas Residuales',
    category: 'alcance_3',
    source: 'Tratamiento de Aguas',
    value: 0.38,
    unit: 'kg CO2e / m³',
    description: 'Emisiones asociadas al tratamiento aeróbico/anaeróbico de efluentes líquidos.'
  }
];

const STORAGE_KEY = 'cleanco2_emission_factors_by_year';

export const CarbonFootprintParameters = () => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [allYearsFactors, setAllYearsFactors] = useState<Record<string, EmissionFactor[]>>({});
  const [factors, setFactors] = useState<EmissionFactor[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'alcance_1' | 'alcance_2' | 'alcance_3'>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Load factors on mount and set initial state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      let parsedStore: Record<string, EmissionFactor[]> = {};
      if (stored) {
        parsedStore = JSON.parse(stored);
      }
      setAllYearsFactors(parsedStore);
      
      // Select initial factors for current year
      if (parsedStore[selectedYear]) {
        setFactors(parsedStore[selectedYear]);
      } else {
        setFactors(DEFAULT_FACTORS);
      }
    }
  }, []);

  // Update factors when selectedYear changes
  useEffect(() => {
    if (allYearsFactors[selectedYear]) {
      setFactors(allYearsFactors[selectedYear]);
    } else {
      // If no custom factors exist for this year, instantiate with DEFAULT_FACTORS
      setFactors(DEFAULT_FACTORS);
    }
  }, [selectedYear, allYearsFactors]);

  const handleValueChange = (id: string, val: string) => {
    const parsed = parseFloat(val);
    setFactors(prev => prev.map(f => {
      if (f.id === id) {
        return { ...f, value: isNaN(parsed) ? 0 : parsed };
      }
      return f;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      const updatedStore = {
        ...allYearsFactors,
        [selectedYear]: factors
      };
      setAllYearsFactors(updatedStore);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStore));
      toast.success(`Parámetros del año ${selectedYear} guardados correctamente`);
    } catch (e) {
      toast.error('Error al guardar los parámetros');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm(`¿Estás seguro de restablecer los factores del año ${selectedYear} a los valores por defecto oficiales?`)) {
      const updatedStore = {
        ...allYearsFactors,
        [selectedYear]: DEFAULT_FACTORS
      };
      setAllYearsFactors(updatedStore);
      setFactors(DEFAULT_FACTORS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStore));
      toast.success(`Factores del año ${selectedYear} restablecidos exitosamente`);
    }
  };

  const filteredFactors = activeTab === 'all' 
    ? factors 
    : factors.filter(f => f.category === activeTab);

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'alcance_1':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Alcance 1 (Directo)
          </span>
        );
      case 'alcance_2':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            Alcance 2 (Indirecto)
          </span>
        );
      case 'alcance_3':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Alcance 3 (Otras)
          </span>
        );
      default:
        return null;
    }
  };

  const getSourceIcon = (source: string) => {
    if (source.includes('eléctrica') || source.includes('Nacional')) {
      return <Zap className="text-amber-500" size={16} />;
    }
    if (source.includes('Estacionaria')) {
      return <Flame className="text-orange-500" size={16} />;
    }
    if (source.includes('Móvil')) {
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
          {/* Year selector */}
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
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 hover:text-zinc-900 transition-colors shadow-sm"
          >
            <RefreshCw size={16} />
            Restablecer {selectedYear}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
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
      <div className="flex border-b border-zinc-200 gap-1 bg-zinc-50/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'all'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Todos los Factores ({selectedYear})
        </button>
        <button
          onClick={() => setActiveTab('alcance_1')}
          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'alcance_1'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Alcance 1 (Directos)
        </button>
        <button
          onClick={() => setActiveTab('alcance_2')}
          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'alcance_2'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Alcance 2 (Electricidad)
        </button>
        <button
          onClick={() => setActiveTab('alcance_3')}
          className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'alcance_3'
              ? 'bg-white text-zinc-950 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Alcance 3 (Indirectas)
        </button>
      </div>

      {/* Table of Factors */}
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
                <tr key={factor.id} className="hover:bg-zinc-50/50 transition-colors group">
                  {/* Concept / Factor */}
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-zinc-100 rounded-lg group-hover:bg-white transition-colors">
                          {getSourceIcon(factor.source)}
                        </div>
                        <span className="font-bold text-zinc-950 text-sm">{factor.name}</span>
                      </div>
                      <p className="text-zinc-500 text-xs leading-relaxed pl-7 max-w-sm">
                        {factor.description}
                      </p>
                    </div>
                  </td>

                  {/* Scope Category */}
                  <td className="p-4 align-middle">
                    {getCategoryBadge(factor.category)}
                  </td>

                  {/* Emission Source */}
                  <td className="p-4 align-middle text-zinc-600 font-medium">
                    {factor.source}
                  </td>

                  {/* Editable Value and Unit */}
                  <td className="p-4 align-middle text-right">
                    <div className="inline-flex items-center gap-3">
                      <input
                        type="number"
                        step="any"
                        value={factor.value}
                        onChange={(e) => handleValueChange(factor.id, e.target.value)}
                        className="w-28 px-3 py-1.5 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-right font-bold text-sm text-zinc-800"
                      />
                      <span className="text-xs font-semibold text-zinc-400 w-28 text-left truncate" title={factor.unit}>
                        {factor.unit}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Warning Footer */}
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
