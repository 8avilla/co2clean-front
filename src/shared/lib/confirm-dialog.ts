import Swal from 'sweetalert2';

const CANCEL_BUTTON_COLOR = '#71717a';
const CONFIRM_BUTTON_COLOR = '#00a9a3';
const DANGER_BUTTON_COLOR = '#ff4d4f';

type ConfirmDialogIcon = 'warning' | 'question' | 'info';

interface ConfirmDialogOptions {
  title: string;
  text?: string;
  html?: string;
  icon?: ConfirmDialogIcon;
  confirmText?: string;
  cancelText?: string;
  confirmButtonColor?: string;
}

export const confirmDialog = async ({
  title,
  text,
  html,
  icon = 'question',
  confirmText = 'Sí, continuar',
  cancelText = 'Cancelar',
  confirmButtonColor = CONFIRM_BUTTON_COLOR,
}: ConfirmDialogOptions): Promise<boolean> => {
  const result = await Swal.fire({
    title,
    text,
    html,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor,
    cancelButtonColor: CANCEL_BUTTON_COLOR,
    reverseButtons: true,
  });

  return result.isConfirmed;
};

interface ConfirmDeleteOptions {
  title: string;
  text?: string;
  html?: string;
  confirmText?: string;
}

export const confirmDelete = ({
  title,
  text,
  html,
  confirmText = 'Sí, eliminar',
}: ConfirmDeleteOptions): Promise<boolean> =>
  confirmDialog({
    title,
    text,
    html,
    icon: 'warning',
    confirmText,
    confirmButtonColor: DANGER_BUTTON_COLOR,
  });
