'use client';

import { useState, useEffect, type SyntheticEvent } from 'react';
import {
  X,
  FireExtinguisher,
  Factory,
  Car,
  FileText,
  Cloud,
  Zap,
  Trash2,
  Package,
  Cog,
  Snowflake,
  Truck,
  Bus,
  Droplets,
  Thermometer,
  Plane,
  Tag
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { id: 'FireExtinguisher', icon: FireExtinguisher },
  { id: 'Factory', icon: Factory },
  { id: 'Car', icon: Car },
  { id: 'FileText', icon: FileText },
  { id: 'Cloud', icon: Cloud },
  { id: 'Zap', icon: Zap },
  { id: 'Trash2', icon: Trash2 },
  { id: 'Package', icon: Package },
  { id: 'Cog', icon: Cog },
  { id: 'Snowflake', icon: Snowflake },
  { id: 'Truck', icon: Truck },
  { id: 'Bus', icon: Bus },
  { id: 'Droplets', icon: Droplets },
  { id: 'Thermometer', icon: Thermometer },
  { id: 'Plane', icon: Plane },
  { id: 'Tag', icon: Tag },
];

import { EmissionSourceCategory, EMISSION_GROUPS } from '../types';

interface EmissionSourceCategoryFormModalProps {
  category?: EmissionSourceCategory;
  onSave: (category: Omit<EmissionSourceCategory, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

type FormErrors = Partial<Record<'name' | 'code', string>>;

const CODE_PATTERN = /^[A-Z0-9_]+$/;

export const EmissionSourceCategoryFormModal = ({
  category,
  onSave,
  onClose,
}: EmissionSourceCategoryFormModalProps) => {
  const isEditing = !!category;

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [emissionGroupId, setEmissionGroupId] = useState(EMISSION_GROUPS[0].id);
  const [icon, setIcon] = useState('Tag');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setErrors({});
    if (category) {
      setName(category.name);
      setCode(category.code);
      setDescription(category.description);
      setEmissionGroupId(category.emission_group_id);
      setIcon(category.icon || 'Tag');
    } else {
      setName('');
      setCode('');
      setDescription('');
      setEmissionGroupId(EMISSION_GROUPS[0].id);
      setIcon('Tag');
    }
  }, [category]);

  const clearError = (field: keyof FormErrors) =>
    setErrors(prev => { const next = { ...prev }; delete next[field]; return next; });

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!name.trim()) {
      next.name = 'El nombre es requerido.';
    } else if (name.trim().length < 2) {
      next.name = 'El nombre debe tener al menos 2 caracteres.';
    }

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      next.code = 'El código es requerido.';
    } else if (trimmedCode.length < 2) {
      next.code = 'El código debe tener al menos 2 caracteres.';
    } else if (!CODE_PATTERN.test(trimmedCode)) {
      next.code = 'Solo letras mayúsculas, números y guión bajo (_).';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    onSave({
      id: category?.id,
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description.trim(),
      emission_group_id: emissionGroupId,
      icon,
      is_active: category?.is_active ?? true,
    });
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm transition-all ${
      errors[field]
        ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30'
        : 'border-zinc-200 focus:ring-violet-500/20 focus:border-violet-500'
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900">
            {isEditing ? 'Editar categoría de emisión' : 'Nueva categoría de emisión'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Nombre
              </label>
              <input
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); clearError('name'); }}
                placeholder="Ej: Combustión Móvil"
                className={inputClass('name')}
              />
              {errors.name && (
                <p className="text-xs text-red-500 font-medium">{errors.name}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                Código
              </label>
              <input
                type="text"
                value={code}
                onChange={e => { setCode(e.target.value.toUpperCase()); clearError('code'); }}
                placeholder="Ej: MOVIL"
                maxLength={20}
                className={`${inputClass('code')} font-mono uppercase`}
              />
              {errors.code && (
                <p className="text-xs text-red-500 font-medium">{errors.code}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe el tipo de fuentes que agrupa esta categoría..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Grupo de emisión
            </label>
            <select
              value={emissionGroupId}
              onChange={e => setEmissionGroupId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white transition-all"
            >
              {EMISSION_GROUPS.map(group => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Ícono
            </label>
            <div className="grid grid-cols-8 gap-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
              {AVAILABLE_ICONS.map(({ id, icon: IconComponent }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIcon(id)}
                  className={`p-2 flex items-center justify-center rounded-lg transition-all ${
                    icon === id
                      ? 'bg-violet-100 text-violet-700 shadow-sm border border-violet-200'
                      : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 border border-transparent'
                  }`}
                  title={id}
                >
                  <IconComponent size={18} />
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all shadow-sm active:scale-95"
            >
              {isEditing ? 'Guardar cambios' : 'Crear categoría de emisión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
