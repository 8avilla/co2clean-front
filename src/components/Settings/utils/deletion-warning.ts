import { escapeHtml, pluralize } from '@/shared/lib/html';
import type {
  EmissionCategoryDeletionImpact,
  EmissionSourceDeletionImpact,
  GasDeletionImpact,
} from '@/shared/services/deletion-impact.service';

const closing = '<p>Esta acción no se puede deshacer.</p>';

const listItems = (items: string[]): string =>
  `<ul style="text-align:left;margin:12px auto;display:inline-block;list-style:disc;padding-left:20px">${items
    .map(item => `<li>${item}</li>`)
    .join('')}</ul>`;

/** Fallback shown when the impact could not be loaded. */
export const buildPlainDeletionHtml = (label: string, name: string): string =>
  `<p>Vas a eliminar ${label} <b>${escapeHtml(name)}</b>.</p>${closing}`;

export const buildGasDeletionWarningHtml = (gasName: string, impact: GasDeletionImpact): string => {
  const name = `<b>${escapeHtml(gasName)}</b>`;
  if (impact.factors === 0) {
    return `<p>Vas a eliminar el gas ${name}. No tiene factores de emisión asociados.</p>${closing}`;
  }
  return (
    `<p>Vas a eliminar el gas ${name}, que se usa en:</p>` +
    listItems([pluralize(impact.factors, 'factor de emisión', 'factores de emisión')]) +
    `<p>Esos factores dejarán de calcular emisiones con este gas.</p>${closing}`
  );
};

export const buildCategoryDeletionWarningHtml = (
  categoryName: string,
  impact: EmissionCategoryDeletionImpact,
): string => {
  const name = `<b>${escapeHtml(categoryName)}</b>`;
  if (impact.sources === 0) {
    return `<p>Vas a eliminar el tipo de fuente ${name}. No tiene fuentes de emisión asociadas.</p>${closing}`;
  }
  return (
    `<p>Vas a eliminar el tipo de fuente ${name}, que agrupa:</p>` +
    listItems([pluralize(impact.sources, 'fuente de emisión', 'fuentes de emisión')]) +
    `<p>Las fuentes y sus factores también se verán afectados.</p>${closing}`
  );
};

export const buildSourceDeletionWarningHtml = (
  sourceName: string,
  impact: EmissionSourceDeletionImpact,
): string => {
  const name = `<b>${escapeHtml(sourceName)}</b>`;
  const items: string[] = [];
  if (impact.factors > 0) items.push(pluralize(impact.factors, 'factor de emisión', 'factores de emisión'));
  if (impact.commercialUnits > 0) {
    items.push(pluralize(impact.commercialUnits, 'unidad comercial', 'unidades comerciales'));
  }
  if (items.length === 0) {
    return `<p>Vas a eliminar la fuente ${name}. No tiene factores ni unidades comerciales.</p>${closing}`;
  }
  return `<p>Vas a eliminar la fuente ${name}, que tiene:</p>${listItems(items)}${closing}`;
};
