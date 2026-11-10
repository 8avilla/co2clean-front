import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GasesList } from "../GasesList";
import type { Gas } from "../../types";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/shared/lib/confirm-dialog", () => ({ confirmDelete: vi.fn() }));
vi.mock("@/shared/services/deletion-impact.service", () => ({
  DeletionImpactService: { forGas: vi.fn() },
}));

vi.mock("@/shared/services/gas.service", () => ({
  GasService: {
    getGases: vi.fn(),
    createGas: vi.fn(),
    updateGas: vi.fn(),
    deleteGas: vi.fn(),
  },
}));

import { GasService } from "@/shared/services/gas.service";
import { DeletionImpactService } from "@/shared/services/deletion-impact.service";
import { confirmDelete } from "@/shared/lib/confirm-dialog";
const mockGasService = vi.mocked(GasService);
const mockConfirmDelete = vi.mocked(confirmDelete);
const mockImpact = vi.mocked(DeletionImpactService);

const gases: Gas[] = [
  {
    id: "1",
    chemical_name: "Dióxido de Carbono",
    formula: "CO₂",
    gwp: 1,
    calculation_type: "non_biogenic",
    is_active: true,
  },
  {
    id: "2",
    chemical_name: "Metano",
    formula: "CH₄",
    gwp: 28,
    calculation_type: "biogenic",
    is_active: true,
  },
  {
    id: "3",
    chemical_name: "Óxido Nitroso",
    formula: "N₂O",
    gwp: 273,
    calculation_type: "both",
    is_active: true,
  },
];

// Wait until skeleton rows (.animate-pulse) disappear — indicates loading finished
const waitForList = () =>
  waitFor(() => {
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBe(0);
  });

// Both mobile cards and desktop table render gas names; wrap table queries
const getTable = () => document.querySelector("table")!;

