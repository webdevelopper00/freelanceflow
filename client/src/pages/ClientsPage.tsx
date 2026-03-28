import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Mail, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getClients, deleteClient } from '../services/clients-service';
import { getInitials } from '../lib/avatar';
import ClientModal from '../components/ClientModal';
import UpgradeBanner from '../components/UpgradeBanner';
import { usePlanCheck } from '../hooks/usePlanCheck';
import type { Client } from 'shared';

function ClientsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-40 rounded-2xl bg-border dark:bg-dark-border animate-shimmer" aria-hidden />
      ))}
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { canAddClient, isExpired, isTrialExpired } = usePlanCheck();
  const { t } = useTranslation();

  function handleEdit(client: Client, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setEditClient(client);
    setClientModalOpen(true);
  }

  function handleDeleteClick(id: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteId(id);
  }

  async function handleDelete(id: string) {
    try {
      await deleteClient(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      toast.success('Client deleted');
    } catch {
      toast.error('Failed to delete client');
    } finally {
      setDeleteId(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    getClients()
      .then((res) => {
        if (!cancelled) setClients(res.data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load clients.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {(isExpired || isTrialExpired || !canAddClient) && (
        <UpgradeBanner
          message={isExpired || isTrialExpired ? 'Your trial has expired. Upgrade to Pro to continue adding clients and invoices.' : 'You’ve reached the free trial limit of 3 clients. Upgrade to Pro for unlimited clients.'}
          dismissible={!!canAddClient}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">{t('clients.title')}</h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
            {t('clients.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditClient(null); setClientModalOpen(true); }}
          disabled={!canAddClient}
          className="inline-flex items-center justify-center rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 shadow-md active:scale-[0.98] transition"
        >
          {t('clients.add_client')}
        </button>
      </div>

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
        {error && <p className="text-sm text-danger">{error}</p>}
        {loading && <ClientsSkeleton />}
        {!loading && !error && clients.length === 0 && (
          <div className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-text-secondary dark:text-dark-muted" />
            <h3 className="mt-3 text-sm font-medium text-text-primary dark:text-dark-text">{t('clients.no_clients')}</h3>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
              {t('clients.no_clients_desc')}
            </p>
            <button
              type="button"
              onClick={() => { setEditClient(null); setClientModalOpen(true); }}
              disabled={!canAddClient}
              className="mt-4 inline-flex rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {t('clients.add_client')}
            </button>
          </div>
        )}
        {!loading && !error && clients.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/clients/${c.id}`}
                  className="block rounded-2xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg p-5 shadow-sm hover:shadow-md hover:border-l-4 hover:border-l-primary dark:hover:border-l-dark-primary transition-all duration-300 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-full bg-primary/20 dark:bg-dark-primary/30 flex items-center justify-center text-lg font-semibold text-primary dark:text-dark-primary shrink-0">
                      {getInitials(c.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-text-primary dark:text-dark-text group-hover:text-primary dark:group-hover:text-dark-primary transition-colors">
                        {c.name}
                      </div>
                      {c.company && (
                        <div className="text-sm text-text-secondary dark:text-dark-muted mt-0.5">{c.company}</div>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-text-secondary dark:text-dark-muted">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                      <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-lg ${c.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-text-secondary/20 text-text-secondary dark:bg-dark-muted/30 dark:text-dark-muted'}`}>
                        {c.status}
                      </span>
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={(e) => handleEdit(c, e)}
                          className="p-2 rounded-lg text-text-secondary dark:text-dark-muted hover:bg-primary/10 hover:text-primary dark:hover:text-dark-primary transition-colors"
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteClick(c.id, e)}
                          className="p-2 rounded-lg text-text-secondary dark:text-dark-muted hover:bg-danger/10 hover:text-danger transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ClientModal
        open={clientModalOpen}
        onClose={() => { setClientModalOpen(false); setEditClient(null); }}
        onSaved={(client) => {
          if (editClient) {
            setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
          } else {
            setClients((prev) => [client, ...prev]);
          }
        }}
        editClient={editClient}
      />
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text mb-2">{t('clients.delete_confirm')}</h3>
            <p className="text-sm text-text-secondary dark:text-dark-muted mb-4">{t('clients.delete_warning')}</p>
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
