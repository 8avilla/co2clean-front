'use client';

import { useState } from 'react';
import { GroupedResult } from './hooks/useAnalysisResults';

interface AnalysisV2EmissionsChartProps {
  groups: GroupedResult[];
  totalTco2e: number;
}

export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#f43f5e', // rose-500
  '#06b6d4', // cyan-500
];

const CX = 90;
const CY = 90;
const OUTER_R = 78;
const INNER_R = 50;
const GAP_DEG = 2;

function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function buildArcPath(startDeg: number, endDeg: number): string {
  const span = endDeg - startDeg;
  if (span >= 359.5) {
    // Full circle: use two half-arcs to avoid degenerate path
    return [
      `M ${CX} ${CY - OUTER_R}`,
      `A ${OUTER_R} ${OUTER_R} 0 1 1 ${(CX - 0.01).toFixed(3)} ${(CY - OUTER_R).toFixed(3)}`,
      `L ${(CX - 0.01).toFixed(3)} ${(CY - INNER_R).toFixed(3)}`,
      `A ${INNER_R} ${INNER_R} 0 1 0 ${CX} ${CY - INNER_R}`,
      'Z',
    ].join(' ');
  }
  const large = span > 180 ? 1 : 0;
  const o1 = polar(OUTER_R, startDeg);
  const o2 = polar(OUTER_R, endDeg);
  const i1 = polar(INNER_R, startDeg);
  const i2 = polar(INNER_R, endDeg);
  return [
    `M ${o1.x.toFixed(3)} ${o1.y.toFixed(3)}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${o2.x.toFixed(3)} ${o2.y.toFixed(3)}`,
    `L ${i2.x.toFixed(3)} ${i2.y.toFixed(3)}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${i1.x.toFixed(3)} ${i1.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}

function fmtCenter(v: number): string {
  return Math.round(v).toLocaleString('es-CO');
}

export const AnalysisV2EmissionsChart = ({ groups, totalTco2e }: AnalysisV2EmissionsChartProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-8 flex flex-col items-center gap-3 text-zinc-400">
        <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-300 text-xl font-black">
          0
        </div>
        <p className="text-sm">Sin datos de emisiones para este análisis</p>
      </div>
    );
  }

  // Build segments — each group gets a proportional arc with a small gap
  let cursor = 0;
  const segments = groups.map((g, i) => {
    const span = totalTco2e > 0 ? (g.tco2e / totalTco2e) * 360 : 0;
    const halfGap = groups.length > 1 ? GAP_DEG / 2 : 0;
    const start = cursor + halfGap;
    const end = cursor + span - halfGap;
    cursor += span;
    return { group: g, start, end, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  const active = hovered !== null ? segments[hovered] : null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-50">
        <h3 className="text-sm font-bold text-zinc-900">Emisiones por Alcance</h3>
        <p className="text-xs text-zinc-400 mt-0.5">tCO₂e — toneladas equivalentes de CO₂</p>
      </div>

      <div className="px-6 py-5 flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Donut */}
        <div className="shrink-0">
          <svg
            width={180}
            height={180}
            viewBox="0 0 180 180"
            aria-label="Gráfico de donuts de emisiones por alcance"
          >
            {segments.map((seg, i) => (
              <path
                key={seg.group.groupId}
                d={buildArcPath(seg.start, seg.end)}
                fill={seg.color}
                opacity={hovered === null || hovered === i ? 1 : 0.3}
                className="cursor-pointer transition-opacity duration-150"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))}

            {/* Center label */}
            <text
              x={CX}
              y={CY - 6}
              textAnchor="middle"
              fill="#18181b"
              style={{ fontSize: 14, fontWeight: 800, fontFamily: 'inherit' }}
            >
              {active ? fmtCenter(active.group.tco2e) : fmtCenter(totalTco2e)}
            </text>
            <text
              x={CX}
              y={CY + 9}
              textAnchor="middle"
              fill="#a1a1aa"
              style={{ fontSize: 9, fontFamily: 'inherit' }}
            >
              {active ? (active.group.groupCode || 'grupo') : 'tCO₂e total'}
            </text>
            {active && (
              <text
                x={CX}
                y={CY + 22}
                textAnchor="middle"
                fill="#a1a1aa"
                style={{ fontSize: 9, fontFamily: 'inherit' }}
              >
                {Math.round(active.group.percentage)}%
              </text>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-3 w-full min-w-0">
          {segments.map((seg, i) => (
            <div
              key={seg.group.groupId}
              className="flex items-start gap-2.5 cursor-pointer group/legend"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span
                className="mt-0.5 w-2.5 h-2.5 rounded-full shrink-0 transition-opacity duration-150"
                style={{
                  backgroundColor: seg.color,
                  opacity: hovered === null || hovered === i ? 1 : 0.3,
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <span
                    className="text-xs font-semibold truncate transition-colors"
                    style={{ color: hovered === i ? seg.color : '#3f3f46' }}
                  >
                    {seg.group.groupCode || seg.group.groupName}
                  </span>
                  <span className="text-xs font-mono text-zinc-600 shrink-0 tabular-nums">
                    {Math.round(seg.group.tco2e).toLocaleString('es-CO')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-1 mt-0.5">
                  <span className="text-[11px] text-zinc-400 truncate">
                    {seg.group.groupName}
                  </span>
                  <span className="text-[11px] text-zinc-400 shrink-0">
                    {Math.round(seg.group.percentage)}%
                  </span>
                </div>
                {/* Proportional mini-bar */}
                <div className="mt-1 h-1 rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${seg.group.percentage}%`,
                      backgroundColor: seg.color,
                      opacity: hovered === null || hovered === i ? 1 : 0.3,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Total de emisiones
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-zinc-900 tabular-nums">
            {Math.round(totalTco2e).toLocaleString('es-CO')}
          </span>
          <span className="text-sm text-zinc-400">tCO₂e</span>
        </div>
      </div>
    </div>
  );
};
