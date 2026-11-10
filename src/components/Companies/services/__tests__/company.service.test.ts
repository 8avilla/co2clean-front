import { vi, describe, it, expect, beforeEach } from 'vitest';
import { apiFetch } from '@/shared/lib/api-client';
import { CarbonFootprintService } from '@/components/CarbonFootprint/services/carbonFootprint.service';
import { CarbonFootprintAnalysisService } from '@/components/CarbonFootprint/services/carbonFootprintAnalysis.service';
import { CompanyService } from '../company.service';
import type { CompanyFormData } from '../../types';

vi.mock('@/shared/lib/api-client', () => ({ apiFetch: vi.fn() }));
vi.mock('@/components/CarbonFootprint/services/carbonFootprint.service', () => ({
  CarbonFootprintService: { fetchAll: vi.fn() },
}));
vi.mock('@/components/CarbonFootprint/services/carbonFootprintAnalysis.service', () => ({
  CarbonFootprintAnalysisService: { getAll: vi.fn() },
}));

const mockApiFetch = vi.mocked(apiFetch);

describe('CompanyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getCompanyDeletionImpact debería contar sedes, registros y análisis', async () => {
    mockApiFetch.mockResolvedValue([{ id: 'h1' }, { id: 'h2' }]);
    vi.mocked(CarbonFootprintService.fetchAll).mockResolvedValue(
      Array(5).fill({}) as Awaited<ReturnType<typeof CarbonFootprintService.fetchAll>>,
    );
    vi.mocked(CarbonFootprintAnalysisService.getAll).mockResolvedValue(
      Array(3).fill({}) as Awaited<ReturnType<typeof CarbonFootprintAnalysisService.getAll>>,
    );

    const impact = await CompanyService.getCompanyDeletionImpact('c1');

    expect(impact).toEqual({ headquarters: 2, activityRecords: 5, analyses: 3 });
    expect(CarbonFootprintService.fetchAll).toHaveBeenCalledWith({ companyId: 'c1' });
  });

  it('getHeadquarters debería pedir hasta 1000 sedes', async () => {
    mockApiFetch.mockResolvedValue([]);
    await CompanyService.getHeadquarters();
    expect(mockApiFetch).toHaveBeenCalledWith('/api/headquarters', {
      params: { limit: 1000, companyId: undefined },
    });
  });

  it('createCompany debería guardar el NIT en formato canónico', async () => {
    mockApiFetch.mockResolvedValue({ id: 'c1' });
    await CompanyService.createCompany({
      name: 'EcoCore',
      nit: '900123456-7',
      email: 'a@b.co',
      departmentId: 'd',
      municipalityId: 'm',
      address: 'Calle 1 # 2-3',
    } as CompanyFormData);

    const body = mockApiFetch.mock.calls[0][1]?.body as { nit: string };
    expect(body.nit).toBe('900.123.456-7');
  });

  it('updateCompany no debería enviar NIT si no cambió', async () => {
    mockApiFetch.mockResolvedValue({ id: 'c1' });
    await CompanyService.updateCompany('c1', { name: 'Nuevo' });
    const body = mockApiFetch.mock.calls[0][1]?.body as { nit?: string };
    expect(body.nit).toBeUndefined();
  });
});
