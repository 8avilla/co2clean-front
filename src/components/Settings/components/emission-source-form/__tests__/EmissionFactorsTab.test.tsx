import { vi, describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { EmissionFactorsTab } from '../EmissionFactorsTab';
import type { Gas } from '../../../types';
import type { LocalEmissionFactor } from '../types';

const gases: Gas[] = [
  { id: 'g1', chemical_name: 'Dióxido de Carbono', formula: 'CO₂', gwp: 1, calculation_type: 'non_biogenic', is_active: true },
  { id: 'g2', chemical_name: 'Metano', formula: 'CH₄', gwp: 30, calculation_type: 'non_biogenic', is_active: true },
];

const units = [{ id: 'u1', symbol: 'L', name: 'Litro' }];

const factor = (overrides: Partial<LocalEmissionFactor> = {}): LocalEmissionFactor => ({
  _key: 'k1',
  gas_id: 'g1',
  gwp: 1,
  factor: 2.68,
  factor_mass_unit: 'kg',
  coefficient: 1,
  uncertainty: '',
  emission_unit_id: 'u1',
  _deleted: false,
  ...overrides,
});

const renderTab = (props: Partial<ComponentProps<typeof EmissionFactorsTab>> = {}) => {
  const handlers = {
    onGasChange: vi.fn(),
    onUpdateFactor: vi.fn(),
    onClearFactorError: vi.fn(),
    onRemoveFactor: vi.fn(),
    onAddFactor: vi.fn(),
  };
  render(
    <EmissionFactorsTab
      isLoading={false}
      activeFactors={[factor()]}
      factorErrors={{}}
      gases={gases}
      groupedEmissionUnits={[{ key: 'k', label: 'Volumen', units: units as never }]}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

describe('EmissionFactorsTab', () => {
  it('debería mostrar los nombres completos de las columnas, sin abreviaturas', () => {
    renderTab();
    for (const name of [
      'Gas de efecto invernadero',
      'GWP',
      'Factor de emisión',
      'Unidad de masa',
      'Coeficiente',
      'Incertidumbre (%)',
      'Unidad de actividad',
    ]) {
      expect(screen.getByRole('columnheader', { name: new RegExp(name.replace(/[()]/g, '\\$&')) })).toBeInTheDocument();
    }
    expect(screen.queryByText('U. masa')).not.toBeInTheDocument();
    expect(screen.queryByText(/Incert\. %/)).not.toBeInTheDocument();
  });

  it('debería explicar la fórmula de cálculo y la guía de columnas', () => {
    renderTab();
    expect(screen.getByText(/cantidad × factor \(en kg\) × coeficiente × GWP ÷ 1000/)).toBeInTheDocument();
    expect(screen.getByText('¿Qué significa cada columna?')).toBeInTheDocument();
    expect(screen.getByText(/Se combina entre los factores/)).toBeInTheDocument();
  });

  it('debería mostrar el equivalente en CO₂e por unidad de actividad', () => {
    renderTab();
    expect(screen.getByText(/2,68 kg de CO₂e/)).toBeInTheDocument();
    expect(screen.getByText(/por cada L\./)).toBeInTheDocument();
  });

  it('debería aplicar la conversión de masa y el GWP en el equivalente', () => {
    renderTab({
      activeFactors: [factor({ gas_id: 'g2', gwp: 30, factor: 100, factor_mass_unit: 'g', coefficient: 2 })],
    });
    // 100 g = 0,1 kg × 2 × 30 = 6 kg CO₂e
    expect(screen.getByText(/6 kg de CO₂e/)).toBeInTheDocument();
  });

  it('debería pedir el factor mientras no esté ingresado', () => {
    renderTab({ activeFactors: [factor({ factor: '' })] });
    expect(screen.getByText(/Ingresa el factor y selecciona un gas/)).toBeInTheDocument();
    expect(screen.queryByText(/kg de CO₂e/)).not.toBeInTheDocument();
  });

  it('no debería avisar de GWP desactualizado cuando coincide con el del gas', () => {
    renderTab();
    expect(screen.queryByText(/GWP desactualizado/)).not.toBeInTheDocument();
  });

  it('debería avisar cuando el GWP del factor difiere del actual y permitir actualizarlo', async () => {
    const { onUpdateFactor } = renderTab({
      activeFactors: [factor({ gas_id: 'g2', gwp: 28 })],
    });
    expect(screen.getByText(/GWP desactualizado/)).toHaveTextContent('este factor usa 28 y el gas ahora tiene 30');

    await userEvent.click(screen.getByRole('button', { name: 'Actualizar a 30' }));

    expect(onUpdateFactor).toHaveBeenCalledWith('k1', { gwp: 30 });
  });

  it('debería nombrar el gas en el botón de eliminar y llamar al manejador', async () => {
    const { onRemoveFactor } = renderTab();
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar el factor de Dióxido de Carbono' }));
    expect(onRemoveFactor).toHaveBeenCalledWith('k1');
  });

  it('debería etiquetar cada control para lectores de pantalla', () => {
    renderTab();
    const row = screen.getAllByRole('row')[1];
    for (const label of [
      'Gas de efecto invernadero',
      'Factor de emisión',
      'Unidad de masa del factor',
      'Coeficiente',
      'Incertidumbre en porcentaje',
      'Unidad de actividad',
    ]) {
      expect(within(row).getByLabelText(label)).toBeInTheDocument();
    }
  });

  it('debería mostrar los errores de validación en texto legible', () => {
    renderTab({ factorErrors: { k1: { factor: 'El factor es requerido.' } } });
    expect(screen.getByText('El factor es requerido.')).toBeInTheDocument();
  });

  it('debería mostrar el estado vacío sin factores', () => {
    renderTab({ activeFactors: [] });
    expect(screen.getByText('Sin factores de emisión')).toBeInTheDocument();
  });
});
