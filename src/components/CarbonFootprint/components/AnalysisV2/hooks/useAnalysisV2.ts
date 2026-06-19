'use client';

import { useState, useCallback } from 'react';
import { CarbonFootprintAnalysisService } from '../../../services/carbonFootprintAnalysis.service';
import { CarbonFootprintService } from '../../../services/carbonFootprint.service';
import {
  ApiCarbonFootprintAnalysis,
  CarbonFootprintAnalysisStandard,
} from '../../../types';

export function useAnalysisV2() {
  const [analyses, setAnalyses] = useState<ApiCarbonFootprintAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (companyId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await CarbonFootprintAnalysisService.getAll({ companyId });
      setAnalyses(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al cargar análisis';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Returns emission record count for a given year (used in wizard preview)
  const getRecordCount = useCallback(async (companyId: string, year: number): Promise<number> => {
    const records = await CarbonFootprintService.fetchAll({ companyId, year });
    return records.length;
  }, []);

  // Creates an analysis and immediately initializes it (Processing → backend job)
  const createAndInitialize = useCallback(
    async (
      companyId: string,
      year: number,
      standard: CarbonFootprintAnalysisStandard
    ): Promise<ApiCarbonFootprintAnalysis> => {
      const created = await CarbonFootprintAnalysisService.create({ companyId, year, standard });
      const initialized = await CarbonFootprintAnalysisService.initialize(created.id);
      setAnalyses(prev => [initialized, ...prev]);
      return initialized;
    },
    []
  );

  // Re-fetches a single analysis by id — used by polling loop for Processing analyses
  const refreshOne = useCallback(async (id: string): Promise<void> => {
    const updated = await CarbonFootprintAnalysisService.getById(id);
    setAnalyses(prev => prev.map(a => (a.id === id ? updated : a)));
  }, []);

  // Initializes an already-created analysis (e.g. from the card action)
  const initializeExisting = useCallback(async (id: string): Promise<void> => {
    const updated = await CarbonFootprintAnalysisService.initialize(id);
    setAnalyses(prev => prev.map(a => (a.id === id ? updated : a)));
  }, []);

  const remove = useCallback(async (id: string): Promise<void> => {
    await CarbonFootprintAnalysisService.delete(id);
    setAnalyses(prev => prev.map(a => (a.id === id ? { ...a, status: 'Deleted' as const } : a)));
  }, []);

  return {
    analyses,
    loading,
    error,
    load,
    getRecordCount,
    createAndInitialize,
    initializeExisting,
    refreshOne,
    remove,
  };
}
