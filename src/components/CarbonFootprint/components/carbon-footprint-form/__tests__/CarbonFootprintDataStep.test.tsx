import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef, type ComponentProps } from 'react';
import { CarbonFootprintDataStep } from '../CarbonFootprintDataStep';
import { MONTH_KEYS, MONTH_LABELS } from '../month-constants';

const buildProps = (
  overrides: Partial<ComponentProps<typeof CarbonFootprintDataStep>> = {},
): ComponentProps<typeof CarbonFootprintDataStep> => ({
  registrationMode: 'bulk',
  loadMode: 'Annual',
  dataComplete: false,
  unitSymbol: 'kWh',
  csvFormatHref: '/formato.csv',
  showCsvHelp: false,
  setShowCsvHelp: vi.fn(),
  csvFile: null,
  csvPreview: [],
  fileInputRef: createRef<HTMLInputElement>(),
  handleDrop: vi.fn(),
  handleFileChange: vi.fn(),
  removeCsv: vi.fn(),
  individualItem: '',
  setIndividualItem: vi.fn(),
  annualQuantity: '',
  setAnnualQuantity: vi.fn(),
  monthlyValues: Array(12).fill(''),
  setMonthlyValues: vi.fn(),
  monthlyTotal: 0,
  ...overrides,
});

describe('CarbonFootprintDataStep', () => {
  it('debería mostrar el título de carga masiva en modo bulk', () => {
    render(<CarbonFootprintDataStep {...buildProps()} />);
    expect(screen.getByText(/Carga masiva \(CSV\)/)).toBeInTheDocument();
  });

  it('debería mostrar el título de registro individual en modo individual', () => {
    render(<CarbonFootprintDataStep {...buildProps({ registrationMode: 'individual' })} />);
    expect(screen.getByText(/Registro individual/)).toBeInTheDocument();
  });

  it('debería mostrar un campo por cada mes en carga mensual individual', () => {
    render(
      <CarbonFootprintDataStep
        {...buildProps({ registrationMode: 'individual', loadMode: 'Monthly' })}
      />,
    );
    for (const label of MONTH_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('debería mantener 12 claves de mes alineadas con las 12 etiquetas', () => {
    expect(MONTH_KEYS).toHaveLength(12);
    expect(MONTH_LABELS).toHaveLength(MONTH_KEYS.length);
  });
});
