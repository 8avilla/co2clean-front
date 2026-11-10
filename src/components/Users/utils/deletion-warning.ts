import { escapeHtml, pluralize } from '@/shared/lib/html';

export interface UserDeletionImpact {
  companies: number;
}

interface UserDeletionWarningInput {
  userName: string;
  impact: UserDeletionImpact;
  isCurrentUser: boolean;
}

/** HTML for the delete confirmation. The name is escaped because it comes from user input. */
export const buildUserDeletionWarningHtml = ({
  userName,
  impact,
  isCurrentUser,
}: UserDeletionWarningInput): string => {
  const parts = [`<p>Vas a eliminar a <b>${escapeHtml(userName)}</b>.</p>`];

  if (isCurrentUser) {
    parts.push(
      '<p style="color:#b91c1c"><b>Es tu propia cuenta:</b> perderás el acceso y se cerrará tu sesión.</p>',
    );
  }
  if (impact.companies > 0) {
    parts.push(
      `<p>Está asociado a ${pluralize(impact.companies, 'empresa', 'empresas')} y perderá el acceso a ${
        impact.companies === 1 ? 'ella' : 'ellas'
      }.</p>`,
    );
  }
  parts.push('<p>Esta acción no se puede deshacer.</p>');
  return parts.join('');
};
