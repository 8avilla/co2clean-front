import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  /** Optional icon shown before the title */
  icon?: ReactNode;
  description?: ReactNode;
  /** Buttons or links rendered on the right side (stack below on mobile) */
  actions?: ReactNode;
}

export const PageHeader = ({ title, icon, description, actions }: PageHeaderProps) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
    <div>
      {icon ? (
        <div className="flex items-center gap-2">
          {icon}
          <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        </div>
      ) : (
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
      )}
      {description && <p className="text-sm text-zinc-500">{description}</p>}
    </div>
    {actions}
  </div>
);
