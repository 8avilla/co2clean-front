'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  MapPin, 
  Trash2, 
  Edit2, 
  Building,
  Navigation,
  Globe
} from 'lucide-react';
import { ApiHeadquarter, HeadquarterFormData } from '../types';
import { BranchFormModal } from './BranchFormModal';
import { CompanyService } from '../services/company.service';
import { toast } from 'sonner';

interface BranchListProps {
  companyId: string;
  initialBranches: ApiHeadquarter[];
}

export const BranchList: React.FC<BranchListProps> = ({ companyId, initialBranches }) => {
  const [branches, setBranches] = useState<ApiHeadquarter[]>(initialBranches);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<ApiHeadquarter | null>(null);

  const handleAdd = () => {
    setEditingBranch(null);
    setIsModalOpen(true);
  };

  const handleEdit = (branch: ApiHeadquarter) => {
    setEditingBranch(branch);
    setIsModalOpen(true);
  };

  const handleDelete = async (branchId: string) => {
    if (confirm('¿Estás seguro de eliminar esta sede?')) {
      try {
        await CompanyService.deleteHeadquarter(branchId);
        setBranches(branches.filter(b => b.id !== branchId));
        toast.success('Sede eliminada');
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error al eliminar la sede';
        toast.error(msg);
      }
    }
  };

  const handleSubmit = async (data: HeadquarterFormData) => {
    try {
      if (editingBranch) {
        const updated = await CompanyService.updateHeadquarter(editingBranch.id!, data);
        setBranches(branches.map(b => b.id === editingBranch.id ? updated : b));
        toast.success('Sede actualizada');
      } else {
        const created = await CompanyService.createHeadquarter(companyId, data);
        setBranches([...branches, created]);
        toast.success('Sede añadida');
      }
      setIsModalOpen(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar la sede';
      toast.error(msg);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <Building className="text-teal-600" size={20} />
          <h2 className="font-bold text-zinc-900">Sedes Asociadas</h2>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm active:scale-95"
        >
          <Plus size={16} />
          Añadir Sede
        </button>
      </div>

      {/* Table Section */}
      <div className="p-6">
        {branches.length > 0 ? (
          <div className="border border-zinc-100 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-200">
                  <th className="p-4 font-bold text-zinc-700 w-[35%]">Nombre de la Sede</th>
                  <th className="p-4 font-bold text-zinc-700 w-[25%]">Dirección</th>
                  <th className="p-4 font-bold text-zinc-700 w-[25%]">Ubicación</th>
                  <th className="p-4 font-bold text-zinc-700 text-center w-[15%]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-zinc-50/30 transition-colors group">
                    {/* Sede Name & Description */}
                    <td className="p-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-zinc-950 text-sm block">{branch.name}</span>
                        {branch.description && (
                          <span className="text-zinc-500 text-xs block truncate max-w-xs" title={branch.description}>
                            {branch.description}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Address with MapPin Icon */}
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-2 text-zinc-600 font-medium">
                        <MapPin className="text-zinc-400" size={15} />
                        <span>{branch.address || '—'}</span>
                      </div>
                    </td>

                    {/* Municipality and Department */}
                    <td className="p-4 align-middle text-zinc-600">
                      <div className="flex items-center gap-2 font-medium">
                        <Globe className="text-zinc-400" size={15} />
                        <span>
                          {branch.municipality?.name && branch.department?.name 
                            ? `${branch.municipality.name}, ${branch.department.name}`
                            : '—'
                          }
                        </span>
                      </div>
                    </td>

                    {/* Action Buttons (Edit and Delete) */}
                    <td className="p-4 align-middle text-center">
                      <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(branch)}
                          className="p-1.5 text-zinc-500 hover:text-teal-600 hover:bg-teal-50 hover:border-teal-200 rounded-lg transition-all shadow-sm border border-zinc-100 bg-white"
                          title="Editar Sede"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(branch.id!)}
                          className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 rounded-lg transition-all shadow-sm border border-zinc-100 bg-white"
                          title="Eliminar Sede"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center border border-dashed border-zinc-200 rounded-xl bg-zinc-50/20">
            <Building className="mx-auto text-zinc-400 mb-2" size={32} />
            <p className="text-sm font-semibold text-zinc-700">No hay sedes registradas</p>
            <p className="text-xs text-zinc-400 mt-1">Añada su primera sede para esta empresa usando el botón superior.</p>
          </div>
        )}
      </div>

      <BranchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingBranch}
      />
    </div>
  );
};
