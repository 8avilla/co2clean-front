import type { ReactNode } from 'react';

interface FormCardProps {
  title: string;
  icon?: ReactNode;
  /** Controls shown on the right side of the header */
  actions?: ReactNode;
  /** Override the body padding (e.g. "p-0" for edge-to-edge tables) */
  bodyClassName?: string;
  children: ReactNode;
}

// Compact card used to group related fields in a form
export const FormCard = ({ title, icon, actions, bodyClassName = 'p-5', children }: FormCardProps) => (
  <section className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
    <header className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-zinc-900 text-sm">{title}</h2>
      </div>
      {actions}
    </header>
    <div className={bodyClassName}>{children}</div>
  </section>
);
