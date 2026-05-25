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
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--royal-line)] bg-[rgba(8,17,31,0.82)] px-6 py-5 backdrop-blur">
      <div>
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
