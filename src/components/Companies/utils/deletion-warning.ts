import type { CompanyDeletionImpact } from '../services/company.service';
import { escapeHtml, pluralize } from '@/shared/lib/html';

export const hasDependentData = (impact: CompanyDeletionImpact): boolean =>
  impact.headquarters > 0 || impact.activityRecords > 0 || impact.analyses > 0;

/** HTML shown in the delete confirmation; the company name is escaped because it comes from user input. */
export const buildDeletionWarningHtml = (
  companyName: string,
  impact: CompanyDeletionImpact,
): string => {
  const name = `<b>${escapeHtml(companyName)}</b>`;
  if (!hasDependentData(impact)) {
    return `<p>Vas a eliminar ${name}. Esta acción no se puede deshacer.</p>`;
  }

  const items = [
    pluralize(impact.headquarters, 'sede', 'sedes'),
    pluralize(impact.activityRecords, 'registro de actividad', 'registros de actividad'),
    pluralize(impact.analyses, 'análisis de huella de carbono', 'análisis de huella de carbono'),
  ]
    .map(item => `<li>${item}</li>`)
    .join('');

  return (
    `<p>Vas a eliminar ${name}, que tiene información asociada:</p>` +
    `<ul style="text-align:left;margin:12px auto;display:inline-block;list-style:disc;padding-left:20px">${items}</ul>` +
    '<p>Esta acción no se puede deshacer.</p>'
  );
};
