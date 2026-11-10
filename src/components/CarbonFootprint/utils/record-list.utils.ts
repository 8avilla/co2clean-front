import type { ApiCarbonFootprint } from '../types';
import { compareText, matchesSearchTerms, type SortDirection } from '@/shared/lib/list-utils';

export interface DisplayRow {
  id: string;
  sedeNombre: string;
  sedeId: string;
  anio: number;
  modoCarga: string;
  item?: string;
  cantidad?: number;
  alcanceNombre: string;
  alcanceId?: string;
  fuenteNombre: string;
  fuenteId?: string;
  subfuenteNombre: string;
  subfuenteId?: string;
  unidadNombre: string;
}

export type RecordSortKey = 'anio' | 'sede' | 'grupo' | 'tipo' | 'fuente' | 'item' | 'consumo';

export const buildDisplayRows = (
  records: ApiCarbonFootprint[],
  hqMap: Map<string, string>,
  commercialUnitMap: Map<string, string>,
): DisplayRow[] =>
  records.map(record => {
    // Try by emissionUnitId first, fallback to baseUnitSymbol match
    const idKey = record.emissionSubsourceId && record.emissionUnitId
      ? `${record.emissionSubsourceId}:id:${record.emissionUnitId}` : null;
    const symKey = record.emissionSubsourceId && record.emissionUnit?.symbol
      ? `${record.emissionSubsourceId}:sym:${record.emissionUnit.symbol}` : null;
    const commercialUnitName =
      (idKey ? commercialUnitMap.get(idKey) : undefined) ??
      (symKey ? commercialUnitMap.get(symKey) : undefined);
    return {
      id: record.id,
      sedeNombre: hqMap.get(record.headquarterId) ?? record.headquarterId,
      sedeId: record.headquarterId,
      anio: record.year,
      modoCarga: record.loadMode,
      item: record.item,
      cantidad: record.quantity,
      alcanceNombre: record.emissionGroup?.name ?? '-',
      alcanceId: record.emissionGroupId,
      fuenteNombre: record.emissionSourceCategory?.name ?? '-',
      fuenteId: record.emissionSourceCategoryId,
      subfuenteNombre: record.emissionSource?.name ?? '-',
      subfuenteId: record.emissionSubsourceId,
      unidadNombre: commercialUnitName ?? record.emissionUnit?.symbol ?? record.emissionUnit?.name ?? '-',
    };
  });

/** Abbreviates "Alcance 1 — Emisiones Directas de GEI" to "Alcance 1". */
export const shortGroupName = (name: string): string => name.split(' — ')[0] || name;

export const matchesRecordSearch = (row: DisplayRow, searchTerm: string): boolean =>
  matchesSearchTerms(
    searchTerm,
    row.sedeNombre,
    row.alcanceNombre,
    row.fuenteNombre,
    row.subfuenteNombre === '-' ? undefined : row.subfuenteNombre,
    String(row.anio),
    row.item,
  );

export const sortRows = (rows: DisplayRow[], key: RecordSortKey, direction: SortDirection): DisplayRow[] => {
  const factor = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    let byKey = 0;
    if (key === 'anio') byKey = (a.anio - b.anio) * factor;
    else if (key === 'consumo') byKey = ((a.cantidad ?? -1) - (b.cantidad ?? -1)) * factor;
    else if (key === 'grupo') byKey = compareText(a.alcanceNombre, b.alcanceNombre, { numeric: true }) * factor;
    else if (key === 'tipo') byKey = compareText(a.fuenteNombre, b.fuenteNombre) * factor;
    else if (key === 'fuente') byKey = compareText(a.subfuenteNombre, b.subfuenteNombre) * factor;
    else if (key === 'item') byKey = compareText(a.item ?? '', b.item ?? '') * factor;
    else byKey = compareText(a.sedeNombre, b.sedeNombre) * factor;
    // Stable fallback so equal values do not reshuffle between renders
    return byKey !== 0 ? byKey : compareText(a.sedeNombre, b.sedeNombre) || compareText(a.id, b.id);
  });
};
