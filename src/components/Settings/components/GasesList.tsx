'use client';

import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';
import { Gas } from '../types';
import { GASES_MOCK } from '../data/gases.mock';
import { GasFormModal } from './GasFormModal';

export const GasesList = () => {
  const [gases, setGases] = useState<Gas[]>(GASES_MOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGas, setEditingGas] = useState<Gas | undefined>(undefined);

  const filteredGases = gases.filter(g =>
    g.chemical_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.formula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingGas(undefined);
    setModalOpen(true);
  };

  const handleOpenEdit = (gas: Gas) => {
    setEditingGas(gas);
    setModalOpen(true);
  };

  const handleSave = (data: Omit<Gas, 'id'> & { id?: string }) => {
    if (data.id) {
      setGases(prev => prev.map(g => (g.id === data.id ? (data as Gas) : g)));
      toast.success('Gas actualizado exitosamente');
    } else {
      const newGas: Gas = { ...data, id: `gas_${Date.now()}` };
      setGases(prev => [...prev, newGas]);
      toast.success('Gas creado exitosamente');
    }
    setModalOpen(false);
  };

  const handleDelete = (gas: Gas) => {
    if (!confirm(`¿Estás seguro de eliminar el gas "${gas.chemical_name}"?`)) return;
    setGases(prev => prev.filter(g => g.id !== gas.id));
    toast.success('Gas eliminado exitosamente');
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Gases de Efecto Invernadero</h1>
            <p className="text-sm text-zinc-500">
              Gestiona los gases y sus valores de Potencial de Calentamiento Global (GWP).
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium transition-all shadow-sm active:scale-95"
          >
            <Plus size={18} />
            Nuevo Gas
          </button>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o fórmula..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          {/* Mobile card view */}
          <div className="md:hidden divide-y divide-zinc-100">
            {filteredGases.length > 0 ? (
              filteredGases.map(gas => (
                <div key={gas.id} className="p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold flex-shrink-0 border border-violet-100">
                      <FlaskConical size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-sm">{gas.chemical_name}</p>
                      <p className="text-xs font-mono text-zinc-500">{gas.formula}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {gas.gwp_versions.map(gv => (
                          <span key={gv.version} className="text-xs text-zinc-500 font-medium">
                            {gv.version}: <span className="font-bold text-zinc-700">{gv.value.toLocaleString()}</span>
                          </span>
                        ))}
                        {gas.biogenic_calculation && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Biogénico</span>
                        )}
                        {gas.non_biogenic_calculation && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">No biogénico</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEdit(gas)}
                      className="p-2 text-zinc-400 hover:text-violet-600 rounded-lg transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(gas)}
                      className="p-2 text-zinc-400 hover:text-red-600 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-6 py-12 text-center text-zinc-500 text-sm">No se encontraron gases.</p>
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Gas</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Fórmula</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Cálculo</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredGases.length > 0 ? (
                  filteredGases.map(gas => (
                    <tr key={gas.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                            <FlaskConical size={16} />
                          </div>
                          <span className="font-bold text-zinc-900">{gas.chemical_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-semibold text-zinc-700 bg-zinc-100 px-2 py-0.5 rounded-md">
                          {gas.formula}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {gas.biogenic_calculation && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Biogénico
                            </span>
                          )}
                          {gas.non_biogenic_calculation && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200">
                              No biogénico
                            </span>
                          )}
                          {!gas.biogenic_calculation && !gas.non_biogenic_calculation && (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(gas)}
                            className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(gas)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-zinc-200"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron gases.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <GasFormModal
          gas={editingGas}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};
