import { vi, describe, it, expect, beforeEach } from 'vitest';
import { EmissionFactorService, EmissionSourceService } from '../emission-source.service';
import { DeletionImpactService } from '../deletion-impact.service';

vi.mock('../emission-source.service', () => ({
  EmissionFactorService: { getFactors: vi.fn() },
  EmissionSourceService: { getSources: vi.fn(), getCommercialUnits: vi.fn() },
}));

const arrayOf = (length: number) => Array(length).fill({});

describe('DeletionImpactService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forGas debería contar los factores del gas', async () => {
    vi.mocked(EmissionFactorService.getFactors).mockResolvedValue(
      arrayOf(3) as Awaited<ReturnType<typeof EmissionFactorService.getFactors>>,
    );
    await expect(DeletionImpactService.forGas('g1')).resolves.toEqual({ factors: 3 });
    expect(EmissionFactorService.getFactors).toHaveBeenCalledWith({ gasId: 'g1' });
  });

  it('forEmissionCategory debería contar las fuentes del tipo', async () => {
    vi.mocked(EmissionSourceService.getSources).mockResolvedValue(
      arrayOf(5) as Awaited<ReturnType<typeof EmissionSourceService.getSources>>,
    );
    await expect(DeletionImpactService.forEmissionCategory('c1')).resolves.toEqual({ sources: 5 });
    expect(EmissionSourceService.getSources).toHaveBeenCalledWith({
      emissionSourceCategoryId: 'c1',
      limit: 1000,
    });
  });

  it('forEmissionSource debería contar factores y unidades comerciales', async () => {
    vi.mocked(EmissionFactorService.getFactors).mockResolvedValue(
      arrayOf(2) as Awaited<ReturnType<typeof EmissionFactorService.getFactors>>,
    );
    vi.mocked(EmissionSourceService.getCommercialUnits).mockResolvedValue(
      arrayOf(4) as Awaited<ReturnType<typeof EmissionSourceService.getCommercialUnits>>,
    );
    await expect(DeletionImpactService.forEmissionSource('s1')).resolves.toEqual({
      factors: 2,
      commercialUnits: 4,
    });
  });
});
