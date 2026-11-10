"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  Plus,
  User,
  SlidersHorizontal,
  X,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { ApiUser } from "../types";
import { UserService } from "../services/user.service";
import { AuthService } from "@/components/Auth/services/auth.service";
import { toast } from "sonner";
import { usePermission } from "@/shared/hooks/usePermission";
import { PermissionCode } from "@/shared/constants/permissions";
import { confirmDeleteWithImpact } from "@/shared/lib/confirm-delete-with-impact";
import { getActiveCompanyId, getCurrentUserId } from "@/shared/lib/session";
import { nextSortState, type SortDirection } from "@/shared/lib/list-utils";
import { PageHeader } from "@/shared/components/Common/PageHeader";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { SortableHeader } from "@/shared/components/Common/SortableHeader";
import { Pagination } from "@/shared/components/Common/Pagination";
import { RowActions } from "@/shared/components/Common/RowActions";
import { UserAvatar } from "./UserAvatar";
import {
  UserSortKey,
  getRoleBadgeColor,
  matchesUserSearch,
  sortUsers,
} from "../utils/user-list.utils";
import {
  buildUserDeletionWarningHtml,
  type UserDeletionImpact,
} from "../utils/deletion-warning";

import {
  FORM_LABEL_CLASS,
  formInputClass,
} from "@/shared/components/Common/form-styles";
import { buttonClass } from "@/shared/components/Common/button-styles";
const PAGE_SIZE = 10;

// Links to the edit page only when the user may edit; otherwise it is plain content
const RowLink = ({
  href,
  isEnabled,
  className,
  children,
}: {
  href: string;
  isEnabled: boolean;
  className: string;
  children: ReactNode;
}) =>
  isEnabled ? (
    <Link href={href} className={className}>
      {children}
    </Link>
  ) : (
    <div className={className}>{children}</div>
  );

