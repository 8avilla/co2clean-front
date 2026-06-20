'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { UnitPicker } from './UnitPicker';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ApiCarbonFootprint,
  ApiEmissionGroup,
  ApiEmissionSource,
  ApiEmissionSubsource,
  ApiEmissionUnit,
  ApiCommercialUnit,
} from '../types';
import { CarbonFootprintService } from '../services/carbonFootprint.service';

interface ActiveCompany {
  id: string;
  name: string;
}

function getActiveCompanyFromSession(): ActiveCompany | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as { company?: ActiveCompany | null };
    return parsed.company ?? null;
  } catch {
    return null;
  }
}
import {
  EmissionGroupsService,
  EmissionSourcesService,
  EmissionSubsourcesService,
  EmissionUnitsService,
} from '../services/catalogs.service';

const EditSchema = z.object({
  year: z.string().min(4, 'Año requerido'),
  item: z.string().optional(),
  quantity: z.string().optional(),
  emissionGroupId: z.string().min(1, 'Grupo de emisiones requerido'),
  emissionSourceCategoryId: z.string().min(1, 'Categoría de fuente requerida'),
  emissionSubsourceId: z.string().min(1, 'Fuente de emisión requerida'),
  emissionUnitId: z.string().optional(),
});
type EditFormData = z.infer<typeof EditSchema>;

interface Props {
  recordId: string;
}

