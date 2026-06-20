'use client';

import { GroupedResult } from './hooks/useAnalysisResults';
import { CHART_COLORS } from './AnalysisV2EmissionsChart';

interface AnalysisV2BarChartProps {
  groups: GroupedResult[];
  totalTco2e: number;
}

interface CategoryBar {
  id: string;
  categoryId: string;
  categoryName: string;
  tco2e: number;
  percentage: number;
  color: string;
  groupName: string;
}

function fmt(v: number): string {
  if (v === 0) return '0';
  return v.toLocaleString('es-CO', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export const AnalysisV2BarChart = ({ groups, totalTco2e }: AnalysisV2BarChartProps) => {
  if (groups.length === 0 || totalTco2e === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-8 flex flex-col items-center gap-3 text-zinc-400">
        <p className="text-sm">Sin datos para mostrar</p>
      </div>
    );
  }

  // Flatten categories with group color, sorted by tCO₂e desc
  const bars: CategoryBar[] = groups
    .flatMap((g, gIdx) =>
      g.categories.map(cat => ({
        id: `${g.groupId}:${cat.categoryId}`,
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        tco2e: cat.tco2e,
        percentage: cat.percentage,
        color: CHART_COLORS[gIdx % CHART_COLORS.length],
        groupName: g.groupCode || g.groupName,
      }))
    )
    .sort((a, b) => b.tco2e - a.tco2e);

  const maxTco2e = bars[0]?.tco2e ?? 1;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-50 flex-shrink-0">
        <h3 className="text-sm font-bold text-zinc-900">Emisiones por Categoría</h3>
        <p className="text-xs text-zinc-400 mt-0.5">tCO₂e por categoría de emisión — de mayor a menor</p>
      </div>

      {/* Bars */}
      <div className="flex-1 px-6 py-5 space-y-3 overflow-y-auto">
        {bars.map(bar => {
          const widthPct = maxTco2e > 0 ? (bar.tco2e / maxTco2e) * 100 : 0;

          return (
            <div key={bar.id} className="group">
              {/* Label row */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: bar.color }}
                  />
                  <span
                    className="text-xs font-medium text-zinc-700 truncate"
                    title={bar.categoryName}
                  >
                    {bar.categoryName}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-shrink-0">
                  <span className="text-xs font-bold font-mono tabular-nums text-zinc-800">
                    {fmt(bar.tco2e)}
                  </span>
                  <span className="text-[10px] text-zinc-400">tCO₂e</span>
                  <span className="text-[10px] text-zinc-400 w-9 text-right tabular-nums">
                    {Math.round(bar.percentage)}%
                  </span>
                </div>
              </div>

              {/* Bar track */}
              <div className="h-3 bg-zinc-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: bar.color,
                    opacity: 0.85,
                  }}
                />
              </div>

              {/* Group tag */}
              <p
                className="text-[10px] mt-0.5 pl-3.5 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: bar.color }}
              >
                {bar.groupName}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-3.5 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center flex-shrink-0">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {bars.length} {bars.length === 1 ? 'categoría' : 'categorías'}
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
