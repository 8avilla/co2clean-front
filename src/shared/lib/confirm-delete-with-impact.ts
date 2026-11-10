import { confirmDelete } from './confirm-dialog';

interface ConfirmDeleteWithImpactOptions<TImpact> {
  title: string;
  /** Loads what depends on the item being deleted */
  loadImpact: () => Promise<TImpact>;
  /** Builds the dialog HTML from the loaded impact (escape any user text inside) */
  buildHtml: (impact: TImpact) => string;
  /** Shown when the impact could not be loaded, so the user can still confirm */
  fallbackHtml: string;
}

/**
 * Asks for confirmation before deleting, listing the data that depends on the item.
 * It only warns, it never blocks: if the impact lookup fails the plain fallback is shown.
 */
export const confirmDeleteWithImpact = async <TImpact>({
  title,
  loadImpact,
  buildHtml,
  fallbackHtml,
}: ConfirmDeleteWithImpactOptions<TImpact>): Promise<boolean> => {
  let html: string;
  try {
    html = buildHtml(await loadImpact());
  } catch {
    html = fallbackHtml;
  }
  return confirmDelete({ title, html });
};
