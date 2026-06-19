import { apiFetch } from '@/shared/lib/api-client';
import { Gas } from '@/components/Settings/types';

export interface ApiGreenhouseGas {
  id: string;
  code: string;
  chemicalName: string;
  formula: string;
  gwp: number;
  calculationType: 'Biogenic' | 'NonBiogenic' | 'Both';
  description?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Typed body for create/update requests — avoids Record<string, any> (B3)
interface CreateGasBody {
  code: string;
  chemicalName: string;
  formula: string;
  gwp: number;
  calculationType: ApiGreenhouseGas['calculationType'];
  description?: string;
  isActive: boolean;
}

interface UpdateGasBody {
  chemicalName?: string;
  formula?: string;
  code?: string;
  gwp?: number;
  calculationType?: ApiGreenhouseGas['calculationType'];
  description?: string;
  isActive?: boolean;
}

export class GasService {
  static mapToFront(backend: ApiGreenhouseGas): Gas {
    return {
      id: backend.id,
      chemical_name: backend.chemicalName,
      formula: backend.formula,
      gwp: backend.gwp,
      calculation_type: this.mapCalculationTypeToFront(backend.calculationType),
      is_active: backend.isActive,
      description: backend.description || undefined,
    };
  }

  private static mapCalculationTypeToFront(type: ApiGreenhouseGas['calculationType']): Gas['calculation_type'] {
    switch (type) {
      case 'Biogenic':    return 'biogenic';
      case 'NonBiogenic': return 'non_biogenic';
      case 'Both':
      default:            return 'both';
    }
  }

  private static mapCalculationTypeToBack(type: Gas['calculation_type']): ApiGreenhouseGas['calculationType'] {
    switch (type) {
      case 'biogenic':     return 'Biogenic';
      case 'non_biogenic': return 'NonBiogenic';
      case 'both':
      default:             return 'Both';
    }
  }

  private static formulaToCode(formula: string): string {
    const subscriptMap: Record<string, string> = {
      '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
      '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
      '-': '',
    };
    let normalized = formula.toLowerCase();
    for (const [sub, reg] of Object.entries(subscriptMap)) {
      normalized = normalized.replaceAll(sub, reg);
    }
    const cleanStr = normalized.replace(/[^a-z0-9]/g, '');
    return `gas_${cleanStr || Math.random().toString(36).substring(2, 7)}`;
  }

  static async getGases(search?: string, calculationType?: Gas['calculation_type']): Promise<Gas[]> {
    const params: Record<string, string | number> = { limit: 1000 };
    if (search) params.search = search;
    if (calculationType && calculationType !== 'both') {
      params.calculationType = this.mapCalculationTypeToBack(calculationType);
    }
    const res = await apiFetch<ApiGreenhouseGas[]>('/api/gases', { params });
    return (res ?? []).map(g => this.mapToFront(g));
  }

  static async getGasById(id: string): Promise<Gas | null> {
    const res = await apiFetch<ApiGreenhouseGas>(`/api/gases/${id}`);
    return res ? this.mapToFront(res) : null;
  }

  // B1 FIX: isActive is now included in the create body
  static async createGas(data: Omit<Gas, 'id'> & { id?: string }): Promise<Gas> {
    const body: CreateGasBody = {
      code: this.formulaToCode(data.formula),
      chemicalName: data.chemical_name,
      formula: data.formula,
      gwp: data.gwp,
      calculationType: this.mapCalculationTypeToBack(data.calculation_type),
      isActive: data.is_active,
      ...(data.description ? { description: data.description } : {}),
    };
    const res = await apiFetch<ApiGreenhouseGas>('/api/gases', { method: 'POST', body });
    return this.mapToFront(res);
  }

  // B2 FIX: isActive is now included when provided in the update payload
  static async updateGas(id: string, data: Partial<Gas>): Promise<Gas> {
    const body: UpdateGasBody = {};
    if (data.chemical_name !== undefined) body.chemicalName = data.chemical_name;
    if (data.formula !== undefined) {
      body.formula = data.formula;
      body.code = this.formulaToCode(data.formula);
    }
    if (data.gwp !== undefined) body.gwp = data.gwp;
    if (data.calculation_type !== undefined) {
      body.calculationType = this.mapCalculationTypeToBack(data.calculation_type);
    }
    if (data.description !== undefined) body.description = data.description || undefined;
    if (data.is_active !== undefined) body.isActive = data.is_active; // B2 FIX

    const res = await apiFetch<ApiGreenhouseGas>(`/api/gases/${id}`, { method: 'PUT', body });
    return this.mapToFront(res);
  }

  static async deleteGas(id: string): Promise<void> {
    await apiFetch<void>(`/api/gases/${id}`, { method: 'DELETE' });
  }
}
