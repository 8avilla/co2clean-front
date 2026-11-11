"use client";

import { useState, useCallback } from "react";
import {
  ArrowLeft,
  Building,
  Calendar,
  Download,
  FileBarChart2,
  FlaskConical,
  LayoutList,
  Loader2,
  RefreshCw,
  TableProperties,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useAnalysisResults } from "./hooks/useAnalysisResults";
import { AnalysisV2EmissionsChart } from "./AnalysisV2EmissionsChart";
import { AnalysisV2BarChart } from "./AnalysisV2BarChart";
import { AnalysisV2GroupBreakdown } from "./AnalysisV2GroupBreakdown";
import { AnalysisV2TopEmitters } from "./AnalysisV2TopEmitters";
import { AnalysisV2Treemap } from "./AnalysisV2Treemap";
import { AnalysisV2WaterfallChart } from "./AnalysisV2WaterfallChart";
import { AnalysisRecordsTab } from "./AnalysisRecordsTab";
import { AnalysisFactorsTab } from "./AnalysisFactorsTab";
import { buttonClass } from "@/shared/components/Common/button-styles";

interface AnalysisV2ResultsPageProps {
  analysisId: string;
}

type Tab = "summary" | "results" | "records" | "factors";

const STATUS_LABELS: Record<string, string> = {
  NotStarted: "Sin iniciar",
  Processing: "En proceso",
  Successful: "Completado",
  Deleted: "Eliminado",
};

