import { EmissionFactorService, EmissionSourceService } from './emission-source.service';

export interface GasDeletionImpact {
  factors: number;
}

export interface EmissionCategoryDeletionImpact {
  sources: number;
}

export interface EmissionSourceDeletionImpact {
  factors: number;
  commercialUnits: number;
}

/** Counts the catalog data that depends on an item, to warn before deleting it. */
export class DeletionImpactService {
  static async forGas(gasId: string): Promise<GasDeletionImpact> {
    const factors = await EmissionFactorService.getFactors({ gasId });
    return { factors: factors.length };
  }

  static async forEmissionCategory(categoryId: string): Promise<EmissionCategoryDeletionImpact> {
    const sources = await EmissionSourceService.getSources({
      emissionSourceCategoryId: categoryId,
      limit: 1000,
    });
    return { sources: sources.length };
  }

  static async forEmissionSource(sourceId: string): Promise<EmissionSourceDeletionImpact> {
    const [factors, commercialUnits] = await Promise.all([
      EmissionFactorService.getFactors({ emissionSourceId: sourceId }),
      EmissionSourceService.getCommercialUnits(sourceId),
    ]);
    return { factors: factors.length, commercialUnits: commercialUnits.length };
  }
}
