import { Loader2, SlidersHorizontal } from 'lucide-react';
import type { EmissionSourceCategory } from '../../types';
import type { ApiUnitType } from '@/shared/services/emission-source.service';
import type { InfoErrors } from './types';

import { FORM_LABEL_CLASS, formInputClass } from '@/shared/components/Common/form-styles';
interface EmissionSourceInfoTabProps {
  isLoadingCatalogs: boolean;
  name: string;
  code: string;
  unitTypeId: string;
  categoryId: string;
  isActive: boolean;
  infoErrors: InfoErrors;
  unitTypes: ApiUnitType[];
  categories: EmissionSourceCategory[];
  activeFactorsCount: number;
  hasFactorErrors: boolean;
  onNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onUnitTypeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onToggleActive: () => void;
  onGoToFactors: () => void;
}

export const EmissionSourceInfoTab = ({
  isLoadingCatalogs,
  name,
  code,
  unitTypeId,
  categoryId,
  isActive,
  infoErrors,
  unitTypes,
  categories,
  activeFactorsCount,
  hasFactorErrors,
  onNameChange,
  onCodeChange,
  onUnitTypeChange,
  onCategoryChange,
  onToggleActive,
  onGoToFactors,
}: EmissionSourceInfoTabProps) => {
  const infoInputClass = (field: keyof InfoErrors) =>
    `w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm transition-all ${
      infoErrors[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30'
        : 'border-zinc-200 focus:ring-violet-500/20 focus:border-violet-500'
    }`;

  return (
  <div className="p-6 space-y-4">
        {isLoadingCatalogs ? (
          <div className="flex items-center justify-center py-10 gap-2 text-zinc-400">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Cargando catálogos...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <label className={FORM_LABEL_CLASS}>Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => onNameChange(e.target.value)}
                  placeholder="Ej: Diesel B10 - Fuentes Móviles"
                  className={infoInputClass('name')}
                />
                {infoErrors.name && (
                  <p className="text-xs text-red-500 font-medium">{infoErrors.name}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <label className={FORM_LABEL_CLASS}>Código</label>
                <input
                  type="text"
                  value={code}
                  onChange={e => onCodeChange(e.target.value)}
                  placeholder="Ej: ES-MOV-001"
                  className={`${formInputClass('violet')} font-mono`}
                />
              </div>
            </div>

            {/* Unit type */}
            <div className="space-y-1.5">
              <label className={FORM_LABEL_CLASS}>Tipo de medida</label>
              <select
                value={unitTypeId}
                onChange={e => onUnitTypeChange(e.target.value)}
                className={formInputClass('violet')}
              >
                <option value="">Sin tipo de medida</option>
                {unitTypes.map(ut => (
                  <option key={ut.id} value={ut.id}>{ut.name}</option>
                ))}
              </select>
            </div>

            {/* Category (managed in its own page) */}
            <div className="space-y-1.5">
              <label className={FORM_LABEL_CLASS}>Tipo de fuente</label>
              <select
                value={categoryId}
                onChange={e => onCategoryChange(e.target.value)}
                className={`${infoInputClass('categoryId')} bg-white`}
              >
                <option value="">Selecciona un tipo de fuente</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {infoErrors.categoryId && (
                <p className="text-xs text-red-500 font-medium">{infoErrors.categoryId}</p>
              )}
              <a
                href="/configuracion/categorias-fuentes"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-semibold text-violet-600 hover:text-violet-700 transition-colors"
              >
                ¿No encuentras el tipo de fuente? Gestionar tipos de fuente
              </a>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60">
              <div>
                <p className="text-sm font-semibold text-zinc-800">Fuente activa</p>
                <p className="text-xs text-zinc-400">Las fuentes inactivas no aparecen en formularios de registro.</p>
              </div>
              <button
                type="button"
                onClick={onToggleActive}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${isActive ? 'bg-teal-500' : 'bg-zinc-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {/* Factor count shortcut */}
            {activeFactorsCount > 0 && (
              <button
                type="button"
                onClick={onGoToFactors}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-zinc-100 bg-zinc-50/60 hover:bg-zinc-100/60 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={15} className="text-zinc-400 flex-shrink-0" />
                  <span className="text-sm font-semibold text-zinc-700">
                    {activeFactorsCount} {activeFactorsCount === 1 ? 'factor configurado' : 'factores configurados'}
                  </span>
                </div>
                <span className="text-xs font-semibold text-violet-600 flex-shrink-0">
                  {hasFactorErrors ? '⚠ Errores pendientes →' : 'Editar →'}
                </span>
              </button>
            )}
          </>
        )}
      </div>
  );
};
