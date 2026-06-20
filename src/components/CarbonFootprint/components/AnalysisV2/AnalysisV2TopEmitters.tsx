'use client';

import { useMemo } from 'react';
import { GroupedResult } from './hooks/useAnalysisResults';
import { CHART_COLORS } from './AnalysisV2EmissionsChart';

interface AnalysisV2TopEmittersProps {
  groups: GroupedResult[];
  totalTco2e: number;
}

interface CategoryEntry {
  name: string;
  tco2e: number;
  percentage: number;
  color: string;
}

function fmt(v: number): string {
  if (v === 0) return '0';
  if (v >= 1) return Math.round(v).toLocaleString('es-CO');
  return v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Order for podium: 2nd on left, 1st in center (tallest), 3rd on right
const PODIUM_ORDER = [1, 0, 2]; // indices into sorted top-3 array
const PODIUM_RANKS = [2, 1, 3];
const PODIUM_HEIGHTS = ['52px', '80px', '36px'];
const PODIUM_VALUE_SIZES = ['text-2xl', 'text-4xl', 'text-xl'];

export const AnalysisV2TopEmitters = ({ groups, totalTco2e }: AnalysisV2TopEmittersProps) => {
  const top3 = useMemo<CategoryEntry[]>(() => {
    const all = groups.flatMap((g, gIdx) =>
      g.categories.map(cat => ({
        name: cat.categoryName,
        tco2e: cat.tco2e,
        percentage: cat.percentage,
        color: CHART_COLORS[gIdx % CHART_COLORS.length],
      }))
    );
    return all.sort((a, b) => b.tco2e - a.tco2e).slice(0, 3);
  }, [groups]);

  if (top3.length === 0 || totalTco2e === 0) return null;

  const podiumEntries =
    top3.length >= 3
      ? PODIUM_ORDER.map(i => top3[i])
      : top3.length === 2
      ? [top3[1], top3[0]]
      : [top3[0]];

  const podiumRanks =
    top3.length >= 3 ? PODIUM_RANKS : top3.length === 2 ? [2, 1] : [1];
  const podiumHeights =
    top3.length >= 3 ? PODIUM_HEIGHTS : top3.length === 2 ? ['52px', '80px'] : ['80px'];
  const podiumSizes =
    top3.length >= 3
      ? PODIUM_VALUE_SIZES
      : top3.length === 2
      ? ['text-2xl', 'text-4xl']
      : ['text-4xl'];

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
      <div className="mb-8">
        <h3 className="text-sm font-bold text-zinc-900">Top Emisores</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Categorías con mayor contribución en tCO₂e</p>
      </div>

      <div className="flex items-end justify-center gap-3 sm:gap-6">
        {podiumEntries.map((entry, i) => {
          const rank = podiumRanks[i];
          const isFirst = rank === 1;

          return (
            <div
              key={i}
              className="flex flex-col items-center gap-2 flex-1 max-w-[200px]"
            >
              {/* Value + percentage */}
              <div className="text-center">
                <div
                  className={`${podiumSizes[i]} font-black tabular-nums leading-tight`}
                  style={{ color: entry.color }}
                >
                  {fmt(entry.tco2e)}
                </div>
                <div className="text-[10px] text-zinc-400 font-medium">tCO₂e</div>
                <div
                  className={`text-xs font-bold mt-0.5 ${
                    isFirst ? 'text-zinc-700' : 'text-zinc-400'
                  }`}
                >
                  {Math.round(entry.percentage)}%
                </div>
              </div>

              {/* Podium bar */}
              <div
                className="w-full rounded-t-xl flex items-start justify-center pt-2 transition-all duration-300"
                style={{
                  height: podiumHeights[i],
                  backgroundColor: entry.color,
                  opacity: isFirst ? 0.25 : rank === 2 ? 0.15 : 0.1,
                  border: `2px solid ${entry.color}`,
                  borderBottom: 'none',
                }}
              >
                <span className="text-sm font-black" style={{ color: entry.color }}>
                  {rank}°
                </span>
              </div>

              {/* Category name */}
              <p
                className="text-xs font-semibold text-center text-zinc-500 leading-tight line-clamp-2 max-w-full px-1"
                title={entry.name}
              >
                {entry.name}
              </p>
            </div>
          );
        })}
      </div>

      {/* Bottom rule */}
      <div className="mt-6 pt-4 border-t border-zinc-100 flex justify-between items-center text-xs text-zinc-400">
        <span>De {groups.flatMap(g => g.categories).length} categorías totales</span>
        <span className="tabular-nums font-semibold">{Math.round(totalTco2e).toLocaleString('es-CO')} tCO₂e total</span>
      </div>
    </div>
  );
};
