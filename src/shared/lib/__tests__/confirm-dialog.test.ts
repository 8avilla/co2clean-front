import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('sweetalert2', () => ({
  default: { fire: vi.fn() },
}));

import Swal from 'sweetalert2';
import { confirmDialog, confirmDelete } from '../confirm-dialog';

const mockFire = vi.mocked(Swal.fire);

describe('confirmDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devuelve true cuando el usuario confirma', async () => {
    mockFire.mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false });

    const result = await confirmDialog({ title: '¿Continuar?' });

    expect(result).toBe(true);
  });

  it('devuelve false cuando el usuario cancela', async () => {
    mockFire.mockResolvedValue({ isConfirmed: false, isDenied: false, isDismissed: true });

    const result = await confirmDialog({ title: '¿Continuar?' });

    expect(result).toBe(false);
  });

  it('usa el ícono "question" y el color primario por defecto', async () => {
    mockFire.mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false });

    await confirmDialog({ title: '¿Continuar?' });

    expect(mockFire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '¿Continuar?',
        icon: 'question',
        confirmButtonColor: '#00a9a3',
        cancelButtonColor: '#71717a',
        reverseButtons: true,
      })
    );
  });
});

describe('confirmDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('usa el ícono "warning" y el color de peligro', async () => {
    mockFire.mockResolvedValue({ isConfirmed: true, isDenied: false, isDismissed: false });

    const result = await confirmDelete({ title: '¿Eliminar registro?' });

    expect(result).toBe(true);
    expect(mockFire).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '¿Eliminar registro?',
        icon: 'warning',
        confirmButtonText: 'Sí, eliminar',
        confirmButtonColor: '#ff4d4f',
      })
    );
  });
});
