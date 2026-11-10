import { CheckCircle2 } from 'lucide-react';

export const SectionStatus = ({ complete }: { complete: boolean }) =>
  complete
    ? <CheckCircle2 size={15} className="text-teal-500 flex-shrink-0" />
    : <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300 flex-shrink-0" />;