const RoleBadge = ({ user }: { user: ApiUser }) =>
  user.isSuperAdmin ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-red-100 text-red-700 border-red-200">
      <ShieldCheck size={11} />
      Super Administrador
    </span>
  ) : (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role?.name)}`}
    >
      {user.role?.name ?? "Sin rol"}
    </span>
  );

const UserEmptyState = ({
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
      <User className="text-teal-500" size={22} />
    </div>
    <div>
      <p className="font-semibold text-zinc-900 text-sm">
        {hasSearch ? "Sin resultados" : "Sin usuarios registrados"}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {hasSearch
          ? "Prueba con otro nombre, correo o ajusta los filtros."
          : "Agrega el primer usuario para comenzar."}
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
          href="/usuarios/nuevo"
          className={buttonClass()}
        >
          <Plus size={15} /> Nuevo usuario
        </Link>
      )
    )}
  </div>
);

export const UserList = () => {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<UserSortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [filterRole, setFilterRole] = useState("");
  const { hasPermission } = usePermission();

  const canCreate = hasPermission(PermissionCode.CREATE_USERS);
  const canUpdate = hasPermission(PermissionCode.UPDATE_USERS);
  const canDelete = hasPermission(PermissionCode.DELETE_USERS);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setHasLoadError(false);
    try {
      setUsers(
        await UserService.getUsers(undefined, undefined, getActiveCompanyId()),
      );
    } catch {
      setHasLoadError(true);
      toast.error("Error al cargar los usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (user: ApiUser) => {
    const isCurrentUser = getCurrentUserId() === user.id;
    const buildHtml = (impact: UserDeletionImpact) =>
      buildUserDeletionWarningHtml({
        userName: user.name,
        impact,
        isCurrentUser,
      });

    const confirmed = await confirmDeleteWithImpact({
      title: "¿Eliminar este usuario?",
      loadImpact: () => UserService.getUserDeletionImpact(user.id),
      buildHtml,
      // Even without the impact, a deletion of your own account must still be flagged
      fallbackHtml: buildHtml({ companies: 0 }),
    });
    if (!confirmed) return;

    try {
      await UserService.deleteUser(user.id);
      toast.success("Usuario eliminado");
      if (isCurrentUser) {
        AuthService.logout();
        window.location.href = "/login";
        return;
      }
      fetchUsers();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar el usuario",
      );
    }
  };

  const roleNames = useMemo(
    () =>
      [
        ...new Set(
          users
            .map((u) => u.role?.name)
            .filter((name): name is string => !!name),
        ),
      ].sort(),
    [users],
  );

  const clearFilters = () => {
    setFilterRole("");
    setSearchTerm("");
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleSort = (key: UserSortKey) => {
    const next = nextSortState({ key: sortKey, direction: sortDirection }, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  };

  const visibleUsers = useMemo(
    () =>
      sortUsers(
        users.filter(
          (user) =>
            matchesUserSearch(user, searchTerm) &&
            (!filterRole || user.role?.name === filterRole),
        ),
        sortKey,
        sortDirection,
      ),
    [users, searchTerm, filterRole, sortKey, sortDirection],
  );

  const activeFiltersCount = filterRole ? 1 : 0;
  const hasActiveSearch = !!searchTerm || activeFiltersCount > 0;
  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / PAGE_SIZE));
  const pagedUsers = visibleUsers.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const emptyState = (
    <UserEmptyState
      hasSearch={hasActiveSearch}
      onClear={clearFilters}
      canCreate={canCreate}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        description={
          !loading && users.length > 0
            ? `${users.length} ${users.length === 1 ? "usuario" : "usuarios"} · ${roleNames.length} ${roleNames.length === 1 ? "rol" : "roles"}`
            : "Administra los accesos y roles de los integrantes de cada empresa."
        }
        actions={
          canCreate && (
            <Link
              href="/usuarios/nuevo"
              className={buttonClass()}
            >
              <Plus size={18} />
              Nuevo usuario
            </Link>
          )
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <SearchInput
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre, correo, rol o empresa..."
              accent="teal"
              className="flex-1"
            />
            <button
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap ${
                showFilters || activeFiltersCount > 0
                  ? "bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-500/20"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 flex items-center justify-center bg-white text-teal-700 rounded-full text-xs font-black">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 border border-zinc-200 transition-colors"
                title="Limpiar filtros"
                aria-label="Limpiar filtros"
              >
                <X size={16} />
              </button>
            )}
            <button
              onClick={() => fetchUsers()}
              disabled={loading}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-50"
              title="Recargar"
              aria-label="Recargar usuarios"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {showFilters && (
            <div className="pt-3 border-t border-zinc-100">
              <div className="space-y-1 max-w-xs">
                <label htmlFor="user-filter-role" className={FORM_LABEL_CLASS}>
                  Rol
                </label>
                <select
                  id="user-filter-role"
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setPage(1);
                  }}
                  className={formInputClass("teal")}
                >
                  <option value="">Todos los roles</option>
                  {roleNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {hasLoadError && !loading && (
          <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-zinc-700">
              No pudimos cargar los usuarios
            </p>
            <button
              onClick={() => fetchUsers()}
              className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        )}

        {!hasLoadError && (
          <>
            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-zinc-100">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 animate-pulse space-y-2">
                      <div className="h-4 bg-zinc-100 rounded w-2/3" />
                      <div className="h-3 bg-zinc-100 rounded w-1/2" />
                    </div>
                  ))
                : pagedUsers.length > 0
                  ? pagedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="p-4 flex items-center justify-between gap-3"
                      >
                        <RowLink
                          href={`/usuarios/${user.id}`}
                          isEnabled={canUpdate}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          <UserAvatar name={user.name} />
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-bold text-zinc-900 text-sm truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-zinc-500 truncate">
                              {user.email}
                            </p>
                            <div className="pt-1">
                              <RoleBadge user={user} />
                            </div>
                          </div>
                        </RowLink>
                        <RowActions
                          entityName={user.name}
                          editHref={`/usuarios/${user.id}`}
                          canEdit={canUpdate}
                          canDelete={canDelete}
                          onDelete={() => handleDelete(user)}
                        />
                      </div>
                    ))
                  : emptyState}
            </div>

            {/* Desktop table view */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <SortableHeader
                      label="Usuario"
                      sortKey="name"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Rol"
                      sortKey="role"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Empresa"
                      sortKey="company"
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
                            <div className="w-9 h-9 rounded-full bg-zinc-100 flex-shrink-0" />
                            <div className="space-y-1.5">
                              <div className="h-4 bg-zinc-100 rounded w-28" />
                              <div className="h-3 bg-zinc-100 rounded w-40" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-5 bg-zinc-100 rounded-full w-16" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-3 bg-zinc-100 rounded w-24" />
                        </td>
                        <td className="px-6 py-5" />
                      </tr>
                    ))
                  ) : pagedUsers.length > 0 ? (
                    pagedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <RowLink
                            href={`/usuarios/${user.id}`}
                            isEnabled={canUpdate}
                            className="flex items-center gap-3 group"
                          >
                            <UserAvatar name={user.name} />
                            <span className="flex flex-col">
                              <span className="font-bold text-zinc-900 group-hover:text-teal-700 transition-colors">
                                {user.name}
                              </span>
                              <span className="text-xs text-zinc-500">
                                {user.email}
                              </span>
                            </span>
                          </RowLink>
                        </td>
                        <td className="px-6 py-3">
                          <RoleBadge user={user} />
                        </td>
                        <td className="px-6 py-3 text-sm text-zinc-500">
                          {user.company?.name ?? "—"}
                        </td>
                        <td className="px-6 py-3">
                          <RowActions
                            entityName={user.name}
                            editHref={`/usuarios/${user.id}`}
                            canEdit={canUpdate}
                            canDelete={canDelete}
                            onDelete={() => handleDelete(user)}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>{emptyState}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !hasLoadError && visibleUsers.length > PAGE_SIZE && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={visibleUsers.length}
            itemsLabel="usuarios"
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};
