"use client";

import { useState, useEffect, type SyntheticEvent } from "react";
import { X, Loader2 } from "lucide-react";

import { EmissionSourceCategory } from "../types";
import {
  CATEGORY_ICONS,
  SELECTABLE_CATEGORY_ICON_IDS,
} from "../constants/category-icons";
import { useEmissionGroups } from "../hooks/useEmissionGroups";

import {
  FORM_LABEL_CLASS,
  formInputClass,
} from "@/shared/components/Common/form-styles";
import { buttonClass } from "@/shared/components/Common/button-styles";
import { Modal } from "@/shared/components/Common/Modal";
interface EmissionSourceCategoryFormModalProps {
  category?: EmissionSourceCategory;
  onSave: (
    category: Omit<EmissionSourceCategory, "id"> & { id?: string },
  ) => void | Promise<void>;
  onClose: () => void;
}

type FormErrors = Partial<Record<"name" | "code", string>>;

const CODE_PATTERN = /^[A-Z0-9_]+$/;

export const EmissionSourceCategoryFormModal = ({
  category,
  onSave,
  onClose,
}: EmissionSourceCategoryFormModalProps) => {
  const isEditing = !!category;

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const { groups: emissionGroups } = useEmissionGroups();
  const [selectedGroupId, setSelectedGroupId] = useState("");
  // Falls back to the first available group until the user picks one
  const emissionGroupId = selectedGroupId || emissionGroups[0]?.id || "";
  const [icon, setIcon] = useState("Tag");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setErrors({});
    if (category) {
      setName(category.name);
      setCode(category.code);
      setDescription(category.description);
      setSelectedGroupId(category.emission_group_id);
      setIcon(category.icon || "Tag");
    } else {
      setName("");
      setCode("");
      setDescription("");
      setSelectedGroupId("");
      setIcon("Tag");
    }
  }, [category]);

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!name.trim()) {
      next.name = "El nombre es requerido.";
    } else if (name.trim().length < 2) {
      next.name = "El nombre debe tener al menos 2 caracteres.";
    }

    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      next.code = "El código es requerido.";
    } else if (trimmedCode.length < 2) {
      next.code = "El código debe tener al menos 2 caracteres.";
    } else if (!CODE_PATTERN.test(trimmedCode)) {
      next.code = "Solo letras mayúsculas, números y guión bajo (_).";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave({
        id: category?.id,
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
        emission_group_id: emissionGroupId,
        icon,
        is_active: category?.is_active ?? true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = (field: keyof FormErrors) =>
    `w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 text-sm transition-all ${
      errors[field]
        ? "border-red-400 focus:ring-red-500/20 focus:border-red-500 bg-red-50/30"
        : "border-zinc-200 focus:ring-violet-500/20 focus:border-violet-500"
    }`;

  return (
    <Modal
      title={isEditing ? "Editar tipo de fuente" : "Nuevo tipo de fuente"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-1.5">
            <label className={FORM_LABEL_CLASS}>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError("name");
              }}
              placeholder="Ej: Combustión Móvil"
              className={inputClass("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-500 font-medium">{errors.name}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className={FORM_LABEL_CLASS}>Código</label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                clearError("code");
              }}
              placeholder="Ej: MOVIL"
              maxLength={20}
              className={`${inputClass("code")} font-mono uppercase`}
            />
            {errors.code && (
              <p className="text-xs text-red-500 font-medium">{errors.code}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={FORM_LABEL_CLASS}>Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe el tipo de fuentes que agrupa este tipo..."
            rows={3}
            className={`${formInputClass("violet")} resize-none`}
          />
        </div>

        <div className="space-y-1.5">
          <label className={FORM_LABEL_CLASS}>Grupo de emisión</label>
          <select
            value={emissionGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className={formInputClass("violet")}
          >
            {emissionGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={FORM_LABEL_CLASS}>Ícono</label>
          <div className="grid grid-cols-8 gap-2 p-2 bg-zinc-50 rounded-lg border border-zinc-100">
            {SELECTABLE_CATEGORY_ICON_IDS.map((id) => {
              const IconComponent = CATEGORY_ICONS[id];
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setIcon(id)}
                  className={`p-2 flex items-center justify-center rounded-lg transition-all ${
                    icon === id
                      ? "bg-violet-100 text-violet-700 shadow-sm border border-violet-200"
                      : "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 border border-transparent"
                  }`}
                  title={id}
                >
                  <IconComponent size={18} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className={buttonClass({ variant: "ghost" })}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={buttonClass()}
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear tipo de fuente"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
