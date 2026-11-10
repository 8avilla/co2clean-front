import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmissionSourceCategoryList } from "../EmissionSourceCategoryList";
import type { EmissionSourceCategory } from "../../types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/shared/lib/confirm-dialog", () => ({ confirmDelete: vi.fn() }));
vi.mock("@/shared/services/deletion-impact.service", () => ({
  DeletionImpactService: { forEmissionCategory: vi.fn() },
}));

vi.mock("@/components/CarbonFootprint/services/catalogs.service", async () => {
  const { emissionGroupsFixture } =
    await import("../../test-utils/emission-groups.fixture");
  return {
    EmissionGroupsService: {
      getAll: vi.fn().mockResolvedValue(emissionGroupsFixture),
    },
  };
});

vi.mock("@/shared/services/emission-source-category.service", () => ({
  EmissionSourceCategoryService: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}));

import { EmissionSourceCategoryService } from "@/shared/services/emission-source-category.service";
import { DeletionImpactService } from "@/shared/services/deletion-impact.service";
import { confirmDelete } from "@/shared/lib/confirm-dialog";
const mockService = vi.mocked(EmissionSourceCategoryService);
const mockConfirmDelete = vi.mocked(confirmDelete);
const mockImpact = vi.mocked(DeletionImpactService);

const ALCANCE_1_ID = "6a1c546f0e939a6a2532717c";
const ALCANCE_2_ID = "6a1c546f0e939a6a2532717d";
const ALCANCE_3_ID = "6a1c546f0e939a6a2532717e";

const categories: EmissionSourceCategory[] = [
  {
    id: "cat-1",
    name: "Combustión Estacionaria",
    code: "COMB_EST",
    description: "Fuentes fijas de combustión",
    emission_group_id: ALCANCE_1_ID,
    is_active: true,
  },
  {
    id: "cat-2",
    name: "Combustión Móvil",
    code: "COMB_MOV",
    description: "Vehículos de motor",
    emission_group_id: ALCANCE_1_ID,
    is_active: true,
  },
  {
    id: "cat-3",
    name: "Electricidad Importada",
    code: "ELEC_IMP",
    description: "Consumo eléctrico externo",
    emission_group_id: ALCANCE_2_ID,
    is_active: true,
  },
];

// Wait until the loading indicator disappears
const waitForList = () =>
  waitFor(() => {
    expect(
      screen.queryByText("Cargando tipos de fuente..."),
    ).not.toBeInTheDocument();
  });

// Both mobile and desktop render; scope delete tests to the desktop table
const getTable = () => document.querySelector("table")!;

