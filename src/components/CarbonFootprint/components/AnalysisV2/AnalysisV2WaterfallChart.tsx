'use client';

import { useMemo, useState } from 'react';
import { GroupedResult } from './hooks/useAnalysisResults';
import { CHART_COLORS } from './AnalysisV2EmissionsChart';

interface AnalysisV2WaterfallChartProps {
  groups: GroupedResult[];
  totalTco2e: number;
}

interface WaterfallBar {
  id: string;
  name: string;
  shortName: string;
  value: number;
  cumBase: number;
  color: string;
  isTotal: boolean;
}

const SVG_W = 700;
const SVG_H = 280;
const PAD = { top: 24, right: 24, bottom: 56, left: 58 };

function fmtVal(v: number): string {
  if (v === 0) return '0';
  if (v >= 1) return Math.round(v).toLocaleString('es-CO');
  return v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

export const AnalysisV2WaterfallChart = ({ groups, totalTco2e }: AnalysisV2WaterfallChartProps) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const bars = useMemo<WaterfallBar[]>(() => {
    const cats = groups
      .flatMap((g, gIdx) =>
        g.categories.map(cat => ({
          id: `${g.groupId}:${cat.categoryId}`,
          name: cat.categoryName,
          shortName: truncate(cat.categoryName, 11),
          value: cat.tco2e,
          color: CHART_COLORS[gIdx % CHART_COLORS.length],
        }))
      )
      .sort((a, b) => b.value - a.value);

    let cum = 0;
    const result: WaterfallBar[] = cats.map(c => {
      const bar: WaterfallBar = { ...c, cumBase: cum, isTotal: false };
      cum += c.value;
      return bar;
    });

    result.push({
      id: 'total',
      name: 'Total',
      shortName: 'Total',
      value: totalTco2e,
      cumBase: 0,
      color: '#8b5cf6',
      isTotal: true,
    });

    return result;
  }, [groups, totalTco2e]);

  if (bars.length <= 1) return null;

  const chartW = SVG_W - PAD.left - PAD.right;
  const chartH = SVG_H - PAD.top - PAD.bottom;
  const maxVal = totalTco2e > 0 ? totalTco2e * 1.08 : 1;

  const scaleY = (v: number) => chartH - (v / maxVal) * chartH;
  const barWidth = Math.min(48, (chartW / bars.length) * 0.62);
  const barSpacing = chartW / bars.length;

  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (maxVal * i) / tickCount);

  const hoveredBar = hovered ? bars.find(b => b.id === hovered) : null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-50">
        <h3 className="text-sm font-bold text-zinc-900">Gráfico de Cascada</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Contribución acumulada por categoría hasta el total global</p>
      </div>

      <div className="px-2 py-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full min-w-[360px]"
          style={{ height: SVG_H }}
          aria-label="Gráfico de cascada de emisiones"
        >
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {/* Y-axis grid + labels */}
            {ticks.map((tick, i) => {
              const y = scaleY(tick);
              return (
                <g key={i}>
                  <line x1={0} y1={y} x2={chartW} y2={y} stroke="#f4f4f5" strokeWidth={1} />
                  <text
                    x={-8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={9}
                    fill="#a1a1aa"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {fmtVal(tick)}
                  </text>
                </g>
              );
            })}

            {/* Baseline */}
            <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#e4e4e7" strokeWidth={1} />

            {/* Bars */}
            {bars.map((bar, i) => {
              const bx = i * barSpacing + (barSpacing - barWidth) / 2;
              const barH = (bar.value / maxVal) * chartH;
              const barY = bar.isTotal ? scaleY(bar.value) : scaleY(bar.cumBase + bar.value);
              const isHov = hovered === bar.id;

              // Connector to next bar
              const nextBar = bars[i + 1];
              const connX2 = nextBar
                ? (i + 1) * barSpacing + (barSpacing - barWidth) / 2
                : bx + barWidth;
              const connY = bar.isTotal ? scaleY(bar.value) : scaleY(bar.cumBase + bar.value);

              return (
                <g key={bar.id}>
                  {/* Dashed connector */}
                  {!bar.isTotal && nextBar && !nextBar.isTotal && (
                    <line
                      x1={bx + barWidth}
                      y1={connY}
                      x2={connX2}
                      y2={connY}
                      stroke="#d4d4d8"
                      strokeWidth={1}
                      strokeDasharray="3,3"
                    />
                  )}

                  {/* Bar rectangle */}
                  <rect
                    x={bx}
                    y={barY}
                    width={barWidth}
                    height={Math.max(0, barH)}
                    fill={bar.color}
                    opacity={hovered === null ? (bar.isTotal ? 1 : 0.78) : isHov ? 1 : 0.25}
                    rx={3}
                    className="cursor-pointer transition-opacity duration-150"
                    onMouseEnter={() => setHovered(bar.id)}
                    onMouseLeave={() => setHovered(null)}
                  />

                  {/* Value label above bar */}
                  {barH > 14 && (
                    <text
                      x={bx + barWidth / 2}
                      y={barY - 4}
                      textAnchor="middle"
                      fontSize={9}
                      fill="#71717a"
                      pointerEvents="none"
                      style={{ fontFamily: 'system-ui, sans-serif' }}
                    >
                      {fmtVal(bar.value)}
                    </text>
                  )}

                  {/* X-axis label */}
                  <text
                    x={bx + barWidth / 2}
                    y={chartH + 16}
                    textAnchor="middle"
                    fontSize={9}
                    fill={bar.isTotal ? '#8b5cf6' : '#71717a'}
                    fontWeight={bar.isTotal ? '700' : '400'}
                    pointerEvents="none"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {bar.shortName}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* Tooltip row */}
      <div className="h-9 mx-4 mb-3 flex items-center">
        {hoveredBar ? (
          <div className="w-full px-3 py-2 bg-zinc-900 rounded-lg text-xs text-white flex justify-between gap-4">
            <span className="font-semibold truncate">{hoveredBar.name}</span>
            <span className="tabular-nums shrink-0 font-mono">
              {Math.round(hoveredBar.value).toLocaleString('es-CO')} tCO₂e
              {!hoveredBar.isTotal && ` · ${Math.round((hoveredBar.value / totalTco2e) * 100)}%`}
            </span>
          </div>
        ) : (
          <p className="text-xs text-zinc-400 italic px-1">Pasa el cursor sobre una barra para ver el detalle</p>
        )}
      </div>

      <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {bars.length - 1} {bars.length - 1 === 1 ? 'categoría' : 'categorías'}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-zinc-900 tabular-nums">{Math.round(totalTco2e).toLocaleString('es-CO')}</span>
          <span className="text-sm text-zinc-400">tCO₂e</span>
        </div>
      </div>
    </div>
  );
};
