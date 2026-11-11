import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisRecordsTab } from '../AnalysisRecordsTab';
import type { ApiCarbonFootprint } from '../../../types';

const makeRecord = (index: number): ApiCarbonFootprint =>
  ({
    id: `r${index}`,
    item: `Item ${index}`,
    year: 2026,
    loadMode: 'Annual',
    quantity: index,
    emissionUnit: { id: 'u1', name: 'Litro', symbol: 'L' },
    emissionGroupId: 'g1',
    emissionGroup: { id: 'g1', name: 'Alcance 1' },
    emissionSourceCategoryId: 'c1',
    emissionSourceCategory: { id: 'c1', name: 'Combustión móvil' },
    emissionSubsourceId: 's1',
    emissionSource: { id: 's1', name: 'Diésel' },
  }) as unknown as ApiCarbonFootprint;

const records = Array.from({ length: 30 }, (_, index) => makeRecord(index + 1));

describe('AnalysisRecordsTab (estructura)', () => {
  it('debería mostrar filtros con etiqueta visible y valor "Todos" por defecto', () => {
    render(<AnalysisRecordsTab records={records} recordIdsWithFactors={new Set(records.map(r => r.id))} />);
    expect(screen.getByLabelText('Tipo de fuente')).toHaveValue('');
    expect(screen.getByLabelText('Fuente de emisión')).toHaveValue('');
  });

  it('debería paginar con el componente compartido y cambiar de página', async () => {
    render(<AnalysisRecordsTab records={records} recordIdsWithFactors={new Set(records.map(r => r.id))} />);
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Página 2' }));
    expect(screen.getByText('Item 26')).toBeInTheDocument();
    expect(screen.queryByText('Item 1')).not.toBeInTheDocument();
  });
});
