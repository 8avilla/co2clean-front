'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { UserService } from '../services/user.service';
import { CompanyService } from '@/components/Companies/services/company.service';
import { RoleService } from '@/components/Roles/services/role.service';
import type { ApiCompany } from '@/components/Companies/types';
import type { ApiRole } from '@/components/Roles/types';
import type { ApiUserCompany } from '../types';
import { confirmDelete } from '@/shared/lib/confirm-dialog';

import { FORM_LABEL_CLASS, formInputClass } from '@/shared/components/Common/form-styles';
import { buttonClass } from '@/shared/components/Common/button-styles';
interface UserCompaniesPanelProps {
  userId: string;
  /** Reports how many companies the user is associated with (used by the tab badge) */
  onCountChange?: (count: number) => void;
}

export const UserCompaniesPanel = ({ userId, onCountChange }: UserCompaniesPanelProps) => {
  const [companies, setCompanies] = useState<ApiCompany[]>([]);
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [userCompanies, setUserCompanies] = useState<ApiUserCompany[]>([]);
  const [assocCompanyId, setAssocCompanyId] = useState('');
  const [assocRoleId, setAssocRoleId] = useState('');
  const [isAssociating, setIsAssociating] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(true);

  const loadUserCompanies = useCallback(async () => {
    setLoadingCompanies(true);
    try {
      setUserCompanies(await UserService.getUserCompanies(userId));
    } catch {
      toast.error('Error al cargar empresas asociadas');
    } finally {
      setLoadingCompanies(false);
    }
  }, [userId]);

  useEffect(() => {
    Promise.all([CompanyService.getCompanies(), RoleService.getRoles()])
      .then(([companiesData, rolesData]) => {
        setCompanies(companiesData);
        setRoles(rolesData);
      })
      .catch(() => toast.error('Error al cargar datos'));
  }, []);

  useEffect(() => {
    loadUserCompanies();
  }, [loadUserCompanies]);

  useEffect(() => {
    onCountChange?.(userCompanies.length);
  }, [userCompanies.length, onCountChange]);

  const availableCompanies = companies.filter(
    company => !userCompanies.some(association => association.companyId === company.id),
  );

  const handleAssociate = async () => {
    if (!assocCompanyId || !assocRoleId) {
      toast.error('Por favor seleccione una empresa y un rol');
      return;
    }
    setIsAssociating(true);
    try {
      await UserService.associateCompany(userId, assocCompanyId, assocRoleId);
      toast.success('Empresa asociada exitosamente');
      setAssocCompanyId('');
      setAssocRoleId('');
      loadUserCompanies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al asociar empresa');
    } finally {
      setIsAssociating(false);
    }
  };

  const handleDisassociate = async (companyId: string) => {
    const confirmed = await confirmDelete({
      title: '¿Desasociar esta empresa del usuario?',
      text: 'El usuario perderá el acceso a esa empresa.',
      confirmText: 'Sí, desasociar',
    });
    if (!confirmed) return;

    try {
      await UserService.disassociateCompany(userId, companyId);
      toast.success('Empresa desasociada exitosamente');
      loadUserCompanies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al desasociar empresa');
    }
  };

  return (
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <Building2 className="text-teal-600" size={16} />
            <div>
              <h2 className="font-bold text-zinc-900 text-sm">Empresas y Roles Asociados</h2>
              <p className="text-xs text-zinc-500">Asocie este usuario a múltiples empresas con diferentes permisos.</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Formulario de asociación */}
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
            <h3 className="text-sm font-bold text-zinc-900 mb-3 flex items-center gap-2">
              <Plus size={16} className="text-teal-600" /> Asociar nueva empresa
            </h3>
            <div className="flex flex-col md:flex-row items-end gap-4">
              <div className="flex-1 space-y-1">
                <label htmlFor="assoc-company" className={FORM_LABEL_CLASS}>Empresa</label>
                <select
                id="assoc-company"
                  value={assocCompanyId}
                  onChange={(e) => setAssocCompanyId(e.target.value)}
                  className={`${formInputClass('teal')} appearance-none`}
                >
                  <option value="">Seleccione empresa...</option>
                  {availableCompanies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 space-y-1">
                <label htmlFor="assoc-role" className={FORM_LABEL_CLASS}>Rol en esta Empresa</label>
                <select
                id="assoc-role"
                  value={assocRoleId}
                  onChange={(e) => setAssocRoleId(e.target.value)}
                  className={`${formInputClass('teal')} appearance-none`}
                >
                  <option value="">Seleccione rol...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* ── Mejora 2: botón teal ── */}
              <button
                type="button"
                onClick={handleAssociate}
                disabled={isAssociating || !assocCompanyId || !assocRoleId}
                className={`${buttonClass()} h-[38px] w-full md:w-auto`}
              >
                {isAssociating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Asociar
              </button>
            </div>
          </div>

          {/* Tabla de asociaciones */}
          {loadingCompanies ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-zinc-400" size={32} />
            </div>
          ) : userCompanies.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-200 rounded-xl">
              <Building2 className="mx-auto text-zinc-300 mb-2" size={32} />
              <p className="text-sm font-semibold text-zinc-500">Sin empresas asociadas</p>
              <p className="text-xs text-zinc-400 mt-1">Usa el formulario de arriba para asociar una empresa a este usuario.</p>
            </div>
          ) : (
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200">
                      <th className="px-4 py-2.5 font-bold text-zinc-700">Empresa</th>
                      <th className="px-4 py-2.5 font-bold text-zinc-700">NIT</th>
                      <th className="px-4 py-2.5 font-bold text-zinc-700">Rol Asignado</th>
                      <th className="px-4 py-2.5 font-bold text-zinc-700 text-center w-24">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {userCompanies.map((uc) => (
                      <tr key={uc.id} className="hover:bg-zinc-50/50 transition-colors group">
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-zinc-950 text-sm">{uc.company?.name ?? 'Empresa desconocida'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-zinc-500 font-medium">
                          {uc.company?.nit ?? '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200">
                            {uc.role?.name ?? 'Rol desconocido'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDisassociate(uc.companyId)}
                            className="text-zinc-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors inline-flex "
                            title="Desasociar empresa"
                    aria-label={`Desasociar ${uc.company?.name ?? 'empresa'}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};
