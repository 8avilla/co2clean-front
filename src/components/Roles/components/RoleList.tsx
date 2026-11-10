"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, ShieldCheck, RefreshCw, X } from "lucide-react";
import { ApiRole } from "../types";
import { RoleService } from "../services/role.service";
import { UserService } from "@/components/Users/services/user.service";
import { toast } from "sonner";
import { usePermission } from "@/shared/hooks/usePermission";
import { PermissionCode } from "@/shared/constants/permissions";
import { confirmDeleteWithImpact } from "@/shared/lib/confirm-delete-with-impact";
import { nextSortState, type SortDirection } from "@/shared/lib/list-utils";
import { escapeHtml } from "@/shared/lib/html";
import { PageHeader } from "@/shared/components/Common/PageHeader";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { SortableHeader } from "@/shared/components/Common/SortableHeader";
import { RowActions } from "@/shared/components/Common/RowActions";
import {
  CATEGORY_COLORS,
  getRoleModules,
} from "../utils/permission-categories";
import {
  RoleListItem,
  RoleSortKey,
  countUsersByRole,
  matchesRoleSearch,
  sortRoles,
} from "../utils/role-list.utils";
import { buildRoleDeletionWarningHtml } from "../utils/deletion-warning";
import { buttonClass } from "@/shared/components/Common/button-styles";

const RoleEmptyState = ({
  hasSearch,
  onClear,
  canCreate,
}: {
  hasSearch: boolean;
  onClear: () => void;
  canCreate: boolean;
}) => (
  <div className="px-6 py-16 flex flex-col items-center gap-3 text-center">
    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
      <ShieldCheck className="text-teal-500" size={22} />
    </div>
    <div>
      <p className="font-semibold text-zinc-900 text-sm">
        {hasSearch ? "Sin resultados" : "Sin roles registrados"}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {hasSearch
          ? "Prueba con otro nombre, descripción o módulo."
          : "Define los roles del sistema para controlar los accesos de cada usuario."}
      </p>
    </div>
    {hasSearch ? (
      <button
        onClick={onClear}
        className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors"
      >
        <X size={12} /> Limpiar búsqueda
      </button>
    ) : (
      canCreate && (
        <Link
          href="/roles/nuevo"
          className={buttonClass()}
        >
          <Plus size={15} /> Crear primer rol
        </Link>
      )
    )}
  </div>
);

const UsersBadge = ({ count }: { count?: number }) => {
  if (count === undefined)
    return <span className="text-xs text-zinc-300">—</span>;
  if (count === 0) {
    return <span className="text-xs text-zinc-400 italic">Sin usuarios</span>;
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
      {count} {count === 1 ? "usuario" : "usuarios"}
    </span>
  );
};

