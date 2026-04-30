import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  Icon?: LucideIcon;
  title: string;
  description?: string;
  /** Optional call-to-action rendered below the description */
  cta?: React.ReactNode;
  /** Vertical padding — keep generous on full-screen empties, tighter when nested in a tab */
  size?: 'compact' | 'full';
}

export function EmptyState({ Icon, title, description, cta, size = 'full' }: EmptyStateProps) {
  const padding = size === 'compact' ? 'py-10' : 'py-20';
  return (
    <div className={`flex flex-col items-center justify-center text-center ${padding}`}>
      {Icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-600">
          <Icon size={32} />
        </div>
      )}
      <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
      {description && <p className="mb-6 max-w-xs text-sm text-slate-500">{description}</p>}
      {cta}
    </div>
  );
}
