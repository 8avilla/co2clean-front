import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisFactorsTab } from '../AnalysisFactorsTab';
import type { ApiEmissionFactor } from '../../../types';

const factor = (overrides: Record<string, unknown>): ApiEmissionFactor =>
  ({
    id: 'f1',
    gasId: 'g1',
    gas: { id: 'g1', chemicalName: 'Metano', formula: 'CH₄', gwp: 28 },
    factor: 0.5,
    gwp: 28,
    emissionUnitId: 'u1',
    emissionUnit: { id: 'u1', name: 'Litro', symbol: 'L' },
    emissionSourceId: 's1',
    emissionSource: { id: 's1', name: 'Diésel' },
    emissionSourceCategoryId: 'c1',
    emissionSourceCategory: { id: 'c1', name: 'Combustión Móvil' },
    ...overrides,
  }) as unknown as ApiEmissionFactor;

const factors = [
  factor({ id: 'f1' }),
  factor({
    id: 'f2',
    gas: { id: 'g2', chemicalName: 'Óxido Nitroso', formula: 'N₂O', gwp: 273 },
    emissionSourceId: 's2',
    emissionSource: { id: 's2', name: 'Electricidad de red' },
    emissionSourceCategoryId: 'c2',
    emissionSourceCategory: { id: 'c2', name: 'Energía Eléctrica' },
  }),
];

// Names also appear as <option> in the filter dropdowns; only count what is rendered in the list
const inList = (text: string) => screen.queryAllByText(text).filter(element => element.tagName !== 'OPTION');

describe('AnalysisFactorsTab (buscador)', () => {
  it('debería buscar sin importar tildes ni mayúsculas', async () => {
    render(<AnalysisFactorsTab factors={factors} />);
    await userEvent.type(screen.getByPlaceholderText(/Buscar gas, fuente o tipo de fuente/), 'OXIDO');
    await waitFor(() => expect(inList('Combustión Móvil')).toHaveLength(0));
    expect(inList('Energía Eléctrica').length).toBeGreaterThan(0);
  });

  it('debería combinar palabras de campos distintos (gas y tipo de fuente)', async () => {
    render(<AnalysisFactorsTab factors={factors} />);
    const input = screen.getByPlaceholderText(/Buscar gas, fuente o tipo de fuente/);
    await userEvent.type(input, 'metano combustion');
    await waitFor(() => expect(inList('Energía Eléctrica')).toHaveLength(0));
    expect(inList('Combustión Móvil').length).toBeGreaterThan(0);
  });

  it('debería permitir limpiar la búsqueda con el botón del campo', async () => {
    render(<AnalysisFactorsTab factors={factors} />);
    await userEvent.type(screen.getByPlaceholderText(/Buscar gas, fuente o tipo de fuente/), 'metano');
    await waitFor(() => expect(inList('Energía Eléctrica')).toHaveLength(0));
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }));
    await waitFor(() => expect(inList('Energía Eléctrica').length).toBeGreaterThan(0));
  });
});
