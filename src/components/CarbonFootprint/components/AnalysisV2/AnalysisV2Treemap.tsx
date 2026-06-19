'use client';

import { useState, useMemo } from 'react';
import { GroupedResult } from './hooks/useAnalysisResults';
import { CHART_COLORS } from './AnalysisV2EmissionsChart';

interface AnalysisV2TreemapProps {
  groups: GroupedResult[];
  totalTco2e: number;
}

interface TileData {
  name: string;
  tco2e: number;
  percentage: number;
  color: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const SVG_W = 560;
const SVG_H = 280;
const GAP = 2;

function buildTiles(
  items: { name: string; tco2e: number; percentage: number; color: string }[]
): TileData[] {
  if (items.length === 0) return [];
  const total = items.reduce((s, i) => s + i.tco2e, 0);
  if (total === 0) return [];

  const sorted = [...items].sort((a, b) => b.tco2e - a.tco2e);

  // Split into 2 horizontal rows by cumulative weight ~50/50
  const half = total / 2;
  let cum = 0;
  const row1: typeof sorted = [];
  const row2: typeof sorted = [];

  for (const item of sorted) {
    if (cum < half) {
      row1.push(item);
      cum += item.tco2e;
    } else {
      row2.push(item);
    }
  }

  const tiles: TileData[] = [];

  const row1Total = row1.reduce((s, i) => s + i.tco2e, 0);
  const h1 = row1Total > 0 ? Math.round((row1Total / total) * SVG_H) : SVG_H;
  const h2 = SVG_H - h1;

  let rx = 0;
  for (const item of row1) {
    const w = row1Total > 0 ? (item.tco2e / row1Total) * SVG_W : 0;
    tiles.push({ ...item, x: rx, y: 0, w, h: h1 });
    rx += w;
  }

  const row2Total = row2.reduce((s, i) => s + i.tco2e, 0);
  rx = 0;
  for (const item of row2) {
    const w = row2Total > 0 ? (item.tco2e / row2Total) * SVG_W : 0;
    tiles.push({ ...item, x: rx, y: h1, w, h: h2 });
    rx += w;
  }

  return tiles;
}

export const AnalysisV2Treemap = ({ groups, totalTco2e }: AnalysisV2TreemapProps) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const items = useMemo(
    () =>
      groups.flatMap((g, gIdx) =>
        g.categories.map(cat => ({
          name: cat.categoryName,
          tco2e: cat.tco2e,
          percentage: cat.percentage,
          color: CHART_COLORS[gIdx % CHART_COLORS.length],
        }))
      ),
    [groups]
  );

  const tiles = useMemo(() => buildTiles(items), [items]);

  if (tiles.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-zinc-100 p-8 text-center text-zinc-400 text-sm">
        Sin datos para mostrar
      </div>
    );
  }

  const hoveredTile = hovered ? tiles.find(t => t.name === hovered) : null;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-zinc-50 flex-shrink-0">
        <h3 className="text-sm font-bold text-zinc-900">Treemap de Emisiones</h3>
        <p className="text-xs text-zinc-400 mt-0.5">Área proporcional al tCO₂e de cada categoría</p>
      </div>

      <div className="flex-1 px-4 pt-4 pb-2">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full rounded-xl overflow-hidden"
          style={{ height: 260 }}
          aria-label="Treemap de emisiones por categoría"
        >
          {tiles.map(tile => {
            const isHov = hovered === tile.name;
            const canShowText = tile.w > 32 && tile.h > 22;
            const canShowPct = tile.h > 38;

            return (
              <g key={tile.name}>
                <rect
                  x={tile.x + GAP / 2}
                  y={tile.y + GAP / 2}
                  width={Math.max(0, tile.w - GAP)}
                  height={Math.max(0, tile.h - GAP)}
                  fill={tile.color}
                  opacity={hovered === null ? 0.82 : isHov ? 1 : 0.3}
                  rx={4}
                  className="cursor-pointer transition-opacity duration-150"
                  onMouseEnter={() => setHovered(tile.name)}
                  onMouseLeave={() => setHovered(null)}
                />
                {canShowText && (
                  <text
                    x={tile.x + tile.w / 2}
                    y={tile.y + tile.h / 2 - (canShowPct ? 8 : 0)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="white"
                    fontSize={Math.min(12, tile.w / 7)}
                    fontWeight="700"
                    pointerEvents="none"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {tile.name.length > 14 ? `${tile.name.slice(0, 13)}…` : tile.name}
                  </text>
                )}
                {canShowText && canShowPct && (
                  <text
                    x={tile.x + tile.w / 2}
                    y={tile.y + tile.h / 2 + 12}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="rgba(255,255,255,0.75)"
                    fontSize={Math.min(10, tile.w / 9)}
                    pointerEvents="none"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {Math.round(tile.percentage)}%
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        <div className="h-9 flex items-center mt-2">
          {hoveredTile ? (
            <div className="w-full px-3 py-2 bg-zinc-900 rounded-lg text-xs text-white flex items-center justify-between gap-4">
              <span className="font-semibold truncate">{hoveredTile.name}</span>
              <span className="tabular-nums shrink-0 font-mono">
                {Math.round(hoveredTile.tco2e).toLocaleString('es-CO')} tCO₂e · {Math.round(hoveredTile.percentage)}%
              </span>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic px-1">Pasa el cursor sobre un área para ver el detalle</p>
          )}
        </div>
      </div>

      <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center flex-shrink-0">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {tiles.length} {tiles.length === 1 ? 'categoría' : 'categorías'}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-zinc-900 tabular-nums">{Math.round(totalTco2e).toLocaleString('es-CO')}</span>
          <span className="text-sm text-zinc-400">tCO₂e</span>
        </div>
      </div>
    </div>
  );
};
