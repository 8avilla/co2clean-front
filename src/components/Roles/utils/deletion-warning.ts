import { escapeHtml, pluralize } from '@/shared/lib/html';

export interface RoleDeletionImpact {
  users: number;
}

/** HTML for the delete confirmation. The name is escaped because it comes from user input. */
export const buildRoleDeletionWarningHtml = (roleName: string, impact: RoleDeletionImpact): string => {
  const name = `<b>${escapeHtml(roleName)}</b>`;
  if (impact.users === 0) {
    return `<p>Vas a eliminar el rol ${name}. Ningún usuario lo tiene asignado.</p><p>Esta acción no se puede deshacer.</p>`;
  }
  return (
    `<p>Vas a eliminar el rol ${name}.</p>` +
    `<p><b>${pluralize(impact.users, 'usuario lo tiene', 'usuarios lo tienen')} asignado</b> y ` +
    `${impact.users === 1 ? 'se quedará' : 'se quedarán'} sin los permisos de este rol.</p>` +
    '<p>Esta acción no se puede deshacer.</p>'
  );
};