// ── Loading skeleton ───────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-3.5 w-36 bg-zinc-100 rounded" />
        <div className="h-8 w-52 bg-zinc-200 rounded-xl" />
        <div className="h-3.5 w-72 bg-zinc-100 rounded" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 h-24 bg-zinc-100 rounded-2xl" />
        <div className="h-24 bg-zinc-100 rounded-2xl" />
        <div className="h-24 bg-zinc-100 rounded-2xl" />
      </div>
      <div className="h-10 bg-zinc-100 rounded-xl w-80" />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="h-72 bg-zinc-100 rounded-2xl" />
        <div className="h-72 bg-zinc-100 rounded-2xl" />
      </div>
    </div>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  unit,
  sub,
  isText,
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  /** Text values (e.g. a group name) use a smaller size than numbers */
  isText?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-1.5">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <div className="flex items-baseline gap-2">
        <span
          className={`font-black text-zinc-900 ${isText ? "text-xl leading-8 truncate" : "text-3xl"}`}
          title={isText ? String(value) : undefined}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-zinc-500">{unit}</span>}
      </div>
      {sub && (
        <p className="text-xs text-zinc-500 line-clamp-2" title={sub}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export const AnalysisV2ResultsPage = ({
  analysisId,
}: AnalysisV2ResultsPageProps) => {
  const { summary, loading, error, refetch } = useAnalysisResults(analysisId);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as Tab | null) ?? "summary";
  const setActiveTab = useCallback(
    (tab: Tab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const [recordsDefaultUncovered, setRecordsDefaultUncovered] = useState(false);

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) return <LoadingSkeleton />;

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
          <TriangleAlert size={26} className="text-red-400" />
        </div>
        <div className="text-center space-y-1">
          <p className="font-bold text-zinc-700">Error al cargar el análisis</p>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
        <button onClick={refetch} className={buttonClass()}>
          <RefreshCw size={15} />
          Reintentar
        </button>
      </div>
    );
  }

  if (!summary) return null;

  const {
    analysis,
    companyName,
    totalTco2e,
    groups,
    recordCount,
    recordsWithFactors,
    records,
    allFactors,
    recordIdsWithFactors,
  } = summary;

  const coverageNum =
    recordCount > 0
      ? Math.round((recordsWithFactors / recordCount) * 100)
      : 100;
  const coverageColor =
    coverageNum === 100
      ? "text-emerald-600"
      : coverageNum >= 80
        ? "text-amber-600"
        : "text-red-600";

  const analysisStandard = analysis.standard ?? "GHG_Protocol";

  const allCategories = groups.flatMap((g) => g.categories);
  const topCategory =
    allCategories.length > 0
      ? allCategories.reduce((prev, current) =>
          prev.tco2e > current.tco2e ? prev : current,
        )
      : null;
  const topCategoryPercent =
    topCategory && totalTco2e > 0
      ? ((topCategory.tco2e / totalTco2e) * 100).toFixed(1)
      : "0";
  const averagePerRecord =
    recordCount > 0 ? (totalTco2e / recordCount).toFixed(2) : "0";

  const uncoveredCategories = groups.flatMap((g) =>
    g.categories
      .filter((c) => c.coveredRecordCount < c.recordCount)
      .map((c) => ({
        groupName: g.groupName,
        categoryName: c.categoryName,
        missing: c.recordCount - c.coveredRecordCount,
        total: c.recordCount,
      })),
  );

  const handleViewUncovered = () => {
    setRecordsDefaultUncovered(true);
    setActiveTab("records");
  };

  const tabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
    count?: number;
    warn?: boolean;
  }[] = [
    {
      id: "summary",
      label: "Resumen",
      icon: <FileBarChart2 size={14} />,
      warn: uncoveredCategories.length > 0,
    },
    {
      id: "results",
      label: "Resultados",
      icon: <LayoutList size={14} />,
    },
    {
      id: "records",
      label: "Actividades",
      icon: <TableProperties size={14} />,
      count: records.length,
    },
    {
      id: "factors",
      label: "Factores de emisión",
      icon: <FlaskConical size={14} />,
      count: allFactors.length,
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/huella-carbono/analisis"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <ArrowLeft size={14} />
            Volver a Análisis
          </Link>
          <h1 className="text-2xl font-black text-zinc-900">
            Resultados {analysis.year}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Building size={13} />
              {companyName}
            </span>
            <span className="flex items-center gap-1.5">
              <FileBarChart2 size={13} />
              {analysisStandard === "GHG_Protocol"
                ? "GHG Protocol"
                : "ISO 14064"}
            </span>
            {analysis.createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} />
                Creado{" "}
                {new Date(analysis.createdAt).toLocaleDateString("es-CO", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                analysis.status === "Successful"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : analysis.status === "Processing"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-zinc-100 text-zinc-500 border-zinc-200"
              }`}
            >
              {STATUS_LABELS[analysis.status] ?? analysis.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {analysis.reportUrl && analysis.status === "Successful" && (
            <a
              href={analysis.reportUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Descargar informe"
              className={buttonClass({ variant: "secondary" })}
            >
              <Download size={16} />
              Descargar informe
            </a>
          )}
          <button
            onClick={refetch}
            title="Recalcular resultados"
            aria-label="Recalcular resultados"
            className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 border border-zinc-200 rounded-xl transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* ── Processing banner ── */}
      {analysis.status === "Processing" && (
        <div className="bg-blue-600 text-white rounded-2xl px-5 py-4 flex items-center gap-4 shadow-md shadow-blue-500/20">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Loader2 size={20} className="animate-spin" />
          </div>
          <div>
            <p className="font-bold text-sm">Análisis en procesamiento</p>
            <p className="text-blue-100 text-xs mt-0.5">
              Los resultados mostrados son parciales. Se actualizarán
              automáticamente al recargar cuando finalice.
            </p>
          </div>
          <button
            onClick={refetch}
            className="ml-auto flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <RefreshCw size={13} />
            Recargar
          </button>
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total de emisiones"
          value={Math.round(totalTco2e).toLocaleString("es-CO")}
          unit="tCO₂e"
          sub={`Año ${analysis.year}`}
        />
        <KpiCard
          label="Mayor foco de emisión"
          value={topCategory?.categoryName ?? "N/A"}
          sub={topCategory ? `${topCategoryPercent}% del total` : undefined}
          isText
        />
        <KpiCard
          label="Promedio por registro"
          value={averagePerRecord}
          unit="tCO₂e / registro"
        />
        <KpiCard
          label="Registros procesados"
          value={recordCount.toLocaleString("es-CO")}
          sub={`${recordsWithFactors.toLocaleString("es-CO")} con factor asignado`}
        />
      </div>

      {/* ── Tab bar ── */}
      <div className="border-b border-zinc-200">
        <nav className="flex gap-1" aria-label="Secciones del análisis">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px
                ${
                  activeTab === tab.id
                    ? "border-teal-600 text-teal-700"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"
                }
              `}
            >
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? "bg-teal-100 text-teal-700"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {tab.count.toLocaleString("es-CO")}
                </span>
              )}
              {tab.warn && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Resumen ── */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Coverage alert */}
          {uncoveredCategories.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <TriangleAlert size={15} className="text-amber-500 shrink-0" />
                <p className="text-sm font-semibold text-amber-800">
                  {uncoveredCategories.length === 1
                    ? "1 tipo de fuente con cobertura incompleta"
                    : `${uncoveredCategories.length} tipos de fuente con cobertura incompleta`}{" "}
                  — algunos registros no tienen factor de emisión asignado
                </p>
              </div>
              <ul className="space-y-1 pl-5">
                {uncoveredCategories.map((c, i) => (
                  <li key={i} className="text-sm text-amber-800">
                    • <span className="font-semibold">{c.categoryName}</span> —{" "}
                    {c.missing} de {c.total} registros sin factor
                  </li>
                ))}
              </ul>
              <button
                onClick={handleViewUncovered}
                className="text-sm font-semibold text-amber-800 hover:text-amber-900 underline underline-offset-2"
              >
                Ver registros sin factor →
              </button>
            </div>
          )}

          {/* Top 3 emitters — full width */}
          <AnalysisV2TopEmitters groups={groups} totalTco2e={totalTco2e} />

          {/* Donut + Treemap */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <AnalysisV2EmissionsChart groups={groups} totalTco2e={totalTco2e} />
            <AnalysisV2Treemap groups={groups} totalTco2e={totalTco2e} />
          </div>

          {/* Bar chart — full width */}
          <AnalysisV2BarChart groups={groups} totalTco2e={totalTco2e} />

          {/* Waterfall — full width */}
          <AnalysisV2WaterfallChart groups={groups} totalTco2e={totalTco2e} />
        </div>
      )}

      {/* ── Tab: Resultados ── */}
      {activeTab === "results" && (
        <AnalysisV2GroupBreakdown
          groups={groups}
          totalTco2e={totalTco2e}
          onNavigateToUncovered={handleViewUncovered}
        />
      )}

      {/* ── Tab: Registros ── */}
      {activeTab === "records" && (
        <AnalysisRecordsTab
          records={records}
          recordIdsWithFactors={recordIdsWithFactors}
          defaultShowUncovered={recordsDefaultUncovered}
        />
      )}

      {/* ── Tab: Factores ── */}
      {activeTab === "factors" && <AnalysisFactorsTab factors={allFactors} />}
    </div>
  );
};
