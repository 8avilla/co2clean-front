'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Save, 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Mail,
  Upload,
  X,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ApiCompany, CompanyFormData, CompanySchema } from '../types';
import { CompanyService } from '../services/company.service';
import { LocationService, Department, Municipality } from '@/shared/services/location.service';
import { useFileUpload } from '@/shared/hooks/useFileUpload';

interface CompanyFormProps {
  initialData?: ApiCompany;
  isEditing?: boolean;
}

export const CompanyForm: React.FC<CompanyFormProps> = ({ initialData, isEditing = false }) => {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = React.useState<string | null>(initialData?.logoUrl ?? null);
  const { isUploading, uploadFile } = useFileUpload({
    maxSizeBytes: 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loadingLoc, setLoadingLoc] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormData>({
    resolver: zodResolver(CompanySchema),
    defaultValues: {
      name: initialData?.name ?? '',
      nit: initialData?.nit ?? '',
      email: initialData?.email ?? '',
      description: initialData?.description ?? '',
      logoUrl: initialData?.logoUrl ?? '',
      country: initialData?.country ?? 'Colombia',
      departmentId: initialData?.departmentId ?? '',
      municipalityId: initialData?.municipalityId ?? '',
      address: initialData?.address ?? '',
    },
  });

  const selectedDepartmentId = watch('departmentId');

  // Load departments on mount
  useEffect(() => {
    LocationService.getDepartments()
      .then((deps) => setDepartments(deps))
      .catch(() => toast.error('No se pudieron cargar los departamentos'))
      .finally(() => setLoadingLoc(false));
  }, []);

  // Load municipalities when department changes
  useEffect(() => {
    if (!selectedDepartmentId) {
      setMunicipalities([]);
      return;
    }
    LocationService.getMunicipalities(selectedDepartmentId)
      .then((muns) => {
        setMunicipalities(muns);
        if (initialData?.municipalityId && selectedDepartmentId === initialData.departmentId) {
          setValue('municipalityId', initialData.municipalityId);
        }
      })
      .catch(() => toast.error('No se pudieron cargar los municipios'));
  }, [selectedDepartmentId, setValue, initialData]);

  // When department changes, reset municipality selection
  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue('departmentId', e.target.value, { shouldValidate: true });
    setValue('municipalityId', '', { shouldValidate: false });
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately while uploading
    const localPreview = URL.createObjectURL(file);
    setLogoPreview(localPreview);
    setValue('logoUrl', '');

    const publicUrl = await uploadFile(file);

    if (publicUrl) {
      // Switch preview from local blob URL to the permanent Azure URL
      setLogoPreview(publicUrl);
      setValue('logoUrl', publicUrl);
    } else {
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.error('No se pudo subir el logo. Intenta de nuevo.');
    }

    URL.revokeObjectURL(localPreview);
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setValue('logoUrl', undefined);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: CompanyFormData) => {
    try {
      if (isEditing && initialData?.id) {
        await CompanyService.updateCompany(initialData.id, data);
        toast.success('Empresa actualizada exitosamente');
      } else {
        await CompanyService.createCompany(data);
        toast.success('Empresa creada exitosamente');
      }
      router.push('/empresas');
      router.refresh();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al guardar los datos';
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          Volver
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-5 border-b border-zinc-50 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <Building2 className="text-teal-600" size={18} />
              <h2 className="font-bold text-zinc-900 text-sm">Información de la Empresa</h2>
            </div>
            {!logoPreview && !isUploading && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
              >
                <Upload size={14} />
                Subir Logo
              </button>
            )}
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Logo Column */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative group">
                  <div
                    onClick={() => !isUploading && fileInputRef.current?.click()}
                    className={`w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${
                      isUploading
                        ? 'border-teal-300 bg-teal-50/30 cursor-wait'
                        : logoPreview
                          ? 'border-teal-500 bg-teal-50/10 cursor-pointer'
                          : 'border-zinc-200 bg-zinc-50 hover:border-teal-300 hover:bg-zinc-100 cursor-pointer'
                    }`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-2 text-teal-600">
                        <Loader2 size={22} className="animate-spin" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Subiendo...</span>
                      </div>
                    ) : logoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-zinc-400">
                        <Upload size={20} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-center px-2">Empresa Logo</span>
                      </div>
                    )}
                  </div>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeLogo();
                      }}
                      className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-all"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Fields Column */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600">
                    Nombre de la Empresa <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                    placeholder="Ej. EcoCore SAS"
                  />
                  {errors.name && <p className="text-[10px] text-red-500 font-medium">{errors.name.message}</p>}
                </div>

                {/* NIT */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600">
                    NIT <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('nit')}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                    placeholder="Ej. 900.123.456-7"
                  />
                  {errors.nit && <p className="text-[10px] text-red-500 font-medium">{errors.nit.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-600">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 text-zinc-400" size={14} />
                    <input
                      {...register('email')}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                      placeholder="admin@empresa.com"
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-red-500 font-medium">{errors.email.message}</p>}
                </div>

                {/* Descripción */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-600">Descripción</label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all resize-none text-sm"
                    placeholder="Breve descripción de la compañía..."
                  />
                  {errors.description && <p className="text-[10px] text-red-500 font-medium">{errors.description.message}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="p-5 border-b border-zinc-50 flex items-center gap-3 bg-zinc-50/50">
            <MapPin className="text-teal-600" size={18} />
            <h2 className="font-bold text-zinc-900 text-sm">Ubicación y Contacto</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {/* País */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-600">País</label>
              <input
                {...register('country')}
                readOnly
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 outline-none text-sm"
              />
            </div>

            {/* Departamento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-600">
                Departamento <span className="text-red-500">*</span>
              </label>
              {loadingLoc ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Cargando...
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
              {errors.departmentId && <p className="text-[10px] text-red-500 font-medium">{errors.departmentId.message}</p>}
            </div>

            {/* Municipio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-600">
                Municipio <span className="text-red-500">*</span>
              </label>
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
              {errors.municipalityId && <p className="text-[10px] text-red-500 font-medium">{errors.municipalityId.message}</p>}
            </div>

            {/* Dirección */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-bold text-zinc-600">
                Dirección Completa <span className="text-red-500">*</span>
              </label>
              <input
                {...register('address')}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all text-sm"
                placeholder="Ej. Carrera 50 # 10 - 20"
              />
              {errors.address && <p className="text-[10px] text-red-500 font-medium">{errors.address.message}</p>}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 rounded-lg font-bold text-zinc-500 hover:bg-zinc-100 transition-all"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-8 py-2.5 rounded-lg font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Guardando...' : isUploading ? 'Subiendo logo...' : (
              <>
                <Save size={18} />
                {isEditing ? 'Actualizar Empresa' : 'Crear Empresa'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
