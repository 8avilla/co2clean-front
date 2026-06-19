'use client';

import { useState, useEffect, useCallback } from 'react';
import { CarbonFootprintAnalysisService } from '../../../services/carbonFootprintAnalysis.service';
import { CarbonFootprintService } from '../../../services/carbonFootprint.service';
import { EmissionFactorsService } from '../../../services/catalogs.service';
import { ApiCarbonFootprint, ApiCarbonFootprintAnalysis, ApiEmissionFactor, FACTOR_MASS_UNIT_TO_KG, FactorMassUnit } from '../../../types';

export interface FactorResult {
  factorId: string;
  gasName: string;
  formula: string;
  gwp: number;
  factorValue: number;
  unitSymbol: string;
  gasTonnes: number;  // raw gas mass: quantity × factor / 1000
  tco2e: number;      // gasTonnes × gwp
  recordCount: number;
  percentage: number;
}

export interface CategoryResult {
  categoryId: string;
  categoryName: string;
  tco2e: number;
  percentage: number;
  recordCount: number;
  coveredRecordCount: number;
  factors: FactorResult[];
}

export interface GroupedResult {
  groupId: string;
  groupName: string;
  groupCode: string;
  tco2e: number;
  percentage: number;
  categories: CategoryResult[];
}

export interface AnalysisResultsSummary {
  analysis: ApiCarbonFootprintAnalysis;
  companyName: string;
  totalTco2e: number;
  groups: GroupedResult[];
  recordCount: number;
  recordsWithFactors: number;
  records: ApiCarbonFootprint[];
  allFactors: ApiEmissionFactor[];
  recordIdsWithFactors: Set<string>;
}

function getCompanyNameFromSession(): string {
  if (typeof window === 'undefined') return '';
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return '';
    const parsed = JSON.parse(stored) as { company?: { name: string } | null };
    return parsed.company?.name ?? '';
  } catch {
    return '';
  }
}

interface FactorAccum {
  gasName: string;
  formula: string;
  gwp: number;
  factorValue: number;
  unitSymbol: string;
  gasTonnes: number;
  tco2e: number;
  count: number;
}

interface CategoryAccum {
  name: string;
  tco2e: number;
  count: number;
  coveredCount: number;
  factors: Map<string, FactorAccum>;
}

interface GroupAccum {
  groupId: string;
  groupName: string;
  groupCode: string;
  tco2e: number;
  categories: Map<string, CategoryAccum>;
}

