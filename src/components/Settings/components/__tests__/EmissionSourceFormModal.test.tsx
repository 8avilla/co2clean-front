import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmissionSourceFormModal } from '../EmissionSourceFormModal';
import type { EmissionSource } from '../../types';

// ── Mocks de servicios externos ──────────────────────────────────────────────

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock('@/shared/services/emission-source-category.service', () => ({
  EmissionSourceCategoryService: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
  },
}));

vi.mock('@/shared/services/emission-source.service', () => ({
  EmissionFactorService: { getFactors: vi.fn() },
  EmissionUnitService: { getUnits: vi.fn() },
  UnitTypeService: { getUnitTypes: vi.fn() },
}));

vi.mock('@/shared/services/gas.service', () => ({
  GasService: { getGases: vi.fn() },
}));

// Import AFTER vi.mock so they resolve to the mocked versions
import { EmissionSourceCategoryService } from '@/shared/services/emission-source-category.service';
import { EmissionFactorService, EmissionUnitService, UnitTypeService } from '@/shared/services/emission-source.service';
import { GasService } from '@/shared/services/gas.service';

// ── Fixtures ─────────────────────────────────────────────────────────────────

const defaultCategories = [
  { id: 'cat-1', name: 'Combustión Estacionaria', code: 'CE', description: '', emission_group_id: 'grp-1', is_active: true },
];

const defaultUnits = [
  { id: 'u-1', name: 'Tonelada de CO₂ equivalente', symbol: 'tCO₂eq' },
];

const defaultUnitTypes = [{ id: 'ut-1', name: 'Masa', code: 'MASS' }];

