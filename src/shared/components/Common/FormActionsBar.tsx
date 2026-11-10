import { Loader2, Save } from 'lucide-react';
import { buttonClass } from './button-styles';

interface FormActionsBarProps {
  onCancel: () => void;
  submitLabel: string;
  busyLabel?: string;
  isSubmitting?: boolean;
  isSubmitDisabled?: boolean;
  /** Shows the "Cambios sin guardar" reminder */
  isDirty?: boolean;
}

// Sticky footer so Save/Cancel stay reachable without scrolling to the end of a long form
export const FormActionsBar = ({
  onCancel,
  submitLabel,
  busyLabel = 'Guardando...',
  isSubmitting = false,
  isSubmitDisabled = false,
  isDirty = false,
}: FormActionsBarProps) => (
  <div className="sticky bottom-0 z-10 py-3 flex items-center justify-end gap-3 bg-zinc-50/90 backdrop-blur border-t border-zinc-200">
    {isDirty && <span className="mr-auto text-xs font-semibold text-amber-600">Cambios sin guardar</span>}
    <button
      type="button"
      onClick={onCancel}
      className={buttonClass({ variant: 'ghost' })}
    >
      Cancelar
    </button>
    <button
      type="submit"
      disabled={isSubmitting || isSubmitDisabled}
      className={buttonClass()}
    >
      {isSubmitting ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          {busyLabel}
        </>
      ) : (
        <>
          <Save size={15} />
          {submitLabel}
        </>
      )}
    </button>
  </div>
);
