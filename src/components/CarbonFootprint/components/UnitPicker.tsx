'use client';

import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { ApiEmissionUnit, ApiCommercialUnit } from '../types';

interface UnitPickerProps {
  value: string;
  onChange: (value: string) => void;
  commercialUnits: ApiCommercialUnit[];
  catalogUnits: ApiEmissionUnit[];
  disabled?: boolean;
  disabledPlaceholder?: string;
  emptyLabel?: string;
  accentColor?: 'teal' | 'violet';
}

const ACCENTS = {
  teal: {
    openBorder: 'border-teal-500 ring-2 ring-teal-500/20',
    badge: 'bg-teal-100 text-teal-700',
    check: 'text-teal-600',
    selected: 'bg-teal-50 text-teal-700',
    selectedBadge: 'bg-teal-100 text-teal-700',
    hover: 'hover:bg-zinc-50',
  },
  violet: {
    openBorder: 'border-violet-500 ring-2 ring-violet-500/20',
    badge: 'bg-violet-100 text-violet-700',
    check: 'text-violet-600',
    selected: 'bg-violet-50 text-violet-700',
    selectedBadge: 'bg-violet-100 text-violet-700',
    hover: 'hover:bg-zinc-50',
  },
};

export const UnitPicker = ({
  value,
  onChange,
  commercialUnits,
  catalogUnits,
  disabled = false,
  disabledPlaceholder = 'Seleccione una fuente primero',
  emptyLabel,
  accentColor = 'violet',
}: UnitPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ac = ACCENTS[accentColor];

  const selectedCommercial = commercialUnits.find(
    u => (u.emissionUnitId ?? u.displaySymbol) === value
  );
  const selectedCatalog = !selectedCommercial
    ? catalogUnits.find(u => u.id === value)
    : undefined;

  const displayName = selectedCommercial?.displayName ?? selectedCatalog?.name ?? null;
  const displaySymbol = selectedCommercial?.displaySymbol ?? selectedCatalog?.symbol ?? null;
  const hasOptions = commercialUnits.length > 0 || catalogUnits.length > 0;

  if (disabled) {
    return (
      <div className="w-full px-3 py-2 rounded-lg border border-zinc-100 text-sm text-zinc-400 bg-zinc-50 cursor-not-allowed">
        {disabledPlaceholder}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => hasOptions && setIsOpen(prev => !prev)}
        className={`w-full px-3 py-2 rounded-lg border text-sm text-left flex items-center justify-between gap-2 outline-none transition-all ${
          !hasOptions
            ? 'border-zinc-100 bg-zinc-50 text-zinc-400 cursor-not-allowed'
            : isOpen
            ? ac.openBorder
            : 'border-zinc-200 hover:border-zinc-300'
        }`}
      >
        {displayName ? (
          <span className="flex items-center gap-2 min-w-0">
            <span className="text-zinc-800 truncate">{displayName}</span>
            {displaySymbol && (
              <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${ac.badge}`}>
                {displaySymbol}
              </span>
            )}
          </span>
        ) : (
          <span className="text-zinc-400">
            {hasOptions ? 'Selecciona una unidad' : 'Sin unidades disponibles'}
          </span>
        )}
        {hasOptions && (
          <ChevronDown
            size={14}
            className={`text-zinc-400 flex-shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-[80] mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {emptyLabel !== undefined && (
                <button
                  type="button"
                  onClick={() => { onChange(''); setIsOpen(false); }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors border-b border-zinc-50 ${
                    !value ? ac.selected : 'text-zinc-500 hover:bg-zinc-50'
                  }`}
                >
                  <span className="w-3 flex-shrink-0">
                    {!value && <Check size={12} className={ac.check} />}
                  </span>
                  <span className="italic">{emptyLabel}</span>
                </button>
              )}

              {commercialUnits.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 sticky top-0">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Unidades comerciales
                    </span>
                  </div>
                  {commercialUnits.map(u => {
                    const unitVal = u.emissionUnitId ?? u.displaySymbol;
                    const isSel = unitVal === value;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { onChange(unitVal); setIsOpen(false); }}
                        className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-3 transition-colors ${
                          isSel ? ac.selected : `text-zinc-700 ${ac.hover}`
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="w-3 flex-shrink-0">
                            {isSel && <Check size={12} className={ac.check} />}
                          </span>
                          <span className="truncate">{u.displayName}</span>
                        </span>
                        <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                          isSel ? ac.selectedBadge : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {u.displaySymbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {catalogUnits.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 bg-zinc-50 border-b border-zinc-100 sticky top-0">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      Unidades estándar
                    </span>
                  </div>
                  {catalogUnits.map(u => {
                    const isSel = u.id === value;
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { onChange(u.id); setIsOpen(false); }}
                        className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between gap-3 transition-colors ${
                          isSel ? ac.selected : `text-zinc-700 ${ac.hover}`
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className="w-3 flex-shrink-0">
                            {isSel && <Check size={12} className={ac.check} />}
                          </span>
                          <span className="truncate">{u.name}</span>
                        </span>
                        <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                          isSel ? ac.selectedBadge : 'bg-zinc-100 text-zinc-500'
                        }`}>
                          {u.symbol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