export function useAnalysisResults(analysisId: string) {
  const [summary, setSummary] = useState<AnalysisResultsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(async () => {
    if (!analysisId) return;
    setLoading(true);
    setError(null);

    try {
      const analysis = await CarbonFootprintAnalysisService.getById(analysisId);

      const records = await CarbonFootprintService.fetchAll({
        companyId: analysis.companyId,
        year: analysis.year,
      });

      if (records.length === 0) {
        setSummary({
          analysis,
          companyName: getCompanyNameFromSession(),
          totalTco2e: 0,
          groups: [],
          recordCount: 0,
          recordsWithFactors: 0,
          records: [],
          allFactors: [],
          recordIdsWithFactors: new Set(),
        });
        return;
      }

      // Collect unique subsource and category IDs
      const subsourceIds = [
        ...new Set(records.filter(r => r.emissionSubsourceId).map(r => r.emissionSubsourceId!)),
      ];
      const categoryIds = [
        ...new Set(records.filter(r => r.emissionSourceCategoryId).map(r => r.emissionSourceCategoryId!)),
      ];

      // Fetch factors by subsource (primary) and by category (supplement)
      // This handles data inconsistencies where factors may be stored under a different
      // subsource ID than the one referenced by the records (e.g. duplicate sources)
      const [subsourceResults, categoryResults] = await Promise.all([
        Promise.all(
          subsourceIds.map(async id => ({
            id,
            factors: await EmissionFactorsService.getAll({ emissionSourceId: id }),
          }))
        ),
        Promise.all(
          categoryIds.map(async id => ({
            id,
            factors: await EmissionFactorsService.getAll({ emissionSourceCategoryId: id }),
          }))
        ),
      ]);

      const categoryFactorMap = new Map<string, ApiEmissionFactor[]>();
      for (const { id, factors } of categoryResults) {
        categoryFactorMap.set(id, factors);
      }

      // Build subsource → factors map, supplementing with category factors not yet included
      const factorsBySubsource = new Map<string, ApiEmissionFactor[]>();
      for (const { id, factors } of subsourceResults) {
        factorsBySubsource.set(id, factors);
      }

      // For each record's subsource, merge in category factors for gases not yet represented.
      // This handles data inconsistencies where some gas factors (e.g. CH₄/N₂O) may have
      // been saved with a different emissionSourceId than what the records reference.
      // Dedup by factor ID and by gasId to avoid adding multiple factors per gas.
      const processedSubsources = new Set<string>();
      for (const record of records) {
        const subsourceId = record.emissionSubsourceId;
        const categoryId = record.emissionSourceCategoryId;
        if (!subsourceId || !categoryId || processedSubsources.has(subsourceId)) continue;
        processedSubsources.add(subsourceId);

        const existing = factorsBySubsource.get(subsourceId) ?? [];
        const catFactors = categoryFactorMap.get(categoryId) ?? [];
        if (catFactors.length === 0) continue;

        const seenIds = new Set(existing.map(f => f.id));
        const seenGasIds = new Set(existing.map(f => f.gasId));
        const supplemental: ApiEmissionFactor[] = [];
        for (const f of catFactors) {
          if (seenIds.has(f.id) || seenGasIds.has(f.gasId)) continue;
          supplemental.push(f);
          seenGasIds.add(f.gasId);
        }
        if (supplemental.length > 0) {
          factorsBySubsource.set(subsourceId, [...existing, ...supplemental]);
        }
      }

      const groupMap = new Map<string, GroupAccum>();
      const recordIdsWithFactors = new Set<string>();

      let totalTco2e = 0;
      let recordsWithFactors = 0;
      let processedRecords = 0;

      for (const record of records) {
        if (!record.quantity) continue;
        processedRecords++;

        const allSubsourceFactors = record.emissionSubsourceId
          ? (factorsBySubsource.get(record.emissionSubsourceId) ?? [])
          : [];

        // Match factors by unit symbol (robust against different DB IDs for the same unit)
        // Falls back to ID comparison, then to all factors if no unit info available
        const recordUnitSymbol = record.emissionUnit?.symbol;
        const factors = recordUnitSymbol
          ? allSubsourceFactors.filter(f =>
              f.emissionUnit?.symbol
                ? f.emissionUnit.symbol === recordUnitSymbol
                : f.emissionUnitId === record.emissionUnitId
            )
          : allSubsourceFactors;

        // Sum all matching gas contributions for this record
        let recordTco2e = 0;
        for (const f of factors) {
          // Convert factor to kg using factorMassUnit before computing tCO₂e
          const factorInKg = f.factor * (FACTOR_MASS_UNIT_TO_KG[(f.factorMassUnit ?? 'kg') as FactorMassUnit] ?? 1);
          // tco2e = quantity × factorInKg × gwp / 1000 (kg → tonnes)
          recordTco2e += (record.quantity * factorInKg * f.gwp) / 1000;
        }
        if (factors.length > 0) {
          recordsWithFactors++;
          recordIdsWithFactors.add(record.id);
        }
        totalTco2e += recordTco2e;

        const groupId = record.emissionGroupId ?? 'sin-grupo';
        const groupName = record.emissionGroup?.name ?? 'Sin grupo';
        const groupCode = record.emissionGroup?.code ?? '';
        const categoryId = record.emissionSourceCategoryId ?? 'sin-categoria';
        const categoryName = record.emissionSourceCategory?.name ?? 'Sin categoría';

        if (!groupMap.has(groupId)) {
          groupMap.set(groupId, {
            groupId,
            groupName,
            groupCode,
            tco2e: 0,
            categories: new Map(),
          });
        }

        const group = groupMap.get(groupId)!;
        group.tco2e += recordTco2e;

        if (!group.categories.has(categoryId)) {
          group.categories.set(categoryId, {
            name: categoryName,
            tco2e: 0,
            count: 0,
            coveredCount: 0,
            factors: new Map(),
          });
        }
        const cat = group.categories.get(categoryId)!;
        cat.tco2e += recordTco2e;
        cat.count++;
        if (factors.length > 0) cat.coveredCount++;

        // Accumulate per-factor within this category
        for (const f of factors) {
          const factorInKg = f.factor * (FACTOR_MASS_UNIT_TO_KG[(f.factorMassUnit ?? 'kg') as FactorMassUnit] ?? 1);
          const rawGas = (record.quantity * factorInKg) / 1000;
          const contribution = rawGas * f.gwp;
          if (!cat.factors.has(f.id)) {
            const displayFactor = f.factor * (FACTOR_MASS_UNIT_TO_KG[(f.factorMassUnit ?? 'kg') as FactorMassUnit] ?? 1);
            cat.factors.set(f.id, {
              gasName: f.gas?.chemicalName ?? 'Gas',
              formula: f.gas?.formula ?? '',
              gwp: f.gwp,
              factorValue: displayFactor,
              unitSymbol: f.emissionUnit?.symbol ?? '',
              gasTonnes: 0,
              tco2e: 0,
              count: 0,
            });
          }
          const fa = cat.factors.get(f.id)!;
          fa.gasTonnes += rawGas;
          fa.tco2e += contribution;
          fa.count++;
        }
      }

      const groups: GroupedResult[] = Array.from(groupMap.values())
        .sort((a, b) => b.tco2e - a.tco2e)
        .map(g => ({
          groupId: g.groupId,
          groupName: g.groupName,
          groupCode: g.groupCode,
          tco2e: g.tco2e,
          percentage: totalTco2e > 0 ? (g.tco2e / totalTco2e) * 100 : 0,
          categories: Array.from(g.categories.entries())
            .map(([categoryId, c]) => ({
              categoryId,
              categoryName: c.name,
              tco2e: c.tco2e,
              percentage: totalTco2e > 0 ? (c.tco2e / totalTco2e) * 100 : 0,
              recordCount: c.count,
              coveredRecordCount: c.coveredCount,
              factors: Array.from(c.factors.entries())
                .map(([factorId, fa]) => ({
                  factorId,
                  gasName: fa.gasName,
                  formula: fa.formula,
                  gwp: fa.gwp,
                  factorValue: fa.factorValue,
                  unitSymbol: fa.unitSymbol,
                  gasTonnes: fa.gasTonnes,
                  tco2e: fa.tco2e,
                  recordCount: fa.count,
                  percentage: c.tco2e > 0 ? (fa.tco2e / c.tco2e) * 100 : 0,
                }))
                .sort((a, b) => b.tco2e - a.tco2e),
            }))
            .sort((a, b) => b.tco2e - a.tco2e),
        }));

      // Collect all unique factors across all subsources for the factors tab
      const allFactors: ApiEmissionFactor[] = [];
      const seenFactorIds = new Set<string>();
      for (const factors of factorsBySubsource.values()) {
        for (const f of factors) {
          if (!seenFactorIds.has(f.id)) {
            seenFactorIds.add(f.id);
            allFactors.push(f);
          }
        }
      }

      setSummary({
        analysis,
        companyName: getCompanyNameFromSession(),
        totalTco2e,
        groups,
        recordCount: processedRecords,
        recordsWithFactors,
        records,
        allFactors,
        recordIdsWithFactors,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al calcular resultados');
    } finally {
      setLoading(false);
    }
  }, [analysisId]);

  useEffect(() => {
    compute();
  }, [compute]);

  return { summary, loading, error, refetch: compute };
}
