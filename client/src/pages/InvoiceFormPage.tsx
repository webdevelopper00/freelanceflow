import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format, addDays } from 'date-fns';
import { PlusCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getClients } from '../services/clients-service';
import { getInvoice, createInvoice, updateInvoice, type CreateInvoicePayload, type InvoiceItemInput } from '../services/invoices-service';
import { formatCurrency } from '../lib/format-currency';
import type { Client, Currency } from 'shared';

const CURRENCIES: Currency[] = ['MAD', 'USD', 'EUR', 'GBP'];

interface InvoiceRow {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

function toDateInput(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export default function InvoiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== 'new');
  const { t } = useTranslation();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInvoice, setLoadingInvoice] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const [clientId, setClientId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [status, setStatus] = useState('DRAFT');
  const [issueDate, setIssueDate] = useState(toDateInput(new Date()));
  const [dueDate, setDueDate] = useState(toDateInput(addDays(new Date(), 30)));
  const [currency, setCurrency] = useState<Currency>('USD');
  const [notes, setNotes] = useState('');
  const [taxPercent, setTaxPercent] = useState(10);
  const [items, setItems] = useState<InvoiceRow[]>([
    { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    let cancelled = false;
    getClients()
      .then((res) => {
        if (!cancelled) setClients(res.data);
      })
      .catch(() => {
        if (!cancelled) toast.error(t('common.error'));
      })
      .finally(() => {
        if (!cancelled) setLoadingClients(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    getInvoice(id)
      .then((inv) => {
        if (cancelled) return;
        setClientId(inv.clientId);
        setInvoiceNumber(inv.invoiceNumber);
        setStatus(inv.status);
        setIssueDate(toDateInput(new Date(inv.issueDate)));
        setDueDate(toDateInput(new Date(inv.dueDate)));
        setCurrency(inv.currency as Currency);
        setNotes(inv.notes ?? '');
        if (inv.subtotal > 0 && inv.tax >= 0) {
          setTaxPercent(inv.subtotal > 0 ? Math.round((inv.tax / inv.subtotal) * 100) : 0);
        }
        setItems(
          inv.items?.length
            ? inv.items.map((i) => ({
                id: i.id,
                description: i.description,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
              }))
            : [{ id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]
        );
      })
      .catch(() => {
        if (!cancelled) toast.error(t('common.error'));
      })
      .finally(() => {
        if (!cancelled) setLoadingInvoice(false);
      });
    return () => { cancelled = true; };
  }, [isEdit, id]);

  const subtotal = items.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);
  const taxAmount = Math.round((subtotal * taxPercent) / 100);
  const total = subtotal + taxAmount;

  function addItem() {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0 }]);
  }

  function removeItem(rowId: string) {
    setItems((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== rowId) : prev));
  }

  function updateItem(rowId: string, field: keyof InvoiceRow, value: string | number) {
    setItems((prev) =>
      prev.map((r) =>
        r.id === rowId ? { ...r, [field]: value } : r
      )
    );
  }

  function validate(): boolean {
    if (!clientId) {
      toast.error(t('common.required'));
      return false;
    }
    const hasValidItem = items.some((r) => r.description.trim() && r.quantity > 0);
    if (!hasValidItem) {
      toast.error(t('common.required'));
      return false;
    }
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: CreateInvoicePayload = {
        clientId,
        issueDate: new Date(issueDate).toISOString(),
        dueDate: new Date(dueDate).toISOString(),
        currency,
        taxPercent,
        items: items
          .filter((r) => r.description.trim())
          .map((r): InvoiceItemInput => ({
            description: r.description.trim(),
            quantity: r.quantity,
            unitPrice: r.unitPrice,
          })),
      };
      if (notes.trim()) payload.notes = notes.trim();
      if (isEdit && id) {
        const updated = await updateInvoice(id, { ...payload, status });
        toast.success(t('common.success'));
        navigate(`/invoices/${updated.id}`);
      } else {
        const created = await createInvoice(payload);
        toast.success(t('common.success'));
        navigate(`/invoices/${created.id}`);
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err &&
        (err.response as { data?: { message?: string } })?.data?.message
          ? (err.response as { data: { message: string } }).data.message
          : t('common.failed');
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingInvoice && isEdit) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 rounded-xl bg-border dark:bg-dark-border animate-shimmer" />
        <div className="h-64 rounded-2xl bg-border dark:bg-dark-border animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">
          {isEdit ? t('invoices.edit_invoice') : t('invoices.new_invoice')}
        </h1>
        <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
          {isEdit ? t('invoices.edit_invoice') : t('invoices.create')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section A - Invoice Details */}
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
          <h2 className="text-lg font-medium text-text-primary dark:text-dark-text mb-4">{t('invoices.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('invoices.client')}</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                required
                className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2.5 focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              >
                <option value="">{t('invoices.client')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                ))}
              </select>
              {loadingClients && <p className="mt-1 text-xs text-text-secondary dark:text-dark-muted">{t('common.loading')}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('invoices.invoice_number')}</label>
              <input
                type="text"
                readOnly
                  value={isEdit ? invoiceNumber : t('invoices.invoice_number')}
                className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-secondary dark:text-dark-muted px-3 py-2.5 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('invoices.issue_date')}</label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
                className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2.5 focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('invoices.due_date')}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2.5 focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('invoices.currency')}</label>
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
        </div>

        {/* Section B - Items */}
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-text-primary dark:text-dark-text">{t('invoices.items')}</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-2 rounded-xl border border-primary dark:border-dark-primary text-primary dark:text-dark-primary px-3 py-2 text-sm font-medium hover:bg-primary/10 dark:hover:bg-dark-primary/20 transition-colors"
            >
              <PlusCircle className="h-4 w-4" /> {t('invoices.add_item')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border dark:border-dark-border">
                  <th className="text-left py-2 font-medium text-text-primary dark:text-dark-text">{t('invoices.description')}</th>
                  <th className="text-right py-2 font-medium text-text-primary dark:text-dark-text w-24">{t('invoices.quantity')}</th>
                  <th className="text-right py-2 font-medium text-text-primary dark:text-dark-text w-32">{t('invoices.unit_price')}</th>
                  <th className="text-right py-2 font-medium text-text-primary dark:text-dark-text w-32">{t('invoices.total')}</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-border dark:border-dark-border last:border-0">
                    <td className="py-2">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateItem(row.id, 'description', e.target.value)}
                        placeholder={t('invoices.description')}
                        className="w-full rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-bg px-2 py-1.5 text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={row.quantity || ''}
                        onChange={(e) => updateItem(row.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                        className="w-full rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-bg px-2 py-1.5 text-right text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={row.unitPrice ? row.unitPrice / 100 : ''}
                        onChange={(e) => updateItem(row.id, 'unitPrice', Math.round((parseFloat(e.target.value) || 0) * 100))}
                        className="w-full rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-bg px-2 py-1.5 text-right text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                      />
                    </td>
                    <td className="py-2 text-right text-text-primary dark:text-dark-text font-medium">
                      {formatCurrency(row.quantity * row.unitPrice, currency)}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => removeItem(row.id)}
                        className="p-1.5 rounded-lg text-text-secondary dark:text-dark-muted hover:bg-danger/10 hover:text-danger transition-colors"
                        aria-label={t('common.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section C - Totals */}
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
          <h2 className="text-lg font-medium text-text-primary dark:text-dark-text mb-4">{t('invoices.total')}</h2>
          <div className="max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary dark:text-dark-muted">{t('invoices.subtotal')}</span>
              <span className="text-text-primary dark:text-dark-text font-medium">{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm text-text-secondary dark:text-dark-muted">{t('invoices.tax')} (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-20 rounded-lg border border-border dark:border-dark-border bg-background dark:bg-dark-bg px-2 py-1.5 text-right text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              />
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border dark:border-dark-border">
              <span className="font-medium text-text-primary dark:text-dark-text">{t('invoices.total')}</span>
              <span className="font-bold text-text-primary dark:text-dark-text">{formatCurrency(total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Section D - Notes */}
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
          <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-2">
            {t('invoices.notes')} ({t('common.optional')})
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2.5 focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary resize-none"
            placeholder={t('invoices.notes')}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="py-2.5 px-4 rounded-xl border border-border dark:border-dark-border text-text-primary dark:text-dark-text font-medium hover:bg-background dark:hover:bg-dark-bg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 rounded-xl bg-primary dark:bg-dark-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-colors active:scale-[0.98]"
          >
            {saving ? t('common.saving') : isEdit ? t('invoices.edit_invoice') : t('invoices.create')}
          </button>
        </div>
      </form>
    </div>
  );
}
