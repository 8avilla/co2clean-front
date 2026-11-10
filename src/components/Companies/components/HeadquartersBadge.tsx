import { AlertTriangle } from 'lucide-react';

export const HeadquartersBadge = ({ count }: { count: number }) =>
  count === 0 ? (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"
      title="Sin sedes no se pueden registrar actividades"
    >
      <AlertTriangle size={11} />
      Sin sedes
    </span>
  ) : (
    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
      {count} {count === 1 ? 'sede' : 'sedes'}
    </span>
  );
