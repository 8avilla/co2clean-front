'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { EmissionSourceCategory, EMISSION_GROUPS } from '../types';

interface EmissionSourceCategoryFormModalProps {
  category: EmissionSourceCategory | undefined;
  onSave: (category: Omit<EmissionSourceCategory, 'id'> & { id?: string }) => void;
  onClose: () => void;
}

export const EmissionSourceCategoryFormModal = ({
  category,
  onSave,
  onClose,
}: EmissionSourceCategoryFormModalProps) => {
  const isEditing = !!category;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emissionGroupId, setEmissionGroupId] = useState(EMISSION_GROUPS[0].id);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setDescription(category.description);
      setEmissionGroupId(category.emission_group_id);
    } else {
      setName('');
      setDescription('');
      setEmissionGroupId(EMISSION_GROUPS[0].id);
    }
  }, [category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: category?.id,
      name: name.trim(),
      description: description.trim(),
      emission_group_id: emissionGroupId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-900">
            {isEditing ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              Nombre
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Combustión Móvil"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm transition-all"
            />
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
              {isEditing ? 'Guardar cambios' : 'Crear categoría'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