const defaultGases = [
  { id: 'gas-1', chemical_name: 'Dióxido de Carbono', formula: 'CO₂', gwp: 1,  calculation_type: 'non_biogenic', is_active: true },
  { id: 'gas-2', chemical_name: 'Metano',             formula: 'CH₄', gwp: 28, calculation_type: 'non_biogenic', is_active: true },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const onSave = vi.fn();
const onClose = vi.fn();

const renderModal = (source?: EmissionSource) =>
  render(<EmissionSourceFormModal source={source} onSave={onSave} onClose={onClose} />);

// Wait until catalog loader disappears
const waitForCatalogsToLoad = () =>
  waitFor(() => expect(screen.queryByText('Cargando catálogos...')).not.toBeInTheDocument());

const goToFactorsTab = async () => {
  await userEvent.click(screen.getByRole('button', { name: /factores de emisión/i }));
};

// Form has no accessible name so we find it with querySelector
const submitForm = () => fireEvent.submit(document.querySelector('form')!);

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('EmissionSourceFormModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Re-apply default mock implementations after clearAllMocks
    vi.mocked(EmissionSourceCategoryService.getCategories).mockResolvedValue(defaultCategories);
    vi.mocked(EmissionFactorService.getFactors).mockResolvedValue([]);
    vi.mocked(EmissionUnitService.getUnits).mockResolvedValue(defaultUnits);
    vi.mocked(UnitTypeService.getUnitTypes).mockResolvedValue(defaultUnitTypes);
    vi.mocked(GasService.getGases).mockResolvedValue(defaultGases);
  });

  // ── E-11: Submit sin nombre ──────────────────────────────────────────────

  describe('E-11 — Submit sin nombre', () => {
    it('muestra error de nombre requerido', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      submitForm();
      await waitFor(() => {
        expect(screen.getByText('El nombre es requerido.')).toBeInTheDocument();
      });
      expect(onSave).not.toHaveBeenCalled();
    });

    it('muestra error cuando el nombre tiene 1 caracter', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'A');
      submitForm();
      await waitFor(() => {
        expect(screen.getByText('El nombre debe tener al menos 2 caracteres.')).toBeInTheDocument();
      });
    });
  });

  // ── E-12: Submit sin categoría ───────────────────────────────────────────

  describe('E-12 — Submit sin categoría seleccionada', () => {
    it('muestra error de categoría requerida', async () => {
      renderModal();
      // The auto-category useEffect runs after catalogs load (a separate render cycle).
      // findByDisplayValue polls until the auto-selected value is reflected in the DOM.
      const catSelect = await screen.findByDisplayValue('Combustión Estacionaria');
      await userEvent.selectOptions(catSelect, '');
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Fuente test');
      submitForm();
      await waitFor(() => {
        expect(screen.getByText('Debes seleccionar una categoría de emisión.')).toBeInTheDocument();
      });
    });
  });

  // ── E-14: Flujo feliz crear fuente ──────────────────────────────────────

  describe('E-14 — Flujo feliz: crear fuente sin factores', () => {
    it('llama a onSave con los datos correctos cuando todo está completo', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Diesel industrial');
      // La categoría ya está seleccionada por defecto (cat-1)
      submitForm();
      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({ name: 'Diesel industrial' }),
          expect.objectContaining({ toCreate: [], toUpdate: [], toDelete: [] })
        );
      });
    });
  });

  // ── E-23: Agregar factor ─────────────────────────────────────────────────

  describe('E-23 — Agregar factor de emisión', () => {
    it('agrega una nueva fila al hacer click en Agregar factor', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());

      expect(screen.getAllByText(/sin factores/i).length).toBeGreaterThan(0);
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));
      expect(screen.queryByText(/sin factores/i)).not.toBeInTheDocument();
    });
  });

  // ── E-24: Cambiar gas actualiza GWP automáticamente ─────────────────────

  describe('E-24 — Cambiar gas actualiza GWP automáticamente', () => {
    it('muestra el GWP del gas seleccionado', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));

      // Seleccionar Metano (GWP = 28)
      const gasSelect = screen.getAllByRole('combobox')[0];
      await userEvent.selectOptions(gasSelect, 'gas-2');

      await waitFor(() => {
        expect(screen.getByText('28')).toBeInTheDocument();
      });
    });
  });

  // ── E-25: Sin gas seleccionado ───────────────────────────────────────────

  describe('E-25 — Factor sin gas seleccionado', () => {
    it('muestra error "Selecciona un gas" al hacer submit', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Fuente con factor');
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));

      // handleAddFactor auto-selects the first gas; explicitly clear it
      const gasSelect = screen.getAllByRole('combobox')[0];
      await userEvent.selectOptions(gasSelect, '');

      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Selecciona un gas.')).toBeInTheDocument();
      });
    });
  });

  // ── E-26 y E-27: Factor ≤ 0 ─────────────────────────────────────────────

  describe('E-26/E-27 — Factor debe ser mayor a 0', () => {
    const addFactorAndSubmit = async (factorValue: string) => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Fuente test');
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));

      const factorInput = screen.getByPlaceholderText('0.000');
      await userEvent.clear(factorInput);
      await userEvent.type(factorInput, factorValue);

      await userEvent.click(screen.getByRole('button', { name: /información/i }));
      submitForm();
    };

    it('E-26 — muestra error cuando el factor es 0', async () => {
      await addFactorAndSubmit('0');
      await waitFor(() => {
        expect(screen.getByText('El factor debe ser mayor a 0.')).toBeInTheDocument();
      });
    });

    it('E-27 — muestra error cuando el factor es negativo', async () => {
      await addFactorAndSubmit('-1');
      await waitFor(() => {
        expect(screen.getByText('El factor debe ser mayor a 0.')).toBeInTheDocument();
      });
    });
  });

  // ── E-28 y E-29: Incertidumbre fuera de rango ───────────────────────────

  describe('E-28/E-29 — Incertidumbre debe estar entre 0 y 100', () => {
    const addFactorWithUncertainty = async (value: string) => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Fuente test');
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));

      await userEvent.type(screen.getByPlaceholderText('0.000'), '2.5');
      await userEvent.type(screen.getByPlaceholderText('—'), value);

      await userEvent.click(screen.getByRole('button', { name: /información/i }));
      submitForm();
    };

    it('E-28 — muestra error cuando la incertidumbre supera 100', async () => {
      await addFactorWithUncertainty('101');
      await waitFor(() => {
        expect(screen.getByText('No puede superar el 100%.')).toBeInTheDocument();
      });
    });

    it('E-29 — muestra error cuando la incertidumbre es negativa', async () => {
      await addFactorWithUncertainty('-1');
      await waitFor(() => {
        expect(screen.getByText('No puede ser menor a 0%.')).toBeInTheDocument();
      });
    });
  });

  // ── E-30, E-31, E-32: Valores límite de incertidumbre ───────────────────

  describe('E-30/E-31/E-32 — Valores límite de incertidumbre son válidos', () => {
    it('E-30 — incertidumbre 0 no muestra error', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Fuente test');
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));
      await userEvent.type(screen.getByPlaceholderText('0.000'), '1');
      await userEvent.type(screen.getByPlaceholderText('—'), '0');
      await userEvent.click(screen.getByRole('button', { name: /información/i }));
      submitForm();
      await waitFor(() => {
        expect(screen.queryByText('No puede ser menor a 0%.')).not.toBeInTheDocument();
        expect(screen.queryByText('No puede superar el 100%.')).not.toBeInTheDocument();
      });
    });

    it('E-31 — incertidumbre 100 no muestra error', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Fuente test');
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));
      await userEvent.type(screen.getByPlaceholderText('0.000'), '1');
      await userEvent.type(screen.getByPlaceholderText('—'), '100');
      await userEvent.click(screen.getByRole('button', { name: /información/i }));
      submitForm();
      await waitFor(() => {
        expect(screen.queryByText('No puede superar el 100%.')).not.toBeInTheDocument();
      });
    });

    it('E-32 — incertidumbre vacía es válida (campo opcional)', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Fuente test');
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));
      await userEvent.type(screen.getByPlaceholderText('0.000'), '1');
      // Dejar incertidumbre vacía (campo opcional)
      await userEvent.click(screen.getByRole('button', { name: /información/i }));
      submitForm();
      await waitFor(() => {
        expect(screen.queryByText('No puede ser menor a 0%.')).not.toBeInTheDocument();
        expect(screen.queryByText('No puede superar el 100%.')).not.toBeInTheDocument();
      });
    });
  });

  // ── E-33: Sin unidad ────────────────────────────────────────────────────

  describe('E-33 — Factor sin unidad seleccionada', () => {
    it('muestra error "Selecciona una unidad" al hacer submit', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Fuente test');
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));

      await userEvent.type(screen.getByPlaceholderText('0.000'), '1');

      // Deseleccionar la unidad
      const unitSelect = screen.getAllByRole('combobox').at(-1)!;
      await userEvent.selectOptions(unitSelect, '');

      await userEvent.click(screen.getByRole('button', { name: /información/i }));
      submitForm();

      await waitFor(() => {
        expect(screen.getByText('Selecciona una unidad.')).toBeInTheDocument();
      });
    });
  });

  // ── E-34: Errores de celda se limpian ────────────────────────────────────

  describe('E-34 — Errores de celda se limpian al corregir', () => {
    it('limpia el error de factor al escribir un valor válido', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await userEvent.type(screen.getByPlaceholderText(/diesel b10/i), 'Fuente test');
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));

      // Provocar error de factor vacío
      await userEvent.click(screen.getByRole('button', { name: /información/i }));
      submitForm();

      // Volver a factores para ver el error
      await goToFactorsTab();
      await waitFor(() => {
        expect(screen.getByText('El factor es requerido.')).toBeInTheDocument();
      });

      // Corregir el factor
      const factorInput = screen.getByPlaceholderText('0.000');
      await userEvent.type(factorInput, '1');

      await waitFor(() => {
        expect(screen.queryByText('El factor es requerido.')).not.toBeInTheDocument();
      });
    });
  });

  // ── E-38: Contador de factores en el tab ─────────────────────────────────

  describe('E-38 — Contador de factores en el tab', () => {
    it('muestra el contador cuando hay 2 factores', async () => {
      renderModal();
      await waitForCatalogsToLoad();
      await goToFactorsTab();
      await waitFor(() => expect(screen.queryByText('Cargando factores...')).not.toBeInTheDocument());

      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));
      await userEvent.click(screen.getByRole('button', { name: /agregar factor/i }));

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });
  });
});
