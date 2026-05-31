'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '@/shared/components/Layout/MainLayout';
import { CarbonFootprintResultChart } from '@/components/CarbonFootprint/components/CarbonFootprintResultChart';
import { CarbonFootprintCategorySection } from '@/components/CarbonFootprint/components/CarbonFootprintCategorySection';
import { CarbonFootprintService } from '@/components/CarbonFootprint/services/carbonFootprint.service';
import { CarbonFootprintAnalysisService } from '@/components/CarbonFootprint/services/carbonFootprintAnalysis.service';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { usePermission } from '@/shared/hooks/usePermission';
import { PermissionCode } from '@/shared/constants/permissions';
import { CompanyService } from '@/components/Companies/services/company.service';

interface ResultData {
  id: string;
  empresaNombre: string;
  sedeNombre: string;
  anio: string;
}

function getActiveCompanyFromSession(): { id: string; name: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    const parsed = JSON.parse(stored) as {
      company?: { id: string; name: string } | null;
    };
    return parsed.company ?? null;
  } catch {
    return null;
  }
}

export default function CarbonFootprintResultPage() {
  const { id } = useParams();
  const router = useRouter();
  const { hasPermission, isInitialized } = usePermission();
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitialized && !hasPermission(PermissionCode.VIEW_CARBON_FOOTPRINT_ANALYSIS)) {
      toast.error('Acceso denegado', {
        description: 'No tienes permisos para acceder a esta sección.',
      });
      router.replace('/');
    }
  }, [isInitialized, hasPermission, router]);

  const fetchData = useCallback(async () => {
    const activeCompany = getActiveCompanyFromSession();
    if (!activeCompany) {
      toast.error('No hay empresa activa en la sesión');
      router.push('/huella-carbono/analisis');
      return;
    }

    try {
      const analysis = await CarbonFootprintAnalysisService.getById(id as string);
      const [records, headquarters] = await Promise.all([
        CarbonFootprintService.getCarbonFootprints({ empresaId: activeCompany.id, anio: analysis.anio }),
        CompanyService.getHeadquarters(activeCompany.id),
      ]);

      if (records.length === 0) {
        toast.error('No se encontraron registros de emisiones para este análisis');
        router.push('/huella-carbono/analisis');
        return;
      }

      const firstRecord = records[0];
      const sede = headquarters.find((h) => h.id === firstRecord.sedeId);
      setData({
        id: id as string,
        empresaNombre: activeCompany.name,
        sedeNombre: sede?.name ?? firstRecord.sedeId,
        anio: String(analysis.anio),
      });
    } catch {
      toast.error('Error al cargar los resultados');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!data) return null;

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 text-zinc-400 hover:text-zinc-900 rounded-full hover:bg-zinc-100 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Resultados del Análisis</h1>
              <p className="text-sm text-zinc-500">ID del Registro: {data.id}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors shadow-sm shadow-teal-500/20">
              <Download size={16} /> Descargar informe final
            </button>
          </div>
        </div>

        {/* Global summary */}
        <CarbonFootprintResultChart
          companyName={data.empresaNombre}
          year={data.anio}
        />

        {/* Categorical Breakdown */}
        <div className="bg-white p-8 rounded-2xl border border-zinc-100 shadow-sm space-y-12">
          <div className="border-b border-zinc-100 pb-4">
            <h2 className="text-lg font-black text-zinc-900 uppercase">
              Análisis Desglosado por Categorías
            </h2>
            <p className="text-sm text-zinc-500 italic">
              Desglose técnico de emisiones directas e indirectas según el inventario de GEI.
            </p>
          </div>

          <CarbonFootprintCategorySection
            categoryNumber={1}
            categoryTitle="Emisiones directas de GEI"
            description={`El total las emisiones directas de GEI es de 73.155,00 tCO2e generadas por combustión móvil y combustión estacionaria y recarga de extintores, los cuales representan el 99,12% del total de emisiones del inventario de GEI.`}
            chartData={[
              { name: 'Combustión móvil', value: 73147.0 },
              { name: 'Combustión estacionaria', value: 7.08 },
              { name: 'Recarga de extintores', value: 0.01 },
            ]}
            tableData={[
              { name: 'ENERGÍA', isGroup: true, co2: '', ch4: '', n2o: '', total: '', percentage: '' },
              { name: 'Combustión móvil', co2: '73.059,32', co2b: '8.117,70', ch4: '0,292', n2o: '0,2923', total: '73.147,00', percentage: '99,99' },
              { name: 'Combustión estacionaria', co2: '7,08', co2b: '0,79', ch4: '0,000025', n2o: '0,000005', total: '7,08', percentage: '0,01' },
              { name: 'Recarga de extintores', co2: '0,01', ch4: '-', n2o: '-', total: '0,01', percentage: '0,00002' },
            ]}
            totalValue="73.154,09"
            totalPercentage="100,00"
          />

          <CarbonFootprintCategorySection
            categoryNumber={2}
            categoryTitle="Emisiones indirectas de GEI por energía importada"
            description={`En total las emisiones indirectas de GEI por energía importada es de 315,46 tCO2e generadas por el consumo de energía del sistema interconectado nacional, el cual representa el 0,43% del total de emisiones del inventario de GEI.`}
            chartData={[{ name: 'Industrias de la energía', value: 315.46 }]}
            tableData={[
              { name: 'ENERGÍA', isGroup: true, co2: '', ch4: '', n2o: '', total: '', percentage: '' },
              { name: 'Industrias de la energía', co2: '315,46', ch4: '-', n2o: '-', total: '315,46', percentage: '100,00' },
            ]}
            totalValue="315,46"
            totalPercentage="100,00"
          />

          <CarbonFootprintCategorySection
            categoryNumber={4}
            categoryTitle="Emisiones indirectas por productos utilizados por la organización"
            description={`El total de tCO2e generadas en la categoría de emisiones indirectas por productos utilizados por la organización fue 334,71 tCO2e, que representan el 0,45% del total del inventario de GEI.`}
            chartData={[
              { name: 'Industria de la pulpa y el papel', value: 5.31 },
              { name: 'Sitios de eliminación de desechos', value: 180.83 },
              { name: 'Tratamiento de aguas residuales', value: 148.56 },
            ]}
            tableData={[
              { name: 'PROCESOS INDUSTRIALES', isGroup: true, co2: '', ch4: '', n2o: '', total: '', percentage: '' },
              { name: 'Industria de la pulpa y el papel', co2: '5,31', ch4: '-', n2o: '-', total: '5,31', percentage: '1,59' },
              { name: 'DESECHOS', isGroup: true, co2: '', ch4: '', n2o: '', total: '', percentage: '' },
              { name: 'Sitios de eliminación de desechos', co2: '-', ch4: '6,70', n2o: '-', total: '180,83', percentage: '54,03' },
              { name: 'Tratamiento de aguas residuales', co2: '-', ch4: '4,45', n2o: '0,10', total: '148,56', percentage: '44,39' },
            ]}
            totalValue="334,71"
            totalPercentage="100,00"
          />
        </div>

        {/* Summary Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Total Emisiones
              </p>
              <p className="text-xl font-black text-zinc-900">
                73,807.25 <span className="text-xs font-normal text-zinc-500">tCO2e</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Mayor Fuente
              </p>
              <p className="text-lg font-black text-zinc-900">Combustión Móvil</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Sede Analizada
              </p>
              <p className="text-lg font-black text-zinc-900">{data.sedeNombre}</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