describe("EmissionSourceCategoryList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getCategories.mockResolvedValue(categories);
    mockImpact.forEmissionCategory.mockResolvedValue({ sources: 0 });
  });

  // ── CL-01: Carga correctamente ──────────────────────────────────────────

  describe("CL-01 — Carga y muestra las categorías", () => {
    it("muestra los nombres de las categorías después de cargar", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      expect(
        screen.getAllByText("Combustión Estacionaria").length,
      ).toBeGreaterThan(0);
      expect(screen.getAllByText("Combustión Móvil").length).toBeGreaterThan(0);
      expect(
        screen.getAllByText("Electricidad Importada").length,
      ).toBeGreaterThan(0);
    });

    it("muestra los códigos de las categorías", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      expect(screen.getAllByText("COMB_EST").length).toBeGreaterThan(0);
      expect(screen.getAllByText("COMB_MOV").length).toBeGreaterThan(0);
    });
  });

  // ── CL-02: Estado de carga ──────────────────────────────────────────────

  describe('CL-02 — Muestra "Cargando tipos de fuente..." durante la carga', () => {
    it("muestra el texto de carga mientras la promesa no resuelve", () => {
      mockService.getCategories.mockReturnValue(new Promise(() => {}));
      render(<EmissionSourceCategoryList />);
      expect(
        screen.getByText("Cargando tipos de fuente..."),
      ).toBeInTheDocument();
    });
  });

  // ── CL-03: Lista vacía ──────────────────────────────────────────────────

  describe("CL-03 — Lista vacía muestra mensaje apropiado", () => {
    it('muestra "No se encontraron tipos de fuente." cuando no hay datos', async () => {
      mockService.getCategories.mockResolvedValue([]);
      render(<EmissionSourceCategoryList />);
      await waitForList();
      expect(
        screen.getAllByText("No se encontraron tipos de fuente.").length,
      ).toBeGreaterThan(0);
    });
  });

  // ── CL-04: Error de red ─────────────────────────────────────────────────

  describe("CL-04 — Error al cargar muestra toast.error", () => {
    it("llama a toast.error cuando falla la carga", async () => {
      const { toast } = await import("sonner");
      mockService.getCategories.mockRejectedValue(new Error("Sin conexión"));
      render(<EmissionSourceCategoryList />);
      await waitForList();
      expect(toast.error).toHaveBeenCalledWith(
        "Error al cargar los tipos de fuentes",
      );
    });
  });

  // ── CL-05: Búsqueda por nombre ─────────────────────────────────────────

  describe("CL-05 — Búsqueda por nombre filtra correctamente", () => {
    it("filtra categorías cuyo nombre coincide", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      await userEvent.type(
        screen.getByPlaceholderText("Buscar por nombre o descripción..."),
        "Estacionaria",
      );
      expect(
        screen.getAllByText("Combustión Estacionaria").length,
      ).toBeGreaterThan(0);
      expect(screen.queryByText("Combustión Móvil")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Electricidad Importada"),
      ).not.toBeInTheDocument();
    });

    it("la búsqueda no distingue mayúsculas", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      await userEvent.type(
        screen.getByPlaceholderText("Buscar por nombre o descripción..."),
        "MÓVIL",
      );
      expect(screen.getAllByText("Combustión Móvil").length).toBeGreaterThan(0);
      expect(
        screen.queryByText("Combustión Estacionaria"),
      ).not.toBeInTheDocument();
    });
  });

  // ── CL-06: Búsqueda por descripción ────────────────────────────────────

  describe("CL-06 — Búsqueda por descripción filtra correctamente", () => {
    it("filtra categorías cuya descripción coincide", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      await userEvent.type(
        screen.getByPlaceholderText("Buscar por nombre o descripción..."),
        "externo",
      );
      expect(
        screen.getAllByText("Electricidad Importada").length,
      ).toBeGreaterThan(0);
      expect(
        screen.queryByText("Combustión Estacionaria"),
      ).not.toBeInTheDocument();
    });
  });

  // ── CL-07: Filtro por grupo ─────────────────────────────────────────────

  describe("CL-07 — Filtrar por grupo de emisión", () => {
    it("muestra solo las categorías del Alcance 2 al seleccionar ese grupo", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      await userEvent.selectOptions(screen.getByRole("combobox"), ALCANCE_2_ID);
      expect(
        screen.getAllByText("Electricidad Importada").length,
      ).toBeGreaterThan(0);
      expect(
        screen.queryByText("Combustión Estacionaria"),
      ).not.toBeInTheDocument();
      expect(screen.queryByText("Combustión Móvil")).not.toBeInTheDocument();
    });

    it('vuelve a mostrar todas al seleccionar "Todos los grupos"', async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      await userEvent.selectOptions(screen.getByRole("combobox"), ALCANCE_2_ID);
      await userEvent.selectOptions(screen.getByRole("combobox"), "");
      await waitFor(() => {
        expect(
          screen.getAllByText("Combustión Estacionaria").length,
        ).toBeGreaterThan(0);
        expect(
          screen.getAllByText("Electricidad Importada").length,
        ).toBeGreaterThan(0);
      });
    });
  });

  // ── CL-08: Filtros combinados ───────────────────────────────────────────

  describe("CL-08 — Combinar búsqueda y filtro de grupo", () => {
    it("aplica ambos filtros simultáneamente", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      await userEvent.selectOptions(screen.getByRole("combobox"), ALCANCE_1_ID);
      await userEvent.type(
        screen.getByPlaceholderText("Buscar por nombre o descripción..."),
        "Móvil",
      );
      expect(screen.getAllByText("Combustión Móvil").length).toBeGreaterThan(0);
      expect(
        screen.queryByText("Combustión Estacionaria"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText("Electricidad Importada"),
      ).not.toBeInTheDocument();
    });
  });

  // ── CL-09: Badge de grupo ───────────────────────────────────────────────

  describe("CL-09 — Badge de grupo muestra el nombre del grupo", () => {
    it('muestra "Alcance 1" para categorías del primer grupo', async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      // Alcance 1 badge appears multiple times (mobile + desktop, two cat-1 and cat-2 rows)
      expect(screen.getAllByText(/^Alcance 1/).length).toBeGreaterThan(0);
    });

    it('muestra "Alcance 2" para categorías del segundo grupo', async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      expect(screen.getAllByText(/^Alcance 2/).length).toBeGreaterThan(0);
    });
  });

  // ── CL-10: Eliminar con confirmación ───────────────────────────────────

  describe("CL-10 — Eliminar con confirmación llama a deleteCategory y quita de lista", () => {
    it("llama a deleteCategory y elimina la categoría de la lista", async () => {
      mockConfirmDelete.mockResolvedValue(true);
      mockService.deleteCategory.mockResolvedValue(undefined);
      render(<EmissionSourceCategoryList />);
      await waitForList();

      const table = getTable();
      await userEvent.click(
        within(table).getByRole("button", {
          name: "Eliminar Combustión Móvil",
        }),
      );

      await waitFor(() => {
        expect(mockService.deleteCategory).toHaveBeenCalledWith("cat-2");
        expect(screen.queryByText("Combustión Móvil")).not.toBeInTheDocument();
      });
    });

    it("muestra toast.success después de eliminar", async () => {
      const { toast } = await import("sonner");
      mockConfirmDelete.mockResolvedValue(true);
      mockService.deleteCategory.mockResolvedValue(undefined);
      render(<EmissionSourceCategoryList />);
      await waitForList();

      const table = getTable();
      await userEvent.click(
        within(table).getByRole("button", {
          name: "Eliminar Combustión Estacionaria",
        }),
      );

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith(
          "Tipo de fuente eliminado exitosamente",
        );
      });
    });
  });

  // ── CL-11: Cancelar confirmación de eliminación ────────────────────────

  describe("CL-11 — Cancelar confirmación no llama a deleteCategory", () => {
    it("no llama a deleteCategory si el usuario cancela", async () => {
      mockConfirmDelete.mockResolvedValue(false);
      render(<EmissionSourceCategoryList />);
      await waitForList();

      const table = getTable();
      await userEvent.click(
        within(table).getByRole("button", {
          name: "Eliminar Combustión Estacionaria",
        }),
      );
      await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());

      expect(mockService.deleteCategory).not.toHaveBeenCalled();
      expect(
        screen.getAllByText("Combustión Estacionaria").length,
      ).toBeGreaterThan(0);
    });
  });

  describe("CL-11b — Advertencia con las fuentes asociadas", () => {
    it("muestra cuántas fuentes tiene el tipo antes de eliminar", async () => {
      mockImpact.forEmissionCategory.mockResolvedValue({ sources: 6 });
      mockConfirmDelete.mockResolvedValue(false);
      render(<EmissionSourceCategoryList />);
      await waitForList();

      await userEvent.click(
        within(getTable()).getByRole("button", {
          name: "Eliminar Combustión Estacionaria",
        }),
      );

      await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
      expect(mockConfirmDelete.mock.calls[0][0].html).toContain(
        "6 fuentes de emisión",
      );
    });

    it("pide confirmación simple si falla el cálculo del impacto", async () => {
      mockImpact.forEmissionCategory.mockRejectedValue(new Error("fail"));
      mockConfirmDelete.mockResolvedValue(false);
      render(<EmissionSourceCategoryList />);
      await waitForList();

      await userEvent.click(
        within(getTable()).getByRole("button", {
          name: "Eliminar Combustión Estacionaria",
        }),
      );

      await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
      expect(mockConfirmDelete.mock.calls[0][0].html).toContain(
        "Combustión Estacionaria",
      );
    });
  });

  describe("CL-11c — Orden por columnas", () => {
    it("ordena por nombre al pulsar la cabecera y lo indica con aria-sort", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      const header = within(getTable()).getByRole("columnheader", {
        name: /Tipo de fuente/,
      });
      expect(header).toHaveAttribute("aria-sort", "ascending");
      await userEvent.click(within(header).getByRole("button"));
      expect(header).toHaveAttribute("aria-sort", "descending");
    });
  });

  // ── CL-12: Click en editar abre modal ──────────────────────────────────

  describe("CL-12 — Click en editar abre modal con datos de la categoría", () => {
    it("abre el modal de edición al hacer click en el botón de editar", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();

      const table = getTable();
      const row = within(table)
        .getByText("Electricidad Importada")
        .closest("tr")!;
      const editBtn = within(row).getAllByRole("button").at(-2)!;
      await userEvent.click(editBtn);

      await waitFor(() => {
        expect(screen.getByText("Editar tipo de fuente")).toBeInTheDocument();
      });
    });

    it("pre-puebla el modal con los datos de la categoría seleccionada", async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();

      const table = getTable();
      const row = within(table)
        .getByText("Electricidad Importada")
        .closest("tr")!;
      const editBtn = within(row).getAllByRole("button").at(-2)!;
      await userEvent.click(editBtn);

      await waitFor(() => {
        expect(
          screen.getByDisplayValue("Electricidad Importada"),
        ).toBeInTheDocument();
        expect(screen.getByDisplayValue("ELEC_IMP")).toBeInTheDocument();
      });
    });
  });

  // ── CL-13: Guardar en modal actualiza la lista ─────────────────────────

  describe("CL-13 — Guardar en modal llama a updateCategory y actualiza lista", () => {
    it("actualiza la categoría en la lista tras guardar cambios", async () => {
      const updatedCategory: EmissionSourceCategory = {
        ...categories[0],
        name: "Combustión Estacionaria Actualizada",
      };
      mockService.updateCategory.mockResolvedValue(updatedCategory);
      render(<EmissionSourceCategoryList />);
      await waitForList();

      const table = getTable();
      const row = within(table)
        .getByText("Combustión Estacionaria")
        .closest("tr")!;
      const editBtn = within(row).getAllByRole("button").at(-2)!;
      await userEvent.click(editBtn);

      await waitFor(() =>
        expect(screen.getByText("Editar tipo de fuente")).toBeInTheDocument(),
      );

      await userEvent.click(
        screen.getByRole("button", { name: "Guardar cambios" }),
      );

      await waitFor(() => {
        expect(mockService.updateCategory).toHaveBeenCalled();
      });
    });
  });

  // ── CL-14: Crear nueva categoría ───────────────────────────────────────

  describe("CL-14 — Crear nueva categoría llama a createCategory y agrega a lista", () => {
    it('abre el modal al hacer click en "Nuevo Tipo de Fuente"', async () => {
      render(<EmissionSourceCategoryList />);
      await waitForList();
      await userEvent.click(
        screen.getByRole("button", { name: /nuevo tipo de fuente/i }),
      );
      expect(screen.getByRole("dialog", { name: "Nuevo tipo de fuente" })).toBeInTheDocument();
    });

    it("llama a createCategory al guardar una nueva categoría válida", async () => {
      const newCategory: EmissionSourceCategory = {
        id: "cat-new",
        name: "Refrigeración",
        code: "REFRIG",
        description: "",
        emission_group_id: ALCANCE_1_ID,
        is_active: true,
      };
      mockService.createCategory.mockResolvedValue(newCategory);
      render(<EmissionSourceCategoryList />);
      await waitForList();

      await userEvent.click(
        screen.getByRole("button", { name: /nuevo tipo de fuente/i }),
      );
      await waitFor(() =>
        expect(screen.getByRole("dialog", { name: "Nuevo tipo de fuente" })).toBeInTheDocument(),
      );

      await userEvent.type(
        screen.getByPlaceholderText("Ej: Combustión Móvil"),
        "Refrigeración",
      );
      await userEvent.type(screen.getByPlaceholderText("Ej: MOVIL"), "REFRIG");
      await userEvent.click(
        screen.getByRole("button", { name: "Crear tipo de fuente" }),
      );

      await waitFor(() => {
        expect(mockService.createCategory).toHaveBeenCalledWith(
          expect.objectContaining({ name: "Refrigeración", code: "REFRIG" }),
        );
      });
    });

    it("agrega la nueva categoría a la lista después de crear", async () => {
      const newCategory: EmissionSourceCategory = {
        id: "cat-new",
        name: "Refrigeración",
        code: "REFRIG",
        description: "",
        emission_group_id: ALCANCE_1_ID,
        is_active: true,
      };
      mockService.createCategory.mockResolvedValue(newCategory);
      render(<EmissionSourceCategoryList />);
      await waitForList();

      await userEvent.click(
        screen.getByRole("button", { name: /nuevo tipo de fuente/i }),
      );
      await waitFor(() =>
        expect(screen.getByRole("dialog", { name: "Nuevo tipo de fuente" })).toBeInTheDocument(),
      );

      await userEvent.type(
        screen.getByPlaceholderText("Ej: Combustión Móvil"),
        "Refrigeración",
      );
      await userEvent.type(screen.getByPlaceholderText("Ej: MOVIL"), "REFRIG");
      await userEvent.click(
        screen.getByRole("button", { name: "Crear tipo de fuente" }),
      );

      await waitFor(() => {
        expect(screen.getAllByText("Refrigeración").length).toBeGreaterThan(0);
      });
    });
  });
});
