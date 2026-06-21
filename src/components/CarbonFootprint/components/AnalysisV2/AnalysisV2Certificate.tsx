'use client';

import { useRef } from 'react';
import { Award, Download, X } from 'lucide-react';

interface AnalysisV2CertificateProps {
  companyName: string;
  year: number;
  standard: string;
  totalTco2e: number;
  analysisDate: string;
  onClose: () => void;
}

export const AnalysisV2Certificate = ({
  companyName,
  year,
  standard,
  totalTco2e,
  analysisDate,
  onClose,
}: AnalysisV2CertificateProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const standardLabel = standard === 'GHG_Protocol' ? 'GHG Protocol' : 'ISO 14064';

  const formattedTotal = totalTco2e.toLocaleString('es-CO', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  const safeName = companyName.length > 32 ? `${companyName.slice(0, 31)}…` : companyName;

  const handleDownload = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 560;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 800, 560);
      ctx.drawImage(img, 0, 0, 800, 560);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `certificado-huella-carbono-${year}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-violet-600" />
            <span className="font-bold text-zinc-900 text-sm">Certificado de Huella de Carbono</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Certificate SVG */}
        <div className="p-5">
          <svg
            ref={svgRef}
            viewBox="0 0 800 560"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full rounded-2xl border border-zinc-200"
          >
            {/* Background */}
            <rect width="800" height="560" fill="white" />

            {/* Outer border */}
            <rect x="10" y="10" width="780" height="540" rx="18" fill="none" stroke="#7c3aed" strokeWidth="2.5" />
            <rect x="18" y="18" width="764" height="524" rx="14" fill="none" stroke="#ede9fe" strokeWidth="1.5" />

            {/* Corner dots */}
            <circle cx="38" cy="38" r="7" fill="#8b5cf6" opacity="0.35" />
            <circle cx="762" cy="38" r="7" fill="#8b5cf6" opacity="0.35" />
            <circle cx="38" cy="522" r="7" fill="#8b5cf6" opacity="0.35" />
            <circle cx="762" cy="522" r="7" fill="#8b5cf6" opacity="0.35" />

            {/* Header band */}
            <rect x="18" y="18" width="764" height="115" rx="14" fill="#7c3aed" />
            <rect x="18" y="105" width="764" height="28" rx="0" fill="#7c3aed" />

            {/* Brand */}
            <text
              x="400" y="62"
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="rgba(255,255,255,0.6)"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="5"
            >
              ECOCORE
            </text>

            {/* Title */}
            <text
              x="400" y="102"
              textAnchor="middle"
              fontSize="20"
              fontWeight="700"
              fill="white"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="1.5"
            >
              CERTIFICADO DE HUELLA DE CARBONO
            </text>

            {/* "Se certifica que" */}
            <text x="400" y="170" textAnchor="middle" fontSize="13" fill="#71717a" fontFamily="system-ui, sans-serif">
              Se certifica que la organización
            </text>

            {/* Company name */}
            <text
              x="400" y="210"
              textAnchor="middle"
              fontSize="26"
              fontWeight="800"
              fill="#18181b"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {safeName}
            </text>

            {/* Divider */}
            <line x1="180" y1="232" x2="620" y2="232" stroke="#e4e4e7" strokeWidth="1" />

            <text x="400" y="268" textAnchor="middle" fontSize="13" fill="#71717a" fontFamily="system-ui, sans-serif">
              ha cuantificado su huella de carbono corporativa para el año
            </text>

            {/* Year */}
            <text
              x="400" y="318"
              textAnchor="middle"
              fontSize="52"
              fontWeight="900"
              fill="#7c3aed"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {year}
            </text>

            <text x="400" y="354" textAnchor="middle" fontSize="13" fill="#71717a" fontFamily="system-ui, sans-serif">
              con un resultado total de
            </text>

            {/* Total value */}
            <text
              x="400" y="404"
              textAnchor="middle"
              fontSize="38"
              fontWeight="900"
              fill="#18181b"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              {formattedTotal} tCO₂e
            </text>

            {/* Methodology badge */}
            <rect x="282" y="424" width="236" height="36" rx="18" fill="#ede9fe" />
            <text
              x="400" y="447"
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#7c3aed"
              fontFamily="system-ui, sans-serif"
            >
              Metodología: {standardLabel}
            </text>

            {/* Footer divider */}
            <line x1="60" y1="490" x2="740" y2="490" stroke="#e4e4e7" strokeWidth="1" />

            <text x="400" y="514" textAnchor="middle" fontSize="10" fill="#a1a1aa" fontFamily="system-ui, sans-serif">
              Emitido el {analysisDate} · Generado por EcoCore Platform
            </text>
          </svg>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            <Download size={15} />
            Descargar PNG
          </button>
        </div>
      </div>
    </div>
  );
};
