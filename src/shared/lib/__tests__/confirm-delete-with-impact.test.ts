import { vi, describe, it, expect, beforeEach } from 'vitest';
import { confirmDelete } from '../confirm-dialog';
import { confirmDeleteWithImpact } from '../confirm-delete-with-impact';

vi.mock('../confirm-dialog', () => ({ confirmDelete: vi.fn() }));

const mockConfirmDelete = vi.mocked(confirmDelete);

describe('confirmDeleteWithImpact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirmDelete.mockResolvedValue(true);
  });

  it('debería mostrar el HTML construido con el impacto cargado', async () => {
    const result = await confirmDeleteWithImpact({
      title: '¿Eliminar?',
      loadImpact: async () => ({ sedes: 2 }),
      buildHtml: impact => `<p>${impact.sedes} sedes</p>`,
      fallbackHtml: '<p>simple</p>',
    });

    expect(result).toBe(true);
    expect(mockConfirmDelete).toHaveBeenCalledWith({ title: '¿Eliminar?', html: '<p>2 sedes</p>' });
  });

  it('debería usar el mensaje simple cuando falla la carga del impacto', async () => {
    await confirmDeleteWithImpact({
      title: '¿Eliminar?',
      loadImpact: async () => {
        throw new Error('network');
      },
      buildHtml: () => '<p>no debería usarse</p>',
      fallbackHtml: '<p>simple</p>',
    });

    expect(mockConfirmDelete).toHaveBeenCalledWith({ title: '¿Eliminar?', html: '<p>simple</p>' });
  });

  it('debería usar el mensaje simple si buildHtml falla', async () => {
    await confirmDeleteWithImpact({
      title: 'x',
      loadImpact: async () => 1,
      buildHtml: () => {
        throw new Error('bad');
      },
      fallbackHtml: '<p>simple</p>',
    });
    expect(mockConfirmDelete.mock.calls[0][0].html).toBe('<p>simple</p>');
  });

  it('debería devolver false cuando el usuario cancela', async () => {
    mockConfirmDelete.mockResolvedValue(false);
    await expect(
      confirmDeleteWithImpact({
        title: 'x',
        loadImpact: async () => 1,
        buildHtml: () => '',
        fallbackHtml: '',
      }),
    ).resolves.toBe(false);
  });
});