export const CarbonFootprintEditForm = ({ recordId }: Props) => {
  const router = useRouter();

  const [record, setRecord] = useState<ApiCarbonFootprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emissionGroups, setEmissionGroups] = useState<ApiEmissionGroup[]>([]);
  const [emissionSources, setEmissionSources] = useState<ApiEmissionSource[]>([]);
  const [emissionSubsources, setEmissionSubsources] = useState<ApiEmissionSubsource[]>([]);
  const [emissionUnits, setEmissionUnits] = useState<ApiEmissionUnit[]>([]);
  const [commercialUnits, setCommercialUnits] = useState<ApiCommercialUnit[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    control,
  } = useForm<EditFormData>({
    resolver: zodResolver(EditSchema),
  });

  const [watchGroupId, watchSourceCategoryId, watchSubsourceId, watchUnitId] = useWatch({
    control,
    name: ['emissionGroupId', 'emissionSourceCategoryId', 'emissionSubsourceId', 'emissionUnitId'],
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Read record from sessionStorage (set by CarbonFootprintList before navigation)
        let rec: ApiCarbonFootprint | null = null;
        if (typeof window !== 'undefined') {
          const cached = sessionStorage.getItem(`cf-edit-${recordId}`);
          if (cached) {
            try {
              rec = JSON.parse(cached) as ApiCarbonFootprint;
              sessionStorage.removeItem(`cf-edit-${recordId}`);
            } catch {
              // Invalid cache, ignore
            }
          }
        }

        // Fallback: search in the full list for this company
        if (!rec) {
          const activeCompany = getActiveCompanyFromSession();
          if (!activeCompany) throw new Error('No active company');
          const allRecords = await CarbonFootprintService.getCarbonFootprints({
            companyId: activeCompany.id,
            limit: 500,
          });
          rec = allRecords.find(r => r.id === recordId) ?? null;
        }

        if (!rec) throw new Error('Record not found');

        const [groups, sources, units] = await Promise.all([
          EmissionGroupsService.getAll(),
          EmissionSourcesService.getAll(),
          EmissionUnitsService.getAll(),
        ]);

        setRecord(rec);
        setEmissionGroups(groups);
        setEmissionSources(sources);
        setEmissionUnits(units);

        if (rec.emissionSourceCategoryId) {
          const subs = await EmissionSubsourcesService.getAll({
            emissionSourceCategoryId: rec.emissionSourceCategoryId,
          });
          setEmissionSubsources(subs);
        }

        if (rec.emissionSubsourceId) {
          try {
            const commUnits = await EmissionSubsourcesService.getSourceUnits(rec.emissionSubsourceId);
            setCommercialUnits(commUnits);
          } catch {
            // 404 means no commercial units configured for this source
          }
        }

        reset({
          year: rec.year.toString(),
          item: rec.item ?? '',
          quantity: rec.quantity?.toString() ?? '',
          emissionGroupId: rec.emissionGroupId ?? '',
          emissionSourceCategoryId: rec.emissionSourceCategoryId ?? '',
          emissionSubsourceId: rec.emissionSubsourceId ?? '',
          emissionUnitId: rec.emissionUnitId ?? '',
        });
      } catch {
        toast.error('Error al cargar el registro');
        router.push('/huella-carbono');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [recordId, reset, router]);

  const handleSourceCategoryChange = async (categoryId: string) => {
    setValue('emissionUnitId', undefined);
    setValue('emissionSubsourceId', '');
    setCommercialUnits([]);
    setEmissionSubsources([]);
    if (!categoryId) return;
    try {
      const subs = await EmissionSubsourcesService.getAll({
        emissionSourceCategoryId: categoryId,
      });
      setEmissionSubsources(subs);
    } catch {
      toast.error('Error al cargar las fuentes de emisión');
    }
  };

  const handleSubsourceChange = async (subsourceId: string) => {
    setValue('emissionUnitId', undefined);
    setCommercialUnits([]);
    if (!subsourceId) return;
    try {
      const units = await EmissionSubsourcesService.getSourceUnits(subsourceId);
      setCommercialUnits(units);
    } catch {
      // Fallback silencioso: unidades del catálogo por unitTypeId
    }
  };

  const selectedSubsource = emissionSubsources.find(ss => ss.id === watchSubsourceId);
  const filteredCatalogUnits = selectedSubsource?.unitTypeId
    ? emissionUnits.filter(u => u.unitTypeId === selectedSubsource.unitTypeId)
    : [];
  const selectedCommercialUnit = commercialUnits.find(
    u => (u.emissionUnitId ?? u.displaySymbol) === watchUnitId
  );
  const hasAnyUnits = commercialUnits.length > 0 || filteredCatalogUnits.length > 0;

  const filteredSources = watchGroupId
    ? emissionSources.filter(s => s.emissionGroupId === watchGroupId)
    : emissionSources;

  const onSubmit = async (data: EditFormData) => {
    setIsSubmitting(true);
    try {
      await CarbonFootprintService.updateCarbonFootprint(recordId, {
        year: parseInt(data.year),
        item: data.item || undefined,
        quantity: data.quantity ? parseFloat(data.quantity) : undefined,
        emissionGroupId: data.emissionGroupId || undefined,
        emissionSourceCategoryId: data.emissionSourceCategoryId || undefined,
        emissionSubsourceId: data.emissionSubsourceId || undefined,
        emissionUnitId: data.emissionUnitId || undefined,
      });
      toast.success('Registro actualizado exitosamente');
      router.push('/huella-carbono');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar el registro';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-2 text-zinc-400">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Cargando registro...</span>
      </div>
    );
  }

  if (!record) return null;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/huella-carbono')}
          className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Editar registro de emisión</h1>
          <p className="text-sm text-zinc-500">
            {record.emissionSource?.name ?? record.item ?? 'Registro'} — {record.year}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Datos generales</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
                Año de reporte
              </label>
              <select
                {...register('year')}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700"
              >
                {years.map(y => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>
              {errors.year && (
                <p className="text-xs text-red-500 mt-1">{errors.year.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">Período</label>
              <div className="px-3 py-2 text-sm rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-500">
                {record.loadMode === 'Monthly' ? 'Mensual' : 'Anual'}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
              Ítem / Descripción
            </label>
            <input
              {...register('item')}
              type="text"
              placeholder="Descripción del registro de emisión"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white placeholder-zinc-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
              Cantidad {record.loadMode === 'Monthly' ? '(mensual)' : '(anual)'}
            </label>
            <input
              {...register('quantity')}
              type="number"
              step="any"
              min="0"
              placeholder="0.00"
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white placeholder-zinc-400"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-4">
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Clasificación de la emisión
          </h2>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
              Grupo de emisiones
            </label>
            <select
              {...register('emissionGroupId')}
              onChange={e => {
                setValue('emissionGroupId', e.target.value);
                setValue('emissionSourceCategoryId', '');
                setValue('emissionSubsourceId', '');
                setValue('emissionUnitId', undefined);
                setEmissionSubsources([]);
                setCommercialUnits([]);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700"
            >
              <option value="">Selecciona un grupo</option>
              {emissionGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {errors.emissionGroupId && (
              <p className="text-xs text-red-500 mt-1">{errors.emissionGroupId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
              Categoría de fuente
            </label>
            <select
              {...register('emissionSourceCategoryId')}
              onChange={e => {
                setValue('emissionSourceCategoryId', e.target.value);
                handleSourceCategoryChange(e.target.value);
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700"
            >
              <option value="">Selecciona una categoría</option>
              {filteredSources.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.emissionSourceCategoryId && (
              <p className="text-xs text-red-500 mt-1">{errors.emissionSourceCategoryId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
              Fuente de emisión
            </label>
            <select
              {...register('emissionSubsourceId')}
              onChange={e => {
                setValue('emissionSubsourceId', e.target.value);
                handleSubsourceChange(e.target.value);
              }}
              disabled={!watchSourceCategoryId}
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none bg-white text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Selecciona una fuente</option>
              {emissionSubsources.map(ss => (
                <option key={ss.id} value={ss.id}>{ss.name}</option>
              ))}
            </select>
            {errors.emissionSubsourceId && (
              <p className="text-xs text-red-500 mt-1">{errors.emissionSubsourceId.message}</p>
            )}
          </div>

          {hasAnyUnits && (
            <div>
              <label className="block text-xs font-semibold text-zinc-600 mb-1.5">
                Unidad de medida
              </label>
              <UnitPicker
                value={watchUnitId ?? ''}
                onChange={val => setValue('emissionUnitId', val || undefined)}
                commercialUnits={commercialUnits}
                catalogUnits={filteredCatalogUnits}
                emptyLabel="Sin unidad"
                accentColor="violet"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pb-6">
          <button
            type="button"
            onClick={() => router.push('/huella-carbono')}
            className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            {isSubmitting
              ? <Loader2 size={14} className="animate-spin" />
              : <Save size={14} />}
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};
