import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePlanCheck } from '../hooks/usePlanCheck';

interface FeatureLockProps {
  feature: 'analytics' | 'pdf' | 'clients' | 'invoices';
  children: React.ReactNode;
}

const featureLabels: Record<string, string> = {
  analytics: 'Analytics',
  pdf: 'PDF download',
  clients: 'Add more clients',
  invoices: 'Unlimited invoices',
};

export default function FeatureLock({ feature, children }: FeatureLockProps) {
  const [showModal, setShowModal] = useState(false);
  const { canViewAnalytics, canDownloadPDF, canAddClient, canAddInvoice } = usePlanCheck();

  const allowed =
    feature === 'analytics' ? canViewAnalytics :
    feature === 'pdf' ? canDownloadPDF :
    feature === 'clients' ? canAddClient :
    canAddInvoice;

  if (allowed) return <>{children}</>;

  return (
    <>
      <div className="relative">
        <div className="pointer-events-none select-none opacity-60 blur-[1px]">
          {children}
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="absolute inset-0 flex items-center justify-center bg-background/80 dark:bg-dark-bg/80 rounded-2xl border border-border dark:border-dark-border"
        >
          <div className="text-center p-6">
            <div className="inline-flex h-14 w-14 rounded-full bg-primary/20 dark:bg-dark-primary/20 items-center justify-center mb-3">
              <Lock className="h-7 w-7 text-primary dark:text-dark-primary" />
            </div>
            <p className="text-sm font-medium text-text-primary dark:text-dark-text">
              {featureLabels[feature]} is a Pro feature
            </p>
            <p className="text-xs text-text-secondary dark:text-dark-muted mt-1">
              Upgrade to unlock
            </p>
            <Link
              to="/pricing"
              className="mt-4 inline-flex rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Upgrade to Pro
            </Link>
          </div>
        </button>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowModal(false)}>
          <div
            className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <Lock className="mx-auto h-12 w-12 text-primary dark:text-dark-primary mb-3" />
              <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text">
                Pro feature
              </h3>
              <p className="text-sm text-text-secondary dark:text-dark-muted mt-1">
                {featureLabels[feature]} is available on the Pro plan.
              </p>
              <Link
                to="/pricing"
                className="mt-4 inline-flex rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                View plans
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
