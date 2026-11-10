"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { Plus, Building2, RefreshCw, X, AlertCircle } from "lucide-react";
import { ApiCompany } from "../types";
import { CompanyService } from "../services/company.service";
import { toast } from "sonner";
import { usePermission } from "@/shared/hooks/usePermission";
import { PermissionCode } from "@/shared/constants/permissions";
import { confirmDeleteWithImpact } from "@/shared/lib/confirm-delete-with-impact";
import { escapeHtml } from "@/shared/lib/html";
import { PageHeader } from "@/shared/components/Common/PageHeader";
import { SearchInput } from "@/shared/components/Common/SearchInput";
import { CompanyAvatar } from "./CompanyAvatar";
import { RowActions } from "@/shared/components/Common/RowActions";
import { SortableHeader } from "@/shared/components/Common/SortableHeader";
import { Pagination } from "@/shared/components/Common/Pagination";
import { nextSortState } from "@/shared/lib/list-utils";
import { HeadquartersBadge } from "./HeadquartersBadge";
import {
  CompanyListItem,
  CompanySortKey,
  SortDirection,
  countHeadquartersByCompany,
  matchesCompanySearch,
  sortCompanies,
} from "../utils/company-list.utils";
import { buildDeletionWarningHtml } from "../utils/deletion-warning";
import { buttonClass } from "@/shared/components/Common/button-styles";

const PAGE_SIZE = 10;

const formatLocation = (company: ApiCompany): string => {
  const municipality = company.municipality?.name;
  const department = company.department?.name;
  if (!municipality && !department) return "—";
  return [municipality, department].filter(Boolean).join(", ");
};

const CompanyEmptyState = ({
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
      <Building2 className="text-teal-500" size={22} />
    </div>
    <div>
      <p className="font-semibold text-zinc-900 text-sm">
        {hasSearch ? "Sin resultados" : "Sin empresas registradas"}
      </p>
      <p className="text-xs text-zinc-400 mt-1">
        {hasSearch
          ? "Prueba con otro nombre, NIT o correo."
          : "Agrega la primera empresa para comenzar."}
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
          href="/empresas/nueva"
          className={buttonClass()}
        >
          <Plus size={15} /> Nueva empresa
        </Link>
      )
    )}
  </div>
);

