import { useParams } from 'react-router-dom';

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">Client Details</h1>
      <p className="text-sm text-text-secondary dark:text-dark-muted">
        Details for client <span className="font-mono">{id}</span> will appear here.
      </p>
      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 text-sm text-text-secondary dark:text-dark-muted shadow-sm">
        Client profile, invoices, and stats coming soon.
      </div>
    </div>
  );
}

