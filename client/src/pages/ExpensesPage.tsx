import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Receipt, Laptop, Car, Megaphone, Briefcase, Calculator, FolderOpen, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { getExpenses, deleteExpense } from '../services/expenses-service';
import { formatCurrency } from '../lib/format-currency';
import ExpenseModal from '../components/ExpenseModal';
import type { Expense } from 'shared';

const CATEGORIES = ['ALL', 'SOFTWARE', 'EQUIPMENT', 'TRANSPORT', 'MARKETING', 'OFFICE', 'TAX', 'OTHER'];

function categoryIcon(cat: string) {
  switch (cat) {
    case 'SOFTWARE':
      return <Laptop className="h-5 w-5" />;
    case 'EQUIPMENT':
      return <Briefcase className="h-5 w-5" />;
    case 'TRANSPORT':
      return <Car className="h-5 w-5" />;
    case 'MARKETING':
      return <Megaphone className="h-5 w-5" />;
    case 'OFFICE':
      return <FolderOpen className="h-5 w-5" />;
    case 'TAX':
      return <Calculator className="h-5 w-5" />;
    default:
      return <Receipt className="h-5 w-5" />;
  }
}

const categoryColors: Record<string, string> = {
  SOFTWARE: 'bg-primary/20 text-primary dark:bg-dark-primary/30 dark:text-dark-primary',
  EQUIPMENT: 'bg-accent/20 text-accent',
  TRANSPORT: 'bg-warning/20 text-warning',
  MARKETING: 'bg-success/20 text-success',
  OFFICE: 'bg-text-secondary/20 text-text-secondary dark:bg-dark-muted/30 dark:text-dark-muted',
  TAX: 'bg-danger/20 text-danger',
  OTHER: 'bg-border dark:bg-dark-border text-text-secondary dark:text-dark-muted',
};

function ExpensesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-border dark:bg-dark-border animate-shimmer" aria-hidden />
      ))}
    </div>
  );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { t } = useTranslation();

  function getCategoryLabel(cat: string) {
    return t(`expenses.category.${cat}`);
  }

  useEffect(() => {
    let cancelled = false;
    getExpenses()
      .then((res) => {
        if (!cancelled) setExpenses(res.data);
      })
      .catch(() => {
        if (!cancelled) setError(t('common.error'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = categoryFilter === 'ALL' ? expenses : expenses.filter((e) => e.category === categoryFilter);

  function handleEdit(exp: Expense) {
    setEditExpense(exp);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success(t('common.success'));
    } catch {
      toast.error(t('common.failed'));
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">{t('expenses.title')}</h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
            {t('expenses.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setEditExpense(null); setModalOpen(true); }}
          className="inline-flex items-center justify-center rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white hover:opacity-90 shadow-md active:scale-[0.98] transition"
        >
          {t('expenses.add')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              categoryFilter === cat
                ? 'bg-primary text-white dark:bg-dark-primary'
                : 'bg-card dark:bg-dark-card border border-border dark:border-dark-border text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg'
            }`}
          >
            {getCategoryLabel(cat)}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
        {error && <p className="text-sm text-danger">{error}</p>}
        {loading && <ExpensesSkeleton />}
        {!loading && !error && filtered.length === 0 && (
          <div className="py-12 text-center">
            <Receipt className="mx-auto h-12 w-12 text-text-secondary dark:text-dark-muted" />
            <h3 className="mt-3 text-sm font-medium text-text-primary dark:text-dark-text">{t('expenses.no_expenses')}</h3>
            <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
              {categoryFilter === 'ALL'
                ? t('expenses.no_expenses_desc')
                : `${t('expenses.no_expenses')} ${getCategoryLabel(categoryFilter)}`}
            </p>
          </div>
        )}
        {!loading && !error && filtered.length > 0 && (
          <ul className="divide-y divide-border dark:divide-dark-border">
            {filtered.map((e) => (
              <li key={e.id} className="py-4 first:pt-0 last:pb-0 flex flex-wrap items-center gap-4">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${categoryColors[e.category] ?? categoryColors.OTHER}`}>
                  {categoryIcon(e.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary dark:text-dark-text">{e.title}</p>
                  <p className="text-sm text-text-secondary dark:text-dark-muted">
                    {getCategoryLabel(e.category)} · {format(new Date(e.date), 'MMM dd, yyyy')}
                  </p>
                  {e.notes && <p className="text-sm text-text-secondary dark:text-dark-muted mt-0.5">{e.notes}</p>}
                </div>
                <p className="font-bold text-danger">{formatCurrency(e.amount, 'USD')}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(e)}
                    className="p-2 rounded-lg text-text-secondary dark:text-dark-muted hover:bg-primary/10 hover:text-primary dark:hover:text-dark-primary transition-colors"
                    aria-label={t('common.edit')}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteId(e.id)}
                    className="p-2 rounded-lg text-text-secondary dark:text-dark-muted hover:bg-danger/10 hover:text-danger transition-colors"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ExpenseModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditExpense(null); }}
        onSaved={(saved) => {
          if (editExpense) {
            setExpenses((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
          } else {
            setExpenses((prev) => [saved, ...prev]);
          }
        }}
        editExpense={editExpense}
      />
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text mb-2">{t('expenses.delete_confirm')}</h3>
            <p className="text-sm text-text-secondary dark:text-dark-muted mb-4">{t('expenses.delete_warning')}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2 rounded-xl border border-border dark:border-dark-border text-text-primary dark:text-dark-text font-medium hover:bg-background dark:hover:bg-dark-bg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteId)}
                className="flex-1 py-2 rounded-xl bg-danger text-white font-medium hover:opacity-90 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
