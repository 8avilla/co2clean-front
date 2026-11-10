import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CommercialUnitsDrawer } from '../CommercialUnitsDrawer';
import {
  EmissionSourceService,
  EmissionUnitService,
  UnitTypeService,
} from '@/shared/services/emission-source.service';
import { confirmDelete } from '@/shared/lib/confirm-dialog';
import type { EmissionSource } from '../../types';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/lib/confirm-dialog', () => ({ confirmDelete: vi.fn() }));
vi.mock('@/shared/services/emission-source.service', () => ({
  EmissionSourceService: { getCommercialUnits: vi.fn(), deleteCommercialUnit: vi.fn() },
  EmissionUnitService: { getUnits: vi.fn() },
  UnitTypeService: { getUnitTypes: vi.fn() },
}));

const source: EmissionSource = {
  id: 's1',
  code: 'PAP',
  name: 'Papel',
  category_id: 'c1',
  measurement_type: 'x',
  is_active: true,
};

const units = [
  { id: 'cu1', displaySymbol: 'resma', displayName: 'Resma carta', conversionFactor: 2.5, baseUnitSymbol: 'kg' },
];

describe('CommercialUnitsDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(EmissionUnitService.getUnits).mockResolvedValue([]);
    vi.mocked(UnitTypeService.getUnitTypes).mockResolvedValue([]);
    vi.mocked(EmissionSourceService.getCommercialUnits).mockResolvedValue(units);
  });

  const renderDrawer = async () => {
    render(<CommercialUnitsDrawer source={source} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Resma carta')).toBeInTheDocument());
  };

  it('debería mostrar las acciones de cada unidad sin depender del hover', async () => {
    await renderDrawer();
    const button = within(screen.getByRole('table')).getByRole('button', { name: 'Editar Resma carta' });
    expect(button.closest('div')?.className).not.toContain('opacity-0');
  });

  it('debería usar el diálogo de la app (no window.confirm) y no eliminar si se cancela', async () => {
    const nativeConfirm = vi.spyOn(window, 'confirm');
    vi.mocked(confirmDelete).mockResolvedValue(false);
    await renderDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Resma carta' }));

    await waitFor(() => expect(confirmDelete).toHaveBeenCalled());
    expect(nativeConfirm).not.toHaveBeenCalled();
    expect(EmissionSourceService.deleteCommercialUnit).not.toHaveBeenCalled();
  });

  it('debería eliminar la unidad cuando el usuario confirma', async () => {
    vi.mocked(confirmDelete).mockResolvedValue(true);
    vi.mocked(EmissionSourceService.deleteCommercialUnit).mockResolvedValue(undefined);
    await renderDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Resma carta' }));

    await waitFor(() => expect(EmissionSourceService.deleteCommercialUnit).toHaveBeenCalledWith('s1', 'cu1'));
    await waitFor(() => expect(screen.queryByText('Resma carta')).not.toBeInTheDocument());
  });
});
