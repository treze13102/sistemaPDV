import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--royal-line)] bg-[rgba(8,17,31,0.82)] px-4 py-4 backdrop-blur sm:gap-4 sm:px-6 sm:py-5">
      <div>
        <h1 className="text-xl font-semibold text-primary sm:text-2xl">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
