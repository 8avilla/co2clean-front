import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmissionUnitList } from '../EmissionUnitList';
import { EmissionUnitService, UnitTypeService } from '@/shared/services/emission-source.service';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/shared/services/emission-source.service', () => ({
  EmissionUnitService: { getUnits: vi.fn() },
  UnitTypeService: { getUnitTypes: vi.fn() },
}));

const units = [
  { id: 'u1', name: 'Metro', symbol: 'm', unitTypeId: 't2' },
  { id: 'u2', name: 'Kilogramo', symbol: 'kg', unitTypeId: 't1', description: 'Masa en el SI' },
  { id: 'u3', name: 'Resma', symbol: 'resma', unitTypeId: 'tc' },
];

const types = [
  { id: 't1', name: 'Masa', code: 'MASS' },
  { id: 't2', name: 'Longitud', code: 'LENGTH' },
  { id: 'tc', name: 'Comercial', code: 'COMERCIAL' },
];

const getNames = () =>
  within(screen.getByRole('table'))
    .getAllByRole('row')
    .slice(1)
    .map(row => within(row).getAllByRole('cell')[0].textContent);

describe('EmissionUnitList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(EmissionUnitService.getUnits).mockResolvedValue(units);
    vi.mocked(UnitTypeService.getUnitTypes).mockResolvedValue(types as Awaited<ReturnType<typeof UnitTypeService.getUnitTypes>>);
  });

  const renderList = async () => {
    render(<EmissionUnitList />);
    await waitFor(() => expect(screen.getByText('Kilogramo')).toBeInTheDocument());
  };

  it('debería ocultar las unidades del tipo interno COMERCIAL', async () => {
    await renderList();
    expect(screen.queryByText('Resma')).not.toBeInTheDocument();
  });

  it('debería ordenar por nombre por defecto y alternar al pulsar la cabecera', async () => {
    await renderList();
    expect(getNames()).toEqual(['Kilogramo', 'Metro']);
    const header = screen.getByRole('columnheader', { name: /Nombre/ });
    await userEvent.click(within(header).getByRole('button'));
    expect(getNames()).toEqual(['Metro', 'Kilogramo']);
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('debería ordenar por símbolo', async () => {
    await renderList();
    await userEvent.click(within(screen.getByRole('columnheader', { name: /Símbolo/ })).getByRole('button'));
    expect(getNames()).toEqual(['Kilogramo', 'Metro']);
  });

  it('debería buscar en la descripción sin importar tildes ni mayúsculas', async () => {
    await renderList();
    await userEvent.type(screen.getByPlaceholderText(/Buscar por nombre o símbolo/), 'MASA');
    await waitFor(() => expect(screen.queryByText('Metro')).not.toBeInTheDocument());
    expect(screen.getByText('Kilogramo')).toBeInTheDocument();
  });
});
