export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const pluralize = (count: number, singular: string, plural: string): string =>
  `${count.toLocaleString('es-CO')} ${count === 1 ? singular : plural}`;