describe("GasesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGasService.getGases.mockResolvedValue(gases);
    mockImpact.forGas.mockResolvedValue({ factors: 0 });
  });

  // ── G-01: Lista carga correctamente ─────────────────────────────────────

  describe("G-01 — Lista carga y muestra los gases", () => {
    it("muestra los tres gases después de cargar", async () => {
      render(<GasesList />);
      await waitForList();
      // Both mobile and desktop render names — getAllByText handles duplicates
      expect(screen.getAllByText("Dióxido de Carbono").length).toBeGreaterThan(
        0,
      );
      expect(screen.getAllByText("Metano").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Óxido Nitroso").length).toBeGreaterThan(0);
    });

    it("muestra las fórmulas en formato monoespaciado", async () => {
      render(<GasesList />);
      await waitForList();
      expect(screen.getAllByText("CO₂").length).toBeGreaterThan(0);
      expect(screen.getAllByText("CH₄").length).toBeGreaterThan(0);
    });

    it("muestra el conteo total de gases", async () => {
      render(<GasesList />);
      await waitForList();
      // Count badge appears only once in the toolbar
      expect(screen.getByText("3 gases")).toBeInTheDocument();
    });

    it("muestra el skeleton de carga mientras carga", () => {
      mockGasService.getGases.mockReturnValue(new Promise(() => {}));
      render(<GasesList />);
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  // ── G-02: Lista vacía ────────────────────────────────────────────────────

  describe("G-02 — Lista vacía", () => {
    it("muestra el estado vacío cuando no hay gases", async () => {
      mockGasService.getGases.mockResolvedValue([]);
      render(<GasesList />);
      await waitForList();
      // EmptyState renders in both mobile and desktop — at least one visible
      expect(
        screen.getAllByText("Sin gases registrados").length,
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText("Crea el primer gas de efecto invernadero").length,
      ).toBeGreaterThan(0);
    });
  });

  // ── G-03: Error de red ───────────────────────────────────────────────────

  describe("G-03 — Error al cargar", () => {
    it("llama a toast.error cuando falla la carga", async () => {
      const { toast } = await import("sonner");
      mockGasService.getGases.mockRejectedValue(new Error("Sin conexión"));
      render(<GasesList />);
      await waitForList();
      expect(toast.error).toHaveBeenCalledWith("Sin conexión");
    });
  });

  // ── G-04: Búsqueda por nombre ────────────────────────────────────────────

  describe("G-04 — Búsqueda por nombre", () => {
    it("filtra gases cuyo nombre contiene el término buscado", async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.type(screen.getByPlaceholderText(/buscar/i), "metano");
      expect(screen.getAllByText("Metano").length).toBeGreaterThan(0);
      expect(screen.queryByText("Dióxido de Carbono")).not.toBeInTheDocument();
      expect(screen.queryByText("Óxido Nitroso")).not.toBeInTheDocument();
    });

    it("la búsqueda no distingue mayúsculas", async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.type(screen.getByPlaceholderText(/buscar/i), "DIÓXIDO");
      expect(screen.getAllByText("Dióxido de Carbono").length).toBeGreaterThan(
        0,
      );
    });
  });

  // ── G-05: Búsqueda por fórmula ───────────────────────────────────────────

  describe("G-05 — Búsqueda por fórmula", () => {
    it("filtra por fórmula química", async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.type(screen.getByPlaceholderText(/buscar/i), "N₂O");
      expect(screen.getAllByText("Óxido Nitroso").length).toBeGreaterThan(0);
      expect(screen.queryByText("Metano")).not.toBeInTheDocument();
    });
  });

  // ── G-06: Limpiar búsqueda ───────────────────────────────────────────────

  describe("G-06 — Limpiar búsqueda", () => {
    it("vuelve a mostrar todos los gases al limpiar el input", async () => {
      render(<GasesList />);
      await waitForList();
      const input = screen.getByPlaceholderText(/buscar/i);
      await userEvent.type(input, "metano");
      expect(screen.queryByText("Dióxido de Carbono")).not.toBeInTheDocument();
      await userEvent.clear(input);
      await waitFor(() => {
        expect(
          screen.getAllByText("Dióxido de Carbono").length,
        ).toBeGreaterThan(0);
        expect(screen.getAllByText("Metano").length).toBeGreaterThan(0);
      });
    });
  });

  // ── G-07: Filtro Biogénico ───────────────────────────────────────────────

  describe('G-07 — Filtro tipo "Biogénico"', () => {
    it('muestra solo gases biogénicos y "ambos", excluye no-biogénicos puros', async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.click(screen.getByRole("button", { name: "Biogénico" }));
      expect(screen.getAllByText("Metano").length).toBeGreaterThan(0); // biogenic
      expect(screen.getAllByText("Óxido Nitroso").length).toBeGreaterThan(0); // both
      expect(screen.queryByText("Dióxido de Carbono")).not.toBeInTheDocument(); // non_biogenic
    });
  });

  // ── G-08: Filtro No biogénico ────────────────────────────────────────────

  describe('G-08 — Filtro tipo "No biogénico"', () => {
    it('muestra solo gases no-biogénicos y "ambos", excluye biogénicos puros', async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.click(
        screen.getByRole("button", { name: "No biogénico" }),
      );
      expect(screen.getAllByText("Dióxido de Carbono").length).toBeGreaterThan(
        0,
      ); // non_biogenic
      expect(screen.getAllByText("Óxido Nitroso").length).toBeGreaterThan(0); // both
      expect(screen.queryByText("Metano")).not.toBeInTheDocument(); // biogenic
    });
  });

  // ── G-09: Filtro "Todos" ─────────────────────────────────────────────────

  describe('G-09 — Filtro "Todos" restaura la lista completa', () => {
    it("vuelve a mostrar todos los gases", async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.click(screen.getByRole("button", { name: "Biogénico" }));
      await userEvent.click(screen.getByRole("button", { name: "Todos" }));
      expect(screen.getAllByText("Dióxido de Carbono").length).toBeGreaterThan(
        0,
      );
      expect(screen.getAllByText("Metano").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Óxido Nitroso").length).toBeGreaterThan(0);
    });
  });

  // ── G-10 / G-11 / G-12: Ordenar por GWP ────────────────────────────────

  describe("G-10/G-11/G-12 — Ordenar (tabla desktop)", () => {
    const getTableGwpValues = () =>
      Array.from(getTable().querySelectorAll("tbody tr"))
        .map((row) => row.querySelectorAll("td")[2]?.textContent?.trim())
        .filter(Boolean) as string[];

    const toNumbers = (values: string[]) =>
      values
        .map((v) => parseFloat(v.replace(",", "")))
        .filter((n) => !isNaN(n));

    const clickGwpHeader = () =>
      userEvent.click(
        within(screen.getByRole("columnheader", { name: /gwp/i })).getByRole(
          "button",
        ),
      );

    it("G-10 — ordena de menor a mayor GWP (primer click)", async () => {
      render(<GasesList />);
      await waitForList();
      await clickGwpHeader();
      const nums = toNumbers(getTableGwpValues());
      expect(nums).toEqual([...nums].sort((a, b) => a - b));
    });

    it("G-11 — ordena de mayor a menor GWP (segundo click)", async () => {
      render(<GasesList />);
      await waitForList();
      await clickGwpHeader();
      await clickGwpHeader();
      const nums = toNumbers(getTableGwpValues());
      expect(nums).toEqual([...nums].sort((a, b) => b - a));
    });

    it("G-12 — por defecto ordena por nombre y lo indica con aria-sort", async () => {
      render(<GasesList />);
      await waitForList();
      expect(getTable().querySelector("tbody tr")?.textContent).toContain(
        "Dióxido de Carbono",
      );
      expect(
        screen.getByRole("columnheader", { name: /^gas/i }),
      ).toHaveAttribute("aria-sort", "ascending");
    });

    it("G-12b — ordena por fórmula", async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.click(
        within(
          screen.getByRole("columnheader", { name: /fórmula/i }),
        ).getByRole("button"),
      );
      expect(getTable().querySelector("tbody tr")?.textContent).toContain(
        "CH₄",
      );
    });
  });

  describe("G-12c — Formato numérico es-CO", () => {
    it("muestra el GWP con punto de miles de forma uniforme (4 y 5 cifras)", async () => {
      mockGasService.getGases.mockResolvedValue([
        {
          id: "a",
          chemical_name: "Gas A",
          formula: "A",
          gwp: 6140,
          calculation_type: "non_biogenic",
          is_active: true,
        },
        {
          id: "b",
          chemical_name: "Gas B",
          formula: "B",
          gwp: 13900,
          calculation_type: "non_biogenic",
          is_active: true,
        },
      ]);
      render(<GasesList />);
      await waitForList();
      const table = getTable();
      expect(within(table).getByText("6.140")).toBeInTheDocument();
      expect(within(table).getByText("13.900")).toBeInTheDocument();
    });
  });

  // ── G-13: Sin resultados de búsqueda ─────────────────────────────────────

  describe("G-13 — Sin resultados en la búsqueda", () => {
    it('muestra el mensaje "Sin resultados" y el botón para limpiar', async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.type(
        screen.getByPlaceholderText(/buscar/i),
        "xxxxxxxxxx",
      );
      expect(screen.getAllByText("Sin resultados").length).toBeGreaterThan(0);
      expect(
        screen.getAllByText("Prueba con otros filtros o términos de búsqueda")
          .length,
      ).toBeGreaterThan(0);
      // Botón "Limpiar filtros" aparece en EmptyState (puede haber duplicado)
      expect(
        screen.getAllByRole("button", { name: "Limpiar filtros" }).length,
      ).toBeGreaterThan(0);
    });

    it("limpiar filtros restaura la lista completa", async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.type(
        screen.getByPlaceholderText(/buscar/i),
        "xxxxxxxxxx",
      );
      // Click en el primero de los botones disponibles
      await userEvent.click(
        screen.getAllByRole("button", { name: "Limpiar filtros" })[0],
      );
      await waitFor(() => {
        expect(
          screen.getAllByText("Dióxido de Carbono").length,
        ).toBeGreaterThan(0);
      });
    });
  });

  // ── G-14: Combinar búsqueda y filtro ────────────────────────────────────

  describe("G-14 — Combinar búsqueda y filtro tipo", () => {
    it("aplica ambos filtros simultáneamente", async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.click(screen.getByRole("button", { name: "Biogénico" }));
      await userEvent.type(screen.getByPlaceholderText(/buscar/i), "metano");
      expect(screen.getAllByText("Metano").length).toBeGreaterThan(0);
      expect(screen.queryByText("Óxido Nitroso")).not.toBeInTheDocument();
      expect(screen.queryByText("Dióxido de Carbono")).not.toBeInTheDocument();
    });
  });

  // ── G-32: Eliminar con confirmación ─────────────────────────────────────

  describe("G-32 — Eliminar gas", () => {
    it("llama a deleteGas y elimina el gas de la lista", async () => {
      mockConfirmDelete.mockResolvedValue(true);
      mockGasService.deleteGas.mockResolvedValue(undefined);
      render(<GasesList />);
      await waitForList();

      await userEvent.click(
        within(getTable()).getByRole("button", { name: "Eliminar Metano" }),
      );

      await waitFor(() => {
        expect(mockGasService.deleteGas).toHaveBeenCalledWith("2");
        expect(screen.queryByText("Metano")).not.toBeInTheDocument();
      });
    });

    it("G-32b — advierte de los factores que usan el gas", async () => {
      mockImpact.forGas.mockResolvedValue({ factors: 7 });
      mockConfirmDelete.mockResolvedValue(false);
      render(<GasesList />);
      await waitForList();

      await userEvent.click(
        within(getTable()).getByRole("button", { name: "Eliminar Metano" }),
      );

      await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
      expect(mockConfirmDelete.mock.calls[0][0].html).toContain(
        "7 factores de emisión",
      );
    });

    it("G-32c — pide confirmación simple si falla el cálculo del impacto", async () => {
      mockImpact.forGas.mockRejectedValue(new Error("fail"));
      mockConfirmDelete.mockResolvedValue(false);
      render(<GasesList />);
      await waitForList();

      await userEvent.click(
        within(getTable()).getByRole("button", { name: "Eliminar Metano" }),
      );

      await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());
      expect(mockConfirmDelete.mock.calls[0][0].html).toContain("Metano");
    });

    it("G-32d — las acciones no dependen del hover", async () => {
      render(<GasesList />);
      await waitForList();
      const button = within(getTable()).getByRole("button", {
        name: "Editar Metano",
      });
      expect(button.closest("div")?.className).not.toContain("opacity-0");
    });

    it("G-32e — al hacer clic en la fila se abre la edición", async () => {
      render(<GasesList />);
      await waitForList();
      await userEvent.click(within(getTable()).getByText("Metano"));
      expect(
        await screen.findByRole("dialog", { name: "Editar gas" }),
      ).toBeInTheDocument();
    });

    it("G-32f — el botón eliminar no abre la edición", async () => {
      mockConfirmDelete.mockResolvedValue(false);
      render(<GasesList />);
      await waitForList();
      await userEvent.click(
        within(getTable()).getByRole("button", { name: "Eliminar Metano" }),
      );
      expect(screen.queryByRole("dialog", { name: "Editar gas" })).not.toBeInTheDocument();
    });
  });

  // ── G-33: Cancelar confirmación de eliminación ───────────────────────────

  describe("G-33 — No eliminar si se cancela la confirmación", () => {
    it("no llama a deleteGas si el usuario cancela", async () => {
      mockConfirmDelete.mockResolvedValue(false);
      render(<GasesList />);
      await waitForList();

      await userEvent.click(
        within(getTable()).getByRole("button", { name: "Eliminar Metano" }),
      );
      await waitFor(() => expect(mockConfirmDelete).toHaveBeenCalled());

      expect(mockGasService.deleteGas).not.toHaveBeenCalled();
      expect(screen.getAllByText("Metano").length).toBeGreaterThan(0);
    });
  });
});
