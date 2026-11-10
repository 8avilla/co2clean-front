"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Plus, Loader2 } from "lucide-react";
import { getCategoryIcon } from "../constants/category-icons";
import { toast } from "sonner";
import { EmissionSourceCategory } from "../types";
import { useEmissionGroups } from "../hooks/useEmissionGroups";
import { EmissionSourceCategoryService } from "@/shared/services/emission-source-category.service";
import { EmissionSourceCategoryFormModal } from "./EmissionSourceCategoryFormModal";
import { PageHeader } from "@/shared/components/Common/PageHeader";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { SortableHeader } from "@/shared/components/Common/SortableHeader";
import { RowActions } from "@/shared/components/Common/RowActions";
import { DeletionImpactService } from "@/shared/services/deletion-impact.service";
import { confirmDeleteWithImpact } from "@/shared/lib/confirm-delete-with-impact";
import { nextSortState, type SortDirection } from "@/shared/lib/list-utils";
import {
  CategorySortKey,
  matchesCategorySearch,
  sortCategories,
} from "../utils/category-list.utils";
import {
  buildCategoryDeletionWarningHtml,
  buildPlainDeletionHtml,
} from "../utils/deletion-warning";
import { buttonClass } from "@/shared/components/Common/button-styles";

const getGroupBadgeClass = (label: string) => {
  if (label.startsWith("Alcance 1"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (label.startsWith("Alcance 2"))
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (label.startsWith("Alcance 3"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  return "bg-violet-50 text-violet-700 border-violet-200";
};

export const EmissionSourceCategoryList = () => {
  const { groups: emissionGroups, getGroupLabel: resolveGroupLabel } =
    useEmissionGroups();
  const getGroupLabel = useCallback(
    (id: string) => resolveGroupLabel(id) || id,
    [resolveGroupLabel],
  );
  const [categories, setCategories] = useState<EmissionSourceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [sortKey, setSortKey] = useState<CategorySortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    EmissionSourceCategory | undefined
  >(undefined);

  useEffect(() => {
    EmissionSourceCategoryService.getCategories()
      .then(setCategories)
      .catch(() => toast.error("Error al cargar los tipos de fuentes"))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredCategories = useMemo(
    () =>
      sortCategories(
        categories.filter(
          (category) =>
            matchesCategorySearch(category, searchTerm) &&
            (!groupFilter || category.emission_group_id === groupFilter),
        ),
        sortKey,
        sortDirection,
        (category) =>
          category.emission_group_name ||
          getGroupLabel(category.emission_group_id),
      ),
    [
      categories,
      searchTerm,
      groupFilter,
      sortKey,
      sortDirection,
      getGroupLabel,
    ],
  );

  const handleSort = (key: CategorySortKey) => {
    const next = nextSortState({ key: sortKey, direction: sortDirection }, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
  };

  const handleOpenCreate = () => {
    setEditingCategory(undefined);
    setModalOpen(true);
  };
  const handleOpenEdit = (category: EmissionSourceCategory) => {
    setEditingCategory(category);
    setModalOpen(true);
  };

  const handleSave = async (
    data: Omit<EmissionSourceCategory, "id"> & { id?: string },
  ) => {
    try {
      if (data.id) {
        const updated = await EmissionSourceCategoryService.updateCategory(
          data.id,
          data,
        );
        setCategories((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
        toast.success("Tipo de fuente actualizado exitosamente");
      } else {
        const created = await EmissionSourceCategoryService.createCategory({
          name: data.name,
          code: data.code,
          description: data.description,
          emission_group_id: data.emission_group_id,
        });
        setCategories((prev) => [...prev, created]);
        toast.success("Tipo de fuente creado exitosamente");
      }
      setModalOpen(false);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al guardar el tipo de fuente";
      toast.error(message);
    }
  };

  const handleDelete = async (category: EmissionSourceCategory) => {
    const confirmed = await confirmDeleteWithImpact({
      title: "¿Eliminar este tipo de fuente?",
      loadImpact: () => DeletionImpactService.forEmissionCategory(category.id),
      buildHtml: (impact) =>
        buildCategoryDeletionWarningHtml(category.name, impact),
      fallbackHtml: buildPlainDeletionHtml("el tipo de fuente", category.name),
    });
    if (!confirmed) return;
    try {
      await EmissionSourceCategoryService.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      toast.success("Tipo de fuente eliminado exitosamente");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Error al eliminar el tipo de fuente";
      toast.error(message);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          title="Tipos de Fuentes"
          description="Administra los tipos que agrupan las fuentes de emisión."
          actions={
            <>
              <button
                onClick={handleOpenCreate}
                className={buttonClass()}
              >
                <Plus size={18} />
                Nuevo tipo de fuente
              </button>
            </>
          }
        />

        {/* Search & Filter */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex flex-col sm:flex-row gap-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre o descripción..."
            className="flex-1"
          />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700 sm:w-64"
          >
            <option value="">Todos los grupos</option>
            {emissionGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-zinc-400">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-sm">Cargando tipos de fuente...</span>
            </div>
          ) : (
            <>
              {/* Mobile card view */}
              <div className="md:hidden divide-y divide-zinc-100">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-start justify-between gap-3 p-4"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="flex flex-shrink-0 items-center justify-center w-10 h-10 border rounded-xl bg-violet-50 border-violet-100">
                          {(() => {
                            const Icon = getCategoryIcon(cat.icon);
                            return (
                              <Icon size={16} className="text-violet-500" />
                            );
                          })()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-zinc-900 text-sm">
                            {cat.name}
                          </p>
                          <span className="font-mono text-[10px] text-zinc-400">
                            {cat.code}
                          </span>
                          {cat.description && (
                            <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                              {cat.description}
                            </p>
                          )}
                          <div className="mt-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getGroupBadgeClass(cat.emission_group_name || getGroupLabel(cat.emission_group_id))}`}
                            >
                              {cat.emission_group_name ||
                                getGroupLabel(cat.emission_group_id)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <RowActions
                        entityName={cat.name}
                        onEdit={() => handleOpenEdit(cat)}
                        onDelete={() => handleDelete(cat)}
                      />
                    </div>
                  ))
                ) : (
                  <p className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No se encontraron tipos de fuente.
                  </p>
                )}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100">
                      <SortableHeader
                        label="Tipo de fuente"
                        sortKey="name"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <SortableHeader
                        label="Grupo de emisión"
                        sortKey="group"
                        activeKey={sortKey}
                        direction={sortDirection}
                        onSort={handleSort}
                      />
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredCategories.length > 0 ? (
                      filteredCategories.map((cat) => (
                        <tr
                          key={cat.id}
                          onClick={() => handleOpenEdit(cat)}
                          className="cursor-pointer hover:bg-zinc-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex flex-shrink-0 items-center justify-center w-9 h-9 border rounded-xl bg-violet-50 border-violet-100">
                                {(() => {
                                  const Icon = getCategoryIcon(cat.icon);
                                  return (
                                    <Icon
                                      size={15}
                                      className="text-violet-500"
                                    />
                                  );
                                })()}
                              </div>
                              <div>
                                <span className="font-bold text-zinc-900 block">
                                  {cat.name}
                                </span>
                                <span className="font-mono text-[10px] text-zinc-400">
                                  {cat.code}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-zinc-500 max-w-sm">
                            <span className="line-clamp-2">
                              {cat.description || "—"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getGroupBadgeClass(cat.emission_group_name || getGroupLabel(cat.emission_group_id))}`}
                            >
                              {cat.emission_group_name ||
                                getGroupLabel(cat.emission_group_id)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <RowActions
                              entityName={cat.name}
                              onEdit={() => handleOpenEdit(cat)}
                              onDelete={() => handleDelete(cat)}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-12 text-center text-zinc-500"
                        >
                          No se encontraron tipos de fuentes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {modalOpen && (
        <EmissionSourceCategoryFormModal
          category={editingCategory}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
