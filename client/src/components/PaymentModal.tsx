import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, DollarSign, Calendar, CreditCard, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { getClients } from '../services/clients-service';
import { createPayment, updatePayment, type CreatePaymentPayload, type PaymentWithClient } from '../services/payments-service';
import type { Client, Currency, PaymentMethod } from 'shared';

const CURRENCIES: Currency[] = ['MAD', 'USD', 'EUR', 'GBP'];
const METHODS: PaymentMethod[] = ['BANK_TRANSFER', 'CASH', 'PAYPAL', 'STRIPE', 'OTHER'];

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (payment: PaymentWithClient) => void;
  editPayment?: PaymentWithClient | null;
}

export default function PaymentModal({ open, onClose, onSaved, editPayment }: PaymentModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientId, setClientId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [method, setMethod] = useState<PaymentMethod>('BANK_TRANSFER');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
    getClients()
      .then((res) => setClients(res.data))
      .catch(() => toast.error('Failed to load clients'))
      .finally(() => setLoadingClients(false));
  }, [open]);

  useEffect(() => {
    if (editPayment) {
      setClientId(editPayment.clientId);
      setAmount(String(editPayment.amount / 100));
      setCurrency(editPayment.currency);
      setDate(format(new Date(editPayment.date), 'yyyy-MM-dd'));
      setMethod(editPayment.method);
      setNotes(editPayment.notes ?? '');
    } else {
      resetForm();
    }
  }, [editPayment, open]);

  function resetForm() {
    setClientId('');
    setAmount('');
    setCurrency('USD');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setMethod('BANK_TRANSFER');
    setNotes('');
    setErrors({});
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!clientId) next.clientId = 'Client is required';
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) next.amount = 'Valid amount is required';
    if (!date) next.date = 'Date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: CreatePaymentPayload = {
        clientId,
        amount: Math.round(parseFloat(amount) * 100),
        currency,
        date: new Date(date).toISOString(),
        method,
        notes: notes.trim() || null,
      };
      let saved: PaymentWithClient;
      if (editPayment) {
        saved = await updatePayment(editPayment.id, payload);
        toast.success('Payment updated');
      } else {
        saved = await createPayment(payload);
        toast.success('Payment added');
      }
      onSaved(saved);
      resetAndClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err &&
        (err.response as { data?: { message?: string } })?.data?.message
          ? (err.response as { data: { message: string } }).data.message
          : 'Failed to save payment';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function resetAndClose() {
    resetForm();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" aria-hidden onClick={resetAndClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card shadow-xl animate-fade-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text">
            {editPayment ? t('payments.edit') : t('payments.add')}
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="p-2 rounded-xl text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
              Client <span className="text-danger">*</span>
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2.5 focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
            >
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
            {loadingClients && <p className="mt-1 text-xs text-text-secondary dark:text-dark-muted">Loading clients…</p>}
            {errors.clientId && <p className="mt-1 text-sm text-danger">{errors.clientId}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
                Amount <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                  <DollarSign className="h-5 w-5" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                  placeholder="0.00"
                />
              </div>
              {errors.amount && <p className="mt-1 text-sm text-danger">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2.5 focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
                Date <span className="text-danger">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                  <Calendar className="h-5 w-5" />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                />
              </div>
              {errors.date && <p className="mt-1 text-sm text-danger">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">Method</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                  <CreditCard className="h-5 w-5" />
                </div>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                >
                  {METHODS.map((m) => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">Notes</label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none text-text-secondary dark:text-dark-muted">
                <FileText className="h-5 w-5" />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary resize-none"
                placeholder="Additional notes"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="flex-1 py-2.5 rounded-xl border border-border dark:border-dark-border text-text-primary dark:text-dark-text font-medium hover:bg-background dark:hover:bg-dark-bg transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-success text-white font-medium hover:opacity-90 disabled:opacity-50 transition-colors active:scale-[0.98]"
            >
              {saving ? t('common.saving') : editPayment ? t('common.update') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
