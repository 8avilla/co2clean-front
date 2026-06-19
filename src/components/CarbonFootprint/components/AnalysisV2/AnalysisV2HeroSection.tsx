'use client';

import { useEffect, useState } from 'react';
import { ArrowDown, Award, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { useCountUp } from './hooks/useCountUp';
import { GroupedResult } from './hooks/useAnalysisResults';

interface AnalysisV2HeroSectionProps {
  companyName: string;
  year: number;
  standard: string;
  totalTco2e: number;
  groups: GroupedResult[];
  isPresentationMode: boolean;
  onPresentationMode: () => void;
  onCertificate: () => void;
  onExportPdf: () => void;
}

const GROUP_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];

export const AnalysisV2HeroSection = ({
  companyName,
  year,
  standard,
  totalTco2e,
  groups,
  isPresentationMode,
  onPresentationMode,
  onCertificate,
  onExportPdf,
}: AnalysisV2HeroSectionProps) => {
  const animated = useCountUp(totalTco2e, 2000, 300);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const standardLabel = standard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064';

  const formattedValue = animated.toLocaleString('es-CO', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  return (
    <div
      className="relative rounded-3xl overflow-hidden flex flex-col items-center justify-center text-center px-6 py-20 min-h-[500px]"
      style={{ background: 'linear-gradient(135deg, #09090b 0%, #18181b 55%, #1c1917 100%)' }}
    >
      {/* Ambient gradients */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 20%, #8b5cf6 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, #3b82f6 0%, transparent 55%)',
        }}
      />

      {/* Top action buttons */}
      <div className="absolute top-5 right-5 flex items-center gap-2 z-10">
        <button
          onClick={onExportPdf}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all backdrop-blur-sm"
        >
          <FileText size={13} />
          PDF
        </button>
        <button
          onClick={onCertificate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all backdrop-blur-sm"
        >
          <Award size={13} />
          Certificado
        </button>
        <button
          onClick={onPresentationMode}
          title={isPresentationMode ? 'Salir del modo presentación' : 'Modo presentación'}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all backdrop-blur-sm"
        >
          {isPresentationMode ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          {isPresentationMode ? 'Salir' : 'Presentar'}
        </button>
      </div>

      {/* Main content */}
      <div
        className={`relative z-10 transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
        }`}
      >
        {/* Company + year */}
        <p className="text-zinc-500 text-xs font-semibold tracking-[0.2em] uppercase mb-3">
          {companyName} · {year}
        </p>

        {/* Methodology badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 mb-10">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-violet-300 text-xs font-bold tracking-wider uppercase">
            {standardLabel}
          </span>
        </div>

        {/* Animated big number */}
        <div className="mb-4">
          <div className="text-[72px] sm:text-[96px] font-black text-white leading-none tabular-nums">
            {formattedValue}
          </div>
          <div className="text-zinc-400 text-lg font-bold mt-3 tracking-wide">
            tCO₂e
          </div>
          <div className="text-zinc-600 text-sm mt-1">
            toneladas de CO₂ equivalente · {year}
          </div>
        </div>

        {/* Group pills */}
        {groups.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-8">
            {groups.map((g, i) => {
              const color = GROUP_COLORS[i % GROUP_COLORS.length];
              return (
                <div
                  key={g.groupId}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-zinc-300 text-xs font-semibold">
                    {g.groupCode || g.groupName}
                  </span>
                  <span className="text-zinc-500 text-xs tabular-nums">
                    {g.tco2e.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-700">
        <span className="text-[10px] uppercase tracking-[0.15em]">Ver análisis</span>
        <ArrowDown size={13} className="animate-bounce" />
      </div>
    </div>
  );
};
