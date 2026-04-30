import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  /** Optional accessible label — defaults to a generic "Loading" announced by SR */
  label?: string;
  /** Full = page-height centered (h-48); inline = small spinner inside another container */
  variant?: 'full' | 'inline';
}

export function LoadingState({ label, variant = 'full' }: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center py-4 text-slate-500" role="status">
        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
        {label && <span className="sr-only">{label}</span>}
      </div>
    );
  }

  return (
    <div
      className="flex h-48 items-center justify-center gap-2 text-slate-500"
      role="status"
      aria-live="polite"
    >
      <Loader2 size={16} className="animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
