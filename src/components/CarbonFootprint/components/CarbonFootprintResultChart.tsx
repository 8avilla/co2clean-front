'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

interface ChartData {
  name: string;
  value: number;
}

interface CarbonFootprintResultChartProps {
  companyName: string;
  year: string;
  data?: ChartData[];
}

// Default mock data based on the provided image
const DEFAULT_DATA: ChartData[] = [
  { name: 'Industrias de la energía', value: 315.46 },
  { name: 'Combustión móvil', value: 73147.00 },
  { name: 'Combustión estacionaria', value: 7.08 },
  { name: 'Industria de la pulpa y el papel', value: 5.31 },
  { name: 'Recarga de Extintores', value: 0.01 },
  { name: 'Sitios de eliminación de desechos gestionados', value: 180.83 },
  { name: 'Tratamiento y eliminación de aguas residuales', value: 148.56 },
];

export const CarbonFootprintResultChart: React.FC<CarbonFootprintResultChartProps> = ({ 
  companyName, 
  year,
  data = DEFAULT_DATA 
}) => {
  
  // Custom label formatter for large numbers
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm w-full">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-zinc-900 uppercase">Emisiones Totales GEI en tCO2e</h2>
        <h3 className="text-lg font-bold text-zinc-800">{companyName}</h3>
        <p className="text-zinc-500 text-sm mt-1">Periodo Reportado: {year}</p>
      </div>

      <div className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 40, right: 30, left: 40, bottom: 100 }}
            barSize={60}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis 
              dataKey="name" 
              angle={-15} 
              textAnchor="end" 
              interval={0}
              tick={{ fontSize: 11, fontWeight: 500, fill: '#52525b' }}
              height={80}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#71717a' }}
              tickFormatter={(value) => formatValue(value)}
            />
            <Tooltip 
              formatter={(value: any) => [formatValue(Number(value || 0)), 'tCO2e']}
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value > 1000 ? '#74d37c' : '#f87171'} // Emerald for high values (like photo), red for low
                  fillOpacity={0.8}
                />
              ))}
              <LabelList 
                dataKey="value" 
                position="top" 
                formatter={(val: any) => formatValue(Number(val || 0))}
                style={{ fontSize: '12px', fontWeight: 'bold', fill: '#18181b' }}
                offset={10}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#74d37c] rounded-full"></div>
          <span className="text-xs text-zinc-600 font-medium text-nowrap">Emisiones Mayores</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#f87171] rounded-full"></div>
          <span className="text-xs text-zinc-600 font-medium text-nowrap">Emisiones Menores</span>
        </div>
      </div>
    </div>
  );
};
