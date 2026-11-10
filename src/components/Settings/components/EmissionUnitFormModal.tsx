"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  ApiEmissionUnit,
  ApiUnitType,
} from "@/shared/services/emission-source.service";

import {
  FORM_LABEL_CLASS,
  formInputClass,
} from "@/shared/components/Common/form-styles";
import { buttonClass } from "@/shared/components/Common/button-styles";
import { Modal } from "@/shared/components/Common/Modal";
interface EmissionUnitFormModalProps {
  unit: ApiEmissionUnit | undefined;
  unitTypes: ApiUnitType[];
  onSave: (
    data: Omit<ApiEmissionUnit, "id"> & { id?: string },
  ) => Promise<void>;
  onClose: () => void;
}

type FormErrors = Partial<Record<"name" | "symbol", string>>;

export const EmissionUnitFormModal = ({
  unit,
  unitTypes,
  onSave,
  onClose,
}: EmissionUnitFormModalProps) => {
  const isEditing = !!unit;

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [unitTypeId, setUnitTypeId] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setErrors({});
    if (unit) {
      setName(unit.name);
      setSymbol(unit.symbol);
      setUnitTypeId(unit.unitTypeId ?? "");
      setDescription(unit.description ?? "");
    } else {
      setName("");
      setSymbol("");
      setUnitTypeId("");
      setDescription("");
    }
  }, [unit]);

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!name.trim()) next.name = "El nombre es requerido.";
    if (!symbol.trim()) next.symbol = "El símbolo es requerido.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave({
        ...(unit?.id ? { id: unit.id } : {}),
        name: name.trim(),
        symbol: symbol.trim(),
        unitTypeId: unitTypeId || undefined,
        description: description.trim() || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={isEditing ? "Editar unidad de medida" : "Nueva unidad de medida"}
      onClose={onClose}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className={FORM_LABEL_CLASS}>
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((p) => {
                const n = { ...p };
                delete n.name;
                return n;
              });
            }}
            placeholder="Ej: Litros"
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${errors.name ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </div>

        <div className="space-y-1.5">
          <label className={FORM_LABEL_CLASS}>
            Símbolo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => {
              setSymbol(e.target.value);
              setErrors((p) => {
                const n = { ...p };
                delete n.symbol;
                return n;
              });
            }}
            placeholder="Ej: L"
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 ${errors.symbol ? "border-red-400 bg-red-50" : "border-zinc-200"}`}
          />
          {errors.symbol && (
            <p className="text-xs text-red-500">{errors.symbol}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className={FORM_LABEL_CLASS}>Tipo de unidad</label>
          <select
            value={unitTypeId}
            onChange={(e) => setUnitTypeId(e.target.value)}
            className={formInputClass("violet")}
          >
            <option value="">Sin tipo</option>
            {unitTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className={FORM_LABEL_CLASS}>Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ej: Unidad para combustibles líquidos"
            rows={3}
            className={`${formInputClass("violet")} resize-none`}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className={buttonClass()}
          >
            {isSaving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear unidad"}
          </button>
        </div>
      </form>
    </Modal>
  );
};
