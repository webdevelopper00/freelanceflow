import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, User, Mail, Phone, Building2, MapPin, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient, updateClient, type CreateClientPayload } from '../services/clients-service';
import type { Client, Currency } from 'shared';

const CURRENCIES: Currency[] = ['MAD', 'USD', 'EUR', 'GBP'];

interface ClientModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: (client: Client) => void;
  editClient?: Client | null;
}

export default function ClientModal({ open, onClose, onSaved, editClient }: ClientModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { t } = useTranslation();

  useEffect(() => {
    if (editClient) {
      setName(editClient.name);
      setEmail(editClient.email);
      setPhone(editClient.phone ?? '');
      setCompany(editClient.company ?? '');
      setAddress(editClient.address ?? '');
      setCurrency(editClient.currency);
      setNotes(editClient.notes ?? '');
    } else {
      resetForm();
    }
  }, [editClient, open]);

  function resetForm() {
    setName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setAddress('');
    setCurrency('USD');
    setNotes('');
    setErrors({});
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Full name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Invalid email address';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: CreateClientPayload = {
        name: name.trim(),
        email: email.trim(),
        currency,
      };
      if (phone.trim()) payload.phone = phone.trim();
      if (company.trim()) payload.company = company.trim();
      if (address.trim()) payload.address = address.trim();
      if (notes.trim()) payload.notes = notes.trim();
      let saved: Client;
      if (editClient) {
        saved = await updateClient(editClient.id, payload);
        toast.success('Client updated');
      } else {
        const { data } = await createClient(payload);
        saved = data;
        toast.success('Client added');
      }
      onSaved(saved);
      resetAndClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err &&
        (err.response as { data?: { message?: string } })?.data?.message
          ? (err.response as { data: { message: string } }).data.message
          : editClient ? 'Failed to update client' : 'Failed to add client';
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
        aria-labelledby="client-modal-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-dark-border">
          <h2 id="client-modal-title" className="text-lg font-semibold text-text-primary dark:text-dark-text">
            {editClient ? t('clients.edit') : t('clients.add_client')}
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
            <label htmlFor="client-name" className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
              {t('clients.name')} <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                <User className="h-5 w-5" />
              </div>
              <input
                id="client-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                placeholder="John Doe"
              />
            </div>
            {errors.name && <p className="mt-1 text-sm text-danger">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="client-email" className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
              {t('clients.email')} <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                <Mail className="h-5 w-5" />
              </div>
              <input
                id="client-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                placeholder="john@example.com"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-danger">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="client-phone" className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
              {t('clients.phone')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                <Phone className="h-5 w-5" />
              </div>
              <input
                id="client-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>
          <div>
            <label htmlFor="client-company" className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
              {t('clients.company')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                <Building2 className="h-5 w-5" />
              </div>
              <input
                id="client-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                placeholder="Acme Inc."
              />
            </div>
          </div>
          <div>
            <label htmlFor="client-address" className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
              {t('clients.address')}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none text-text-secondary dark:text-dark-muted">
                <MapPin className="h-5 w-5" />
              </div>
              <textarea
                id="client-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                className="block w-full pl-10 pr-3 py-2.5 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary resize-none"
                placeholder="Street, City, Country"
              />
            </div>
          </div>
          <div>
            <label htmlFor="client-currency" className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
              {t('clients.currency')}
            </label>
            <select
              id="client-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Currency)}
              className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2.5 focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="client-notes" className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">
              {t('clients.notes')}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 flex items-start pointer-events-none text-text-secondary dark:text-dark-muted">
                <FileText className="h-5 w-5" />
              </div>
              <textarea
                id="client-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
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
              className="flex-1 py-2.5 rounded-xl bg-primary dark:bg-dark-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-colors active:scale-[0.98]"
            >
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
