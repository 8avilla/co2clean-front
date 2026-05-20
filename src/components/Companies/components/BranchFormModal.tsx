'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, Loader2 } from 'lucide-react';
import { ApiHeadquarter, HeadquarterFormData, HeadquarterSchema } from '../types';
import { LocationService, Department, Municipality } from '@/shared/services/location.service';

interface BranchFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: HeadquarterFormData) => Promise<void>;
  initialData?: ApiHeadquarter | null;
}

export const BranchFormModal: React.FC<BranchFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialData 
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<HeadquarterFormData>({
    resolver: zodResolver(HeadquarterSchema),
  });

  const selectedDepartmentId = watch('departmentId');

  // Load departments once
  useEffect(() => {
    LocationService.getDepartments()
      .then((deps) => setDepartments(deps))
      .finally(() => setLoadingLoc(false));
  }, []);

  // Load municipalities when department changes
  useEffect(() => {
    if (!selectedDepartmentId) {
      setMunicipalities([]);
      return;
    }
    LocationService.getMunicipalities(selectedDepartmentId).then(setMunicipalities);
  }, [selectedDepartmentId]);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description ?? '',
        address: initialData.address ?? '',
        departmentId: initialData.departmentId ?? '',
        municipalityId: initialData.municipalityId ?? '',
      });
      // Pre-load municipalities for edit
      if (initialData.departmentId) {
        LocationService.getMunicipalities(initialData.departmentId).then((muns) => {
          setMunicipalities(muns);
          setValue('municipalityId', initialData.municipalityId ?? '');
        });
      }
    } else {
      reset({
        name: '',
        description: '',
        address: '',
        departmentId: '',
        municipalityId: '',
      });
    }
  }, [initialData, reset, isOpen]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue('departmentId', e.target.value, { shouldValidate: true });
    setValue('municipalityId', '', { shouldValidate: false });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h3 className="font-bold text-lg text-zinc-900">
            {initialData ? 'Editar Sede' : 'Nueva Sede'}
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-lg transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {/* Nombre */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-700">Nombre de la Sede</label>
              <input
                {...register('name')}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                placeholder="Ej. Sede Norte"
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Descripción */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-700">Descripción</label>
              <input
                {...register('description')}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                placeholder="Ej. Oficina administrativa"
              />
            </div>

            {/* Dirección */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-zinc-700">Dirección</label>
              <input
                {...register('address')}
                className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                placeholder="Ej. Calle 10 # 20-30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Departamento */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-zinc-700">Departamento</label>
                {loadingLoc ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 text-sm">
                    <Loader2 size={14} className="animate-spin" />
                  </div>
                ) : (
                  <select
                    {...register('departmentId')}
                    onChange={handleDepartmentChange}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none text-sm bg-white"
                  >
                    <option value="">Seleccione...</option>
                    {departments.map((dep) => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Municipio */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-zinc-700">Municipio</label>
                <select
                  {...register('municipalityId')}
                  disabled={!selectedDepartmentId || municipalities.length === 0}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all appearance-none text-sm bg-white disabled:bg-zinc-50 disabled:text-zinc-400"
                >
                  <option value="">Seleccione...</option>
                  {municipalities.map((mun) => (
                    <option key={mun.id} value={mun.id}>{mun.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : (
                <>
                  <Save size={18} />
                  {initialData ? 'Actualizar' : 'Añadir Sede'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
