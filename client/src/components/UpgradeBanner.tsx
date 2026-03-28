import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Sparkles } from 'lucide-react';

interface UpgradeBannerProps {
  message: string;
  dismissible?: boolean;
}

export default function UpgradeBanner({ message, dismissible = true }: UpgradeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-2xl border border-primary/30 dark:border-dark-primary/30 bg-primary/5 dark:bg-dark-primary/10 p-4 flex items-center gap-4">
      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/20 dark:bg-dark-primary/20 flex items-center justify-center">
        <Sparkles className="h-5 w-5 text-primary dark:text-dark-primary" />
      </div>
      <p className="flex-1 text-sm text-text-primary dark:text-dark-text">{message}</p>
      <div className="flex items-center gap-2 shrink-0">
        <Link
          to="/pricing"
          className="inline-flex items-center rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-colors active:scale-[0.98]"
        >
          Upgrade to Pro
        </Link>
        {dismissible && (
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-2 rounded-xl text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