export const CompanyList = () => {
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<CompanySortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const { hasPermission } = usePermission();

  const canCreate = hasPermission(PermissionCode.CREATE_COMPANIES);
  const canUpdate = hasPermission(PermissionCode.UPDATE_COMPANIES);
  const canDelete = hasPermission(PermissionCode.DELETE_COMPANIES);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setHasLoadError(false);
    try {
      const [companyData, headquarters] = await Promise.all([
        CompanyService.getCompanies(),
        CompanyService.getHeadquarters(),
      ]);
      const counts = countHeadquartersByCompany(headquarters);
      setCompanies(
        companyData.map((company) => ({
          ...company,
          headquartersCount: counts.get(company.id) ?? 0,
        })),
      );
    } catch {
      setHasLoadError(true);
      toast.error("Error al cargar las empresas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = async (company: CompanyListItem) => {
    const confirmed = await confirmDeleteWithImpact({
      title: "¿Eliminar esta empresa?",
      loadImpact: () => CompanyService.getCompanyDeletionImpact(company.id),
      buildHtml: (impact) => buildDeletionWarningHtml(company.name, impact),
      fallbackHtml: `<p>Vas a eliminar <b>${escapeHtml(company.name)}</b>. Esta acción no se puede deshacer.</p>`,
    });
    if (!confirmed) return;

    try {
      await CompanyService.deleteCompany(company.id);
      toast.success("Empresa eliminada exitosamente");
      fetchCompanies();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error al eliminar la empresa",
      );
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleSort = (key: CompanySortKey) => {
    const next = nextSortState({ key: sortKey, direction: sortDirection }, key);
    setSortKey(next.key);
    setSortDirection(next.direction);
    setPage(1);
  };

  const visibleCompanies = useMemo(
    () =>
      sortCompanies(
        companies.filter((company) =>
          matchesCompanySearch(company, searchTerm),
        ),
        sortKey,
        sortDirection,
      ),
    [companies, searchTerm, sortKey, sortDirection],
  );

  const companiesWithoutHeadquarters = companies.filter(
    (c) => c.headquartersCount === 0,
  ).length;
  const hasActiveSearch = !!searchTerm;
  const totalPages = Math.max(
    1,
    Math.ceil(visibleCompanies.length / PAGE_SIZE),
  );
  const pagedCompanies = visibleCompanies.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const emptyState = (
    <CompanyEmptyState
      hasSearch={hasActiveSearch}
      onClear={() => handleSearchChange("")}
      canCreate={canCreate}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Empresas"
        description={
          !loading && companies.length > 0
            ? `${companies.length} ${companies.length === 1 ? "empresa registrada" : "empresas registradas"}`
            : "Administra las compañías registradas en el sistema."
        }
        actions={
          canCreate && (
            <Link
              href="/empresas/nueva"
              className={buttonClass()}
            >
              <Plus size={18} />
              Nueva empresa
            </Link>
          )
        }
      />

      {!loading && companiesWithoutHeadquarters > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <p>
            {companiesWithoutHeadquarters === 1
              ? "1 empresa no tiene sedes."
              : `${companiesWithoutHeadquarters} empresas no tienen sedes.`}{" "}
            Sin sedes no se pueden registrar datos de actividad.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre, NIT o correo..."
            accent="teal"
            className="flex-1"
          />
          <button
            onClick={() => fetchCompanies()}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors disabled:opacity-50"
            title="Recargar"
            aria-label="Recargar empresas"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {hasLoadError && !loading && (
          <div className="px-6 py-12 flex flex-col items-center gap-3 text-center">
            <p className="text-sm font-semibold text-zinc-700">
              No pudimos cargar las empresas
            </p>
            <button
              onClick={() => fetchCompanies()}
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
                      <div className="h-3 bg-zinc-100 rounded w-1/3" />
                    </div>
                  ))
                : pagedCompanies.length > 0
                  ? pagedCompanies.map((company) => (
                      <div
                        key={company.id}
                        className="p-4 flex items-center justify-between gap-3"
                      >
                        <Link
                          href={`/empresas/${company.id}`}
                          className="flex items-center gap-3 min-w-0 flex-1"
                        >
                          <CompanyAvatar
                            name={company.name}
                            logoUrl={company.logoUrl}
                          />
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-bold text-zinc-900 text-sm truncate">
                              {company.name}
                            </p>
                            <p className="text-xs text-zinc-500">
                              NIT: {company.nit}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {formatLocation(company)}
                            </p>
                            <div className="pt-1">
                              <HeadquartersBadge
                                count={company.headquartersCount}
                              />
                            </div>
                          </div>
                        </Link>
                        <RowActions
                          entityName={company.name}
                          editHref={`/empresas/${company.id}`}
                          canEdit={canUpdate}
                          canDelete={canDelete}
                          onDelete={() => handleDelete(company)}
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
                      label="Empresa"
                      sortKey="name"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="NIT"
                      sortKey="nit"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableHeader
                      label="Sedes"
                      sortKey="headquarters"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={handleSort}
                    />
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Ubicación
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      Contacto
                    </th>
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
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 flex-shrink-0" />
                            <div className="h-4 bg-zinc-100 rounded w-32" />
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-3 bg-zinc-100 rounded w-24" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-3 bg-zinc-100 rounded w-16" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-3 bg-zinc-100 rounded w-28" />
                        </td>
                        <td className="px-6 py-5">
                          <div className="h-3 bg-zinc-100 rounded w-36" />
                        </td>
                        <td className="px-6 py-5" />
                      </tr>
                    ))
                  ) : pagedCompanies.length > 0 ? (
                    pagedCompanies.map((company) => (
                      <tr
                        key={company.id}
                        className="hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/empresas/${company.id}`}
                            className="flex items-center gap-3 group"
                          >
                            <CompanyAvatar
                              name={company.name}
                              logoUrl={company.logoUrl}
                            />
                            <span className="font-bold text-zinc-900 group-hover:text-teal-700 transition-colors">
                              {company.name}
                            </span>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 font-medium">
                          {company.nit}
                        </td>
                        <td className="px-6 py-4">
                          <HeadquartersBadge
                            count={company.headquartersCount}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {formatLocation(company)}
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-500">
                          {company.email}
                        </td>
                        <td className="px-6 py-4">
                          <RowActions
                            entityName={company.name}
                            editHref={`/empresas/${company.id}`}
                            canEdit={canUpdate}
                            canDelete={canDelete}
                            onDelete={() => handleDelete(company)}
                          />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>{emptyState}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !hasLoadError && visibleCompanies.length > PAGE_SIZE && (
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={visibleCompanies.length}
            itemsLabel="empresas"
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
};
