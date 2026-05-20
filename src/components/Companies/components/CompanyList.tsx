'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Edit2,
  Trash2
} from 'lucide-react';
import { ApiCompany } from '../types';
import { CompanyService } from '../services/company.service';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';

export const CompanyList = () => {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { hasPermission } = usePermission();

  const fetchCompanies = async () => {
    try {
      const data = await CompanyService.getCompanies();
      setCompanies(data);
    } catch (error) {
      toast.error('Error al cargar las empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta empresa y todas sus sedes?')) {
      try {
        await CompanyService.deleteCompany(id);
        toast.success('Empresa eliminada exitosamente');
        fetchCompanies();
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al eliminar la empresa';
        toast.error(msg);
      }
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nit.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Gestión de Empresas</h1>
          <p className="text-sm text-zinc-500">Administra las compañías y sedes registradas en el sistema.</p>
        </div>
        {hasPermission(PermissionCode.CREATE_COMPANIES) && (
          <Link
            href="/empresas/nueva"
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nueva Empresa
          </Link>
        )}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o NIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Empresa</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">NIT</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ubicación</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Contacto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Sedes</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8"><div className="h-4 bg-zinc-100 rounded w-full"></div></td>
                  </tr>
                ))
              ) : filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold overflow-hidden border border-teal-100/50">
                          {company.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            company.name.charAt(0)
                          )}
                        </div>
                        <span className="font-bold text-zinc-900">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-600 font-medium">
                      {company.nit}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {company.municipality?.name ?? '—'}{company.department?.name ? `, ${company.department.name}` : ''}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {company.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200">
                        {(company.headquarters ?? []).length}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission(PermissionCode.UPDATE_COMPANIES) && (
                          <Link
                            href={`/empresas/${company.id}`}
                            className="p-2 text-zinc-400 hover:text-teal-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                          >
                            <Edit2 size={16} />
                          </Link>
                        )}
                        {hasPermission(PermissionCode.DELETE_COMPANIES) && (
                          <button
                            onClick={() => handleDelete(company.id!)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No se encontraron empresas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
