import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { getInvoice, downloadInvoicePdf } from '../services/invoices-service';
import { formatCurrency } from '../lib/format-currency';
import { getInitials } from '../lib/avatar';
import { usePlanCheck } from '../hooks/usePlanCheck';
import type { InvoiceDetail as InvoiceDetailType } from 'shared';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-text-secondary/20 text-text-secondary dark:bg-dark-muted/30 dark:text-dark-muted',
  SENT: 'bg-primary/20 text-primary dark:bg-dark-primary/30 dark:text-dark-primary',
  PAID: 'bg-success/20 text-success',
  OVERDUE: 'bg-danger/20 text-danger',
  CANCELLED: 'bg-text-secondary/20 text-text-secondary dark:bg-dark-muted/30 dark:text-dark-muted',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const { canDownloadPDF } = usePlanCheck();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getInvoice(id)
      .then((inv) => {
        if (!cancelled) setInvoice(inv);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load invoice');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [id]);

  async function handleDownloadPdf(e: React.MouseEvent) {
    e.preventDefault();
    if (!id || downloading) return;
    setDownloading(true);
    try {
      await downloadInvoicePdf(id, invoice ? `invoice-${invoice.invoiceNumber}.pdf` : undefined);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="h-8 w-48 rounded-xl bg-border dark:bg-dark-border animate-shimmer" />
        <div className="h-64 rounded-2xl bg-border dark:bg-dark-border animate-shimmer" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">Invoice not found</h1>
        <Link to="/invoices" className="text-primary dark:text-dark-primary hover:underline">Back to invoices</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">Invoice Details</h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
            {invoice.invoiceNumber} · {invoice.client.name}
          </p>
        </div>
        {canDownloadPDF ? (
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-colors active:scale-[0.98]"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Downloading…' : 'Download PDF'}
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-xl bg-text-secondary/20 dark:bg-dark-muted/30 px-4 py-2 text-sm font-medium text-text-secondary dark:text-dark-muted cursor-not-allowed" title="Upgrade to Pro for PDF download">
            <Download className="h-4 w-4" />
            Download PDF
          </span>
        )}
      </div>

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start gap-6">
          <div className="h-12 w-12 rounded-full bg-primary/20 dark:bg-dark-primary/30 flex items-center justify-center text-lg font-semibold text-primary dark:text-dark-primary shrink-0">
            {getInitials(invoice.client.name)}
          </div>
          <div>
            <p className="font-medium text-text-primary dark:text-dark-text">{invoice.client.name}</p>
            <p className="text-sm text-text-secondary dark:text-dark-muted">{invoice.client.email}</p>
            {invoice.client.company && (
              <p className="text-sm text-text-secondary dark:text-dark-muted">{invoice.client.company}</p>
            )}
          </div>
          <div className="ml-auto text-right">
            <span className={`inline-block text-xs font-medium px-2 py-1 rounded-lg ${statusColors[invoice.status] ?? ''}`}>
              {invoice.status}
            </span>
            <p className="mt-2 text-sm text-text-secondary dark:text-dark-muted">
              Issue: {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
            </p>
            <p className="text-sm text-text-secondary dark:text-dark-muted">
              Due: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border dark:border-dark-border">
                <th className="text-left py-2 font-medium text-text-primary dark:text-dark-text">Description</th>
                <th className="text-right py-2 font-medium text-text-primary dark:text-dark-text w-24">Qty</th>
                <th className="text-right py-2 font-medium text-text-primary dark:text-dark-text w-32">Unit price</th>
                <th className="text-right py-2 font-medium text-text-primary dark:text-dark-text w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items ?? []).map((item) => (
                <tr key={item.id} className="border-b border-border dark:border-dark-border last:border-0">
                  <td className="py-2 text-text-primary dark:text-dark-text">{item.description}</td>
                  <td className="py-2 text-right text-text-primary dark:text-dark-text">{item.quantity}</td>
                  <td className="py-2 text-right text-text-primary dark:text-dark-text">
                    {formatCurrency(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="py-2 text-right text-text-primary dark:text-dark-text font-medium">
                    {formatCurrency(item.total, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 pt-4 border-t border-border dark:border-dark-border flex flex-col items-end gap-1">
          <div className="flex justify-between w-48 text-sm">
            <span className="text-text-secondary dark:text-dark-muted">Subtotal</span>
            <span className="text-text-primary dark:text-dark-text">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          <div className="flex justify-between w-48 text-sm">
            <span className="text-text-secondary dark:text-dark-muted">Tax</span>
            <span className="text-text-primary dark:text-dark-text">{formatCurrency(invoice.tax, invoice.currency)}</span>
          </div>
          <div className="flex justify-between w-48 text-sm font-semibold pt-2">
            <span className="text-text-primary dark:text-dark-text">Total</span>
            <span className="text-text-primary dark:text-dark-text">{formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 pt-4 border-t border-border dark:border-dark-border">
            <p className="text-sm font-medium text-text-primary dark:text-dark-text mb-1">Notes</p>
            <p className="text-sm text-text-secondary dark:text-dark-muted whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