export const RoleList = () => {
  const [roles, setRoles] = useState<RoleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<RoleSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { hasPermission } = usePermission();

  const canManage = hasPermission(PermissionCode.MANAGE_ROLES);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setHasLoadError(false);
    try {
      // Users are only needed for the per-role counter, so a failure there must not hide the roles
      const [rolesData, usersResult] = await Promise.all([
        RoleService.getRoles(),
        UserService.getUsers().then(
          (users) => ({ users }),
          () => undefined,
        ),
      ]);
      const counts = usersResult
        ? countUsersByRole(usersResult.users)
        : undefined;
      setRoles(
        rolesData.map((role) => ({
          ...role,
          usersCount: counts ? (counts.get(role.id) ?? 0) : undefined,
        })),
      );
    } catch {
      setHasLoadError(true);
      toast.error("Error al cargar los roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleDelete = async (role: ApiRole) => {
    const confirmed = await confirmDeleteWithImpact({
      title: "¿Eliminar este rol?",
      loadImpact: () => RoleService.getRoleDeletionImpact(role.id),
      buildHtml: (impact) => buildRoleDeletionWarningHtml(role.name, impact),
      fallbackHtml: `<p>Vas a eliminar el rol <b>${escapeHtml(role.name)}</b>. Podría afectar a los usuarios que lo tengan asignado.</p><p>Esta acción no se puede deshacer.</p>`,
    });
    if (!confirmed) return;

    try {
      await RoleService.deleteRole(role.id);
      toast.success("Rol eliminado");
      fetchRoles();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar el rol",
      );
    }
  };

  const handleSort = (key: RoleSortKey) => {
    const next = nextSortState({ key: sortKey, direction: sortDirection }, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
  };

  const visibleRoles = useMemo(
    () =>
      sortRoles(
        roles.filter((role) => matchesRoleSearch(role, searchTerm)),
        sortKey,
        sortDirection,
      ),
    [roles, searchTerm, sortKey, sortDirection],
  );

  const totalPermissions = roles.reduce(
    (sum, role) => sum + (role.permissions?.length ?? 0),
    0,
  );
  const hasActiveSearch = !!searchTerm;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles y permisos"
        description={
          !loading && roles.length > 0
            ? `${roles.length} ${roles.length === 1 ? "rol" : "roles"} · ${totalPermissions} permisos configurados`
            : "Define qué acciones pueden realizar los usuarios en la plataforma."
        }
        actions={
          canManage && (
            <Link
              href="/roles/nuevo"
              className={buttonClass()}
            >
              <Plus size={18} />
              Nuevo rol
            </Link>
          )
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Buscar por nombre, descripción o módulo..."
            accent="teal"
            className="flex-1"
          />
          <button
            onClick={() => fetchRoles()}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            title="Recargar"
            aria-label="Recargar roles"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {hasLoadError && !loading ? (
          <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-zinc-700">
              No pudimos cargar los roles
            </p>
            <button
              onClick={() => fetchRoles()}
              className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <SortableHeader
                    label="Rol"
                    sortKey="name"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <SortableHeader
                    label="Módulos con acceso"
                    sortKey="permissions"
                    activeKey={sortKey}
                    direction={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Usuarios"
                    sortKey="users"
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
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex-shrink-0" />
                          <div className="h-4 bg-zinc-100 rounded w-28" />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-3 bg-zinc-100 rounded w-48" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-5 bg-zinc-100 rounded-full w-36" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-4 bg-zinc-100 rounded w-16" />
                      </td>
                      <td className="px-6 py-5" />
                    </tr>
                  ))
                ) : visibleRoles.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <RoleEmptyState
                        hasSearch={hasActiveSearch}
                        onClear={() => setSearchTerm("")}
                        canCreate={canManage}
                      />
                    </td>
                  </tr>
                ) : (
                  visibleRoles.map((role) => {
                    const modules = getRoleModules(role.permissions);
                    const nameCell = (
                      <>
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck size={20} />
                        </div>
                        <span className="font-bold text-zinc-900 group-hover:text-teal-700 transition-colors">
                          {role.name}
                        </span>
                      </>
                    );
                    return (
                      <tr
                        key={role.id}
                        className="hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="px-6 py-3">
                          {canManage ? (
                            <Link
                              href={`/roles/${role.id}`}
                              className="flex items-center gap-3 group"
                            >
                              {nameCell}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-3 group">
                              {nameCell}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-sm text-zinc-500 max-w-md truncate">
                            {role.description ?? "—"}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          {modules.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {modules.map((moduleName) => (
                                <span
                                  key={moduleName}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${CATEGORY_COLORS[moduleName] ?? CATEGORY_COLORS["Sistema"]}`}
                                >
                                  {moduleName}
                                </span>
                              ))}
                              <span className="text-xs text-zinc-400 ml-1">
                                ({role.permissions?.length ?? 0})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-amber-600 italic">
                              Sin permisos asignados
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <UsersBadge count={role.usersCount} />
                        </td>
                        <td className="px-6 py-3">
                          <RowActions
                            entityName={role.name}
                            editHref={`/roles/${role.id}`}
                            editLabel="Configurar permisos de"
                            canEdit={canManage}
                            canDelete={canManage}
                            onDelete={() => handleDelete(role)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
