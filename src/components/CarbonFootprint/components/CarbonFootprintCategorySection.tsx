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

interface TableRow {
  name: string;
  co2: string;
  co2b?: string;
  ch4: string;
  n2o: string;
  total: string;
  percentage: string;
  isGroup?: boolean;
}

interface CarbonFootprintCategorySectionProps {
  categoryNumber: number;
  categoryTitle: string;
  description: string;
  chartData: { name: string; value: number }[];
  tableData: TableRow[];
  totalValue: string;
  totalPercentage: string;
}

export const CarbonFootprintCategorySection: React.FC<CarbonFootprintCategorySectionProps> = ({
  categoryNumber,
  categoryTitle,
  description,
  chartData,
  tableData,
  totalValue,
  totalPercentage
}) => {
  return (
    <div className="space-y-6 py-8 border-t border-zinc-100 first:border-t-0">
      <div className="space-y-3">
        <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full"></span>
          Categoría {categoryNumber}: {categoryTitle}:
        </h3>
        <p className="text-sm text-zinc-600 leading-relaxed max-w-4xl">
          {description}
        </p>
      </div>

      {/* Chart Card */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="text-center mb-6">
          <h4 className="text-base font-bold text-zinc-800">Emisiones GEI en tCO2e</h4>
          <p className="text-sm font-bold text-zinc-900 uppercase">Categoría: {categoryTitle}</p>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10, fill: '#52525b' }} 
                interval={0}
                angle={-10}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
              />
              <Bar dataKey="value" barSize={50} radius={[4, 4, 0, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={['#0097a7', '#ff8a65', '#90a4ae', '#4db6ac'][index % 4]} />
                ))}
                <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-center text-[10px] text-zinc-400 mt-4 italic">Figura {categoryNumber + 1}: {categoryTitle} en tCO2e</p>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        <div className="bg-zinc-800 text-white p-2 text-center text-[10px] font-bold uppercase tracking-widest">
          Categoría: {categoryTitle}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100 text-zinc-500 uppercase font-bold">
                <th className="p-2 text-left">Categoría</th>
                <th className="p-2 text-center">CO2</th>
                <th className="p-2 text-center">CO2(b)</th>
                <th className="p-2 text-center">CH4</th>
                <th className="p-2 text-center">N2O</th>
                <th className="p-2 text-center bg-zinc-100/50">Ton CO2e</th>
                <th className="p-2 text-center">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              <tr className="font-bold bg-zinc-50/30">
                <td className="p-2 text-zinc-900">Total de emisiones</td>
                <td colSpan={4} className="p-2 text-center text-zinc-400 font-normal">Ver detalle por fuente</td>
                <td className="p-2 text-center text-teal-700 bg-teal-50/20 font-black">{totalValue}</td>
                <td className="p-2 text-center text-zinc-900">{totalPercentage}</td>
              </tr>
              {tableData.map((row, i) => (
                <React.Fragment key={i}>
                  {row.isGroup ? (
                    <tr className="bg-zinc-100/50">
                      <td colSpan={7} className="p-1.5 px-3 font-black text-[9px] uppercase tracking-tighter text-zinc-400">{row.name}</td>
                    </tr>
                  ) : (
                    <tr>
                      <td className="p-2 text-zinc-700 font-medium">{row.name}</td>
                      <td className="p-2 text-center text-zinc-600">{row.co2}</td>
                      <td className="p-2 text-center text-zinc-600">{row.co2b || '-'}</td>
                      <td className="p-2 text-center text-zinc-600">{row.ch4}</td>
                      <td className="p-2 text-center text-zinc-600">{row.n2o}</td>
                      <td className="p-2 text-center font-bold text-zinc-900">{row.total}</td>
                      <td className="p-2 text-center text-zinc-500">{row.percentage}</td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-[10px] text-zinc-400 italic">Tabla {categoryNumber + 3}: {categoryTitle} totales en tCO2e</p>
    </div>
  );
};
