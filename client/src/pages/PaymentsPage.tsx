import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { CreditCard, DollarSign, Receipt, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPayments, deletePayment, type PaymentWithClient } from '../services/payments-service';
import { formatCurrency } from '../lib/format-currency';
import PaymentModal from '../components/PaymentModal';

function methodIcon(method: string) {
  switch (method) {
    case 'STRIPE':
      return <CreditCard className="h-5 w-5" />;
    case 'PAYPAL':
      return <span className="text-xs font-bold">PayPal</span>;
    case 'CASH':
      return <DollarSign className="h-5 w-5" />;
    default:
      return <Receipt className="h-5 w-5" />;
  }
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-border dark:bg-dark-border animate-shimmer" aria-hidden />
      ))}
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<PaymentWithClient | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    let cancelled = false;
    getPayments()
      .then((res) => {
        if (!cancelled) setPayments(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load payments.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalReceived = payments.reduce((s, p) => s + p.amount, 0);

  function handleEdit(p: PaymentWithClient) {
    setEditPayment(p);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deletePayment(id);
      setPayments((prev) => prev.filter((p) => p.id !== id));
      toast.success('Payment deleted');
    } catch {
      toast.error('Failed to delete payment');
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">Payments</h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
            Track money received from clients.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditPayment(null); setModalOpen(true); }}
          className="inline-flex items-center justify-center rounded-xl bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 shadow-md active:scale-[0.98] transition"
        >
          {t('payments.add')}
        </button>
      </div>

      {!loading && payments.length > 0 && (
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-secondary dark:text-dark-muted">{t('payments.total_received')}</p>
              <p className="text-2xl font-bold text-success">{formatCurrency(totalReceived, 'USD')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
        {error && <p className="text-sm text-danger">{error}</p>}
        {loading && <PaymentsSkeleton />}
        {!loading && !error && payments.length === 0 && (
          <div className="py-12 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-text-secondary dark:text-dark-muted" />
            <h3 className="mt-3 text-sm font-medium text-text-primary dark:text-dark-text">{t('payments.no_payments')}</h3>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
              {t('payments.no_payments_desc')}
            </p>
          </div>
        )}
        {!loading && !error && payments.length > 0 && (
          <ul className="divide-y divide-border dark:divide-dark-border">
            {payments.map((p) => (
              <li key={p.id} className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 dark:bg-dark-primary/30 text-primary dark:text-dark-primary shrink-0">
                  {methodIcon(p.method)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary dark:text-dark-text">{p.clientName}</p>
                  <p className="text-sm text-text-secondary dark:text-dark-muted">{p.method.replace('_', ' ')}</p>
                  {p.notes && <p className="text-sm text-text-secondary dark:text-dark-muted mt-0.5">{p.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="font-bold text-success text-lg">{formatCurrency(p.amount, p.currency)}</p>
                  <p className="text-sm text-text-secondary dark:text-dark-muted">
                    {format(new Date(p.date), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(p)}
                    className="p-2 rounded-lg text-text-secondary dark:text-dark-muted hover:bg-primary/10 hover:text-primary dark:hover:text-dark-primary transition-colors"
                    aria-label="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(p.id)}
                    className="p-2 rounded-lg text-text-secondary dark:text-dark-muted hover:bg-danger/10 hover:text-danger transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <PaymentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditPayment(null); }}
        onSaved={(saved) => {
          if (editPayment) {
            setPayments((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
          } else {
            setPayments((prev) => [saved, ...prev]);
          }
        }}
        editPayment={editPayment}
      />
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text mb-2">{t('payments.delete_confirm')}</h3>
            <p className="text-sm text-text-secondary dark:text-dark-muted mb-4">{t('payments.delete_warning')}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-xl border border-border dark:border-dark-border text-text-primary dark:text-dark-text font-medium hover:bg-background dark:hover:bg-dark-bg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 rounded-xl bg-danger text-white font-medium hover:opacity-90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
