import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FileText, Download, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInvoices, downloadInvoicePdf } from '../services/invoices-service';
import { formatCurrency } from '../lib/format-currency';
import { getInitials } from '../lib/avatar';
import UpgradeBanner from '../components/UpgradeBanner';
import { usePlanCheck } from '../hooks/usePlanCheck';
import type { InvoiceListItem, InvoiceStatus } from 'shared';

function InvoicesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-border dark:bg-dark-border animate-shimmer" aria-hidden />
      ))}
    </div>
  );
}

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-text-secondary/20 text-text-secondary dark:bg-dark-muted/30 dark:text-dark-muted',
  SENT: 'bg-primary/20 text-primary dark:bg-dark-primary/30 dark:text-dark-primary',
  PAID: 'bg-success/20 text-success',
  OVERDUE: 'bg-danger/20 text-danger',
  CANCELLED: 'bg-text-secondary/20 text-text-secondary dark:bg-dark-muted/30 dark:text-dark-muted',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { canAddInvoice, canDownloadPDF, isExpired, isTrialExpired } = usePlanCheck();
  const { t } = useTranslation();

  const STATUS_FILTERS = [
    { value: 'all', labelKey: 'invoices.status_all' },
    { value: 'DRAFT', labelKey: 'invoices.status_draft' },
    { value: 'SENT', labelKey: 'invoices.status_sent' },
    { value: 'PAID', labelKey: 'invoices.status_paid' },
    { value: 'OVERDUE', labelKey: 'invoices.status_overdue' },
  ];

  useEffect(() => {
    let cancelled = false;
    getInvoices()
      .then((res) => {
        if (!cancelled) setInvoices(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load invoices.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = statusFilter === 'all' ? invoices : invoices.filter((inv) => inv.status === statusFilter);

  return (
    <div className="space-y-6 animate-fade-in">
      {(isExpired || isTrialExpired || !canAddInvoice) && (
        <UpgradeBanner
          message={isExpired || isTrialExpired ? 'Your trial has expired. Upgrade to Pro to create more invoices.' : 'You’ve reached the free trial limit of 5 invoices per month. Upgrade to Pro for unlimited invoices.'}
          dismissible={!!canAddInvoice}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-primary to-accent dark:from-dark-primary dark:to-accent bg-clip-text text-transparent">
            {t('invoices.title')}
          </h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
            {t('invoices.subtitle')}
          </p>
        </div>
        {canAddInvoice ? (
          <Link
            to="/invoices/new"
            className="inline-flex items-center justify-center rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 shadow-md active:scale-[0.98] transition"
          >
            {t('invoices.create')}
          </Link>
        ) : (
          <span className="inline-flex items-center justify-center rounded-xl bg-text-secondary/20 dark:bg-dark-muted/30 px-4 py-2 text-sm font-medium text-text-secondary dark:text-dark-muted cursor-not-allowed">
            {t('invoices.create')}
          </span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setStatusFilter(f.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              statusFilter === f.value
                ? 'bg-primary text-white dark:bg-dark-primary'
                : 'bg-card dark:bg-dark-card border border-border dark:border-dark-border text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm hover:shadow-md transition-shadow">
        {error && <p className="text-sm text-danger">{error}</p>}
        {loading && <InvoicesSkeleton />}
        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-text-secondary dark:text-dark-muted" />
            <h3 className="mt-3 text-sm font-medium text-text-primary dark:text-dark-text">{t('invoices.no_invoices')}</h3>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
              {statusFilter === 'all' ? t('invoices.no_invoices') : `${t('invoices.no_invoices')} ${statusFilter.toLowerCase()}`}
            </p>
            {statusFilter === 'all' && (
              <Link
                to="/invoices/new"
                className="mt-4 inline-flex rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                {t('invoices.create')}
              </Link>
            )}
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <ul className="divide-y divide-border dark:divide-dark-border">
            {filtered.map((inv) => (
              <li key={inv.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-4 rounded-xl py-2 px-3 -mx-3 hover:bg-background dark:hover:bg-dark-bg transition group">
                  <Link
                    to={`/invoices/${inv.id}`}
                    className="flex flex-wrap items-center gap-4 min-w-0 flex-1"
                  >
                    <div className="h-10 w-10 rounded-full bg-primary/20 dark:bg-dark-primary/30 flex items-center justify-center text-sm font-semibold text-primary dark:text-dark-primary shrink-0">
                      {getInitials(inv.client.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-medium text-primary dark:text-dark-primary">{inv.invoiceNumber}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${statusColors[inv.status as InvoiceStatus]}`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary dark:text-dark-muted mt-0.5">{inv.client.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-text-primary dark:text-dark-text">{formatCurrency(inv.total, inv.currency)}</div>
                      <div className={`text-xs mt-0.5 ${inv.status === 'OVERDUE' ? 'text-danger' : 'text-text-secondary dark:text-dark-muted'}`}>
                        Due {format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </Link>
                  {inv.status === 'DRAFT' && (
                    <Link
                      to={`/invoices/${inv.id}/edit`}
                      className="p-2 rounded-xl text-text-secondary dark:text-dark-muted hover:bg-primary/10 dark:hover:bg-dark-primary/20 hover:text-primary dark:hover:text-dark-primary transition-colors shrink-0"
                      title={t('invoices.edit')}
                    >
                      <Pencil className="h-5 w-5" />
                    </Link>
                  )}
                  {canDownloadPDF ? (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          await downloadInvoicePdf(inv.id, `invoice-${inv.invoiceNumber}.pdf`);
                          toast.success('Download started');
                        } catch {
                          toast.error('Failed to download PDF');
                        }
                      }}
                      className="p-2 rounded-xl text-text-secondary dark:text-dark-muted hover:bg-primary/10 dark:hover:bg-dark-primary/20 hover:text-primary dark:hover:text-dark-primary transition-colors shrink-0"
                      title={t('invoices.download')}
                    >
                      <Download className="h-5 w-5" />
                    </button>
                  ) : (
                    <span className="p-2 shrink-0 text-text-secondary/50 dark:text-dark-muted/50" title={t('common.upgrade_required')}>
                      <Download className="h-5 w-5" />
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
