import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  FileText,
  DollarSign,
  PlusCircle,
  UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import {
  getDashboardSummary,
  getMonthlyData,
  getRecentActivity,
  getClientRevenue,
  getExpensesByCategory,
  type DashboardSummary as SummaryType,
  type MonthlyData,
  type RecentActivity,
  type ClientRevenue,
  type ExpenseByCategory,
} from '../services/dashboard-service';
import { formatCurrency } from '../lib/format-currency';
import CountUp from '../components/CountUp';
import type { Currency } from 'shared';

const CHART_COLORS = [
  '#0EA5E9',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#22D3EE',
  '#38BDF8',
];

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-64 rounded-xl bg-border dark:bg-dark-border animate-shimmer" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-border dark:bg-dark-border animate-shimmer" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-80 rounded-2xl bg-border dark:bg-dark-border animate-shimmer" />
        <div className="h-80 rounded-2xl bg-border dark:bg-dark-border animate-shimmer" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const greetingText =
    new Date().getHours() < 12
      ? t('dashboard.greeting_morning')
      : new Date().getHours() < 18
        ? t('dashboard.greeting_afternoon')
        : t('dashboard.greeting_evening');
  const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar' : 'en-US';
  const thereFallback = t('common.there');
  const currency = (user?.currency as Currency) || 'USD';
  const [summary, setSummary] = useState<SummaryType | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [recent, setRecent] = useState<RecentActivity | null>(null);
  const [byClient, setByClient] = useState<ClientRevenue[]>([]);
  const [byCategory, setByCategory] = useState<ExpenseByCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getDashboardSummary(),
      getMonthlyData(),
      getRecentActivity(),
      getClientRevenue(),
      getExpensesByCategory(),
    ])
      .then(([s, m, r, c, cat]) => {
        if (cancelled) return;
        setSummary(s);
        setMonthly(m);
        setRecent(r);
        setByClient(c);
        setByCategory(cat);
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

  if (loading) return <DashboardSkeleton />;
  if (error) {
    return (
      <p className="text-danger">{error}</p>
    );
  }

  function getInvoiceStatusLabel(status: string) {
    if (status === 'DRAFT') return t('invoices.status_draft');
    if (status === 'SENT') return t('invoices.status_sent');
    if (status === 'PAID') return t('invoices.status_paid');
    if (status === 'OVERDUE') return t('invoices.status_overdue');
    if (status === 'CANCELLED') return status;
    return status;
  }

  const revChange =
    summary && summary.revenueLastMonth > 0
      ? ((summary.revenueThisMonth - summary.revenueLastMonth) / summary.revenueLastMonth) * 100
      : 0;
  const expChange =
    summary && summary.expensesLastMonth > 0
      ? ((summary.expensesThisMonth - summary.expensesLastMonth) / summary.expensesLastMonth) * 100
      : 0;

  const monthChartData = monthly.map((m) => ({
    month: m.month,
    revenue: m.revenue / 100,
    expenses: m.expenses / 100,
  }));

  const pieData = byCategory.map((c, i) => ({
    name: c.category,
    value: c.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-text-secondary/20 text-text-secondary dark:bg-dark-muted/30 dark:text-dark-muted',
    SENT: 'bg-primary/20 text-primary dark:bg-dark-primary/30 dark:text-dark-primary',
    PAID: 'bg-success/20 text-success',
    OVERDUE: 'bg-danger/20 text-danger',
    CANCELLED: 'bg-text-secondary/20 text-text-secondary dark:bg-dark-muted/30 dark:text-dark-muted',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">
            {greetingText}, {user?.name?.split(' ')[0] ?? thereFallback}!
          </h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
            {new Date().toLocaleDateString(locale, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/invoices/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 shadow-md hover:shadow-lg transition active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" />
            {t('dashboard.new_invoice')}
          </Link>
          <Link
            to="/clients"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary dark:border-dark-primary bg-transparent px-4 py-2 text-sm font-medium text-primary dark:text-dark-primary hover:bg-primary/10 dark:hover:bg-dark-primary/10 transition active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4" />
            {t('dashboard.add_client')}
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md hover:border-l-4 hover:border-l-primary dark:hover:border-l-dark-primary transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary dark:text-dark-muted">{t('dashboard.total_revenue')}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent dark:from-dark-primary dark:to-accent">
              <TrendingUp className="h-5 w-5 text-white" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text-primary dark:text-dark-text">
            <CountUp value={summary?.totalRevenue ?? 0} format={(v) => formatCurrency(Math.round(v), currency)} />
          </div>
          <p className={`mt-1 text-xs font-medium ${revChange >= 0 ? 'text-success' : 'text-danger'}`}>
            {revChange >= 0 ? '+' : ''}{revChange.toFixed(1)}% {t('dashboard.vs_last_month')}
          </p>
        </div>

        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md hover:border-l-4 hover:border-l-danger transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary dark:text-dark-muted">{t('dashboard.total_expenses')}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-danger to-warning">
              <TrendingDown className="h-5 w-5 text-white" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-text-primary dark:text-dark-text">
            <CountUp value={summary?.totalExpenses ?? 0} format={(v) => formatCurrency(Math.round(v), currency)} />
          </div>
          <p className={`mt-1 text-xs font-medium ${expChange >= 0 ? 'text-danger' : 'text-success'}`}>
            {expChange >= 0 ? '+' : ''}{expChange.toFixed(1)}% {t('dashboard.vs_last_month')}
          </p>
        </div>

        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md hover:border-l-4 hover:border-l-success transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary dark:text-dark-muted">{t('dashboard.net_profit')}</span>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${(summary?.netProfit ?? 0) >= 0 ? 'bg-gradient-to-br from-success to-accent' : 'bg-gradient-to-br from-danger to-red-400'}`}>
              <DollarSign className="h-5 w-5 text-white" />
            </span>
          </div>
          <div className={`mt-2 text-2xl font-bold ${(summary?.netProfit ?? 0) >= 0 ? 'text-success' : 'text-danger'}`}>
            <CountUp value={summary?.netProfit ?? 0} format={(v) => formatCurrency(Math.round(v), currency)} />
          </div>
          <p className="mt-1 text-xs text-text-secondary dark:text-dark-muted">{t('dashboard.net_profit_desc')}</p>
        </div>

        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md hover:border-l-4 hover:border-l-warning transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-secondary dark:text-dark-muted">{t('dashboard.pending_amount')}</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-warning to-amber-400">
              <Clock className="h-5 w-5 text-white" />
            </span>
          </div>
          <div className="mt-2 text-2xl font-bold text-warning">
            <CountUp value={summary?.pendingAmount ?? 0} format={(v) => formatCurrency(Math.round(v), currency)} />
          </div>
          <p className="mt-1 text-xs text-text-secondary dark:text-dark-muted">{t('dashboard.sent_overdue_invoices')}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary dark:text-dark-primary" />
            <span className="text-sm font-medium text-text-secondary dark:text-dark-muted">{t('dashboard.total_clients')}</span>
          </div>
          <div className="mt-2 text-xl font-bold text-text-primary dark:text-dark-text">
            <CountUp value={summary?.totalClients ?? 0} duration={800} />
          </div>
          <p className="mt-1 text-xs text-text-secondary dark:text-dark-muted">{t('dashboard.active_clients')}</p>
        </div>

        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary dark:text-dark-primary" />
            <span className="text-sm font-medium text-text-secondary dark:text-dark-muted">{t('dashboard.total_invoices')}</span>
          </div>
          <div className="mt-2 text-xl font-bold text-text-primary dark:text-dark-text">
            <CountUp value={summary?.totalInvoices ?? 0} duration={800} />
          </div>
          <p className="mt-1 text-xs text-text-secondary dark:text-dark-muted">
            {summary?.paidInvoices ?? 0} paid · {summary?.overdueInvoices ?? 0} overdue
          </p>
        </div>

        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md transition-shadow">
          <span className="text-sm font-medium text-text-secondary dark:text-dark-muted">{t('dashboard.this_month_revenue')}</span>
          <div className="mt-2 text-xl font-bold text-text-primary dark:text-dark-text">
            <CountUp value={summary?.revenueThisMonth ?? 0} format={(v) => formatCurrency(Math.round(v), currency)} />
          </div>
          <p className={`mt-1 text-xs font-medium ${revChange >= 0 ? 'text-success' : 'text-danger'}`}>
            {revChange >= 0 ? '+' : ''}{revChange.toFixed(1)}% {t('dashboard.vs_last_month')}
          </p>
        </div>
      </div>

      {/* Charts: 60% + 40% */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text mb-4">{t('dashboard.revenue_vs_expenses')}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-border dark:text-dark-border opacity-50" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-text-secondary dark:text-dark-muted" />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, '']} contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-border)' }} />
                <Bar dataKey="revenue" name={t('dashboard.total_revenue')} fill="#0EA5E9" radius={[6, 6, 0, 0]} isAnimationActive />
                <Bar dataKey="expenses" name={t('dashboard.total_expenses')} fill="#06B6D4" radius={[6, 6, 0, 0]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text mb-4">{t('dashboard.expenses_by_category')}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={pieData[i].color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value, currency)} />
                <Legend layout="horizontal" verticalAlign="bottom" formatter={(_: unknown, entry: { payload?: { name?: string; value?: number } }) => `${entry.payload?.name ?? ''}: ${formatCurrency(entry.payload?.value ?? 0, currency)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md hover:border-l-4 hover:border-l-primary dark:hover:border-l-dark-primary transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text">{t('dashboard.recent_invoices')}</h2>
            <Link to="/invoices" className="text-sm font-medium text-primary dark:text-dark-primary hover:underline">
              {t('dashboard.view_all')}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary dark:text-dark-muted border-b border-border dark:border-dark-border bg-background dark:bg-dark-bg/50">
                  <th className="pb-2 pr-2">{t('invoices.invoice_number')}</th>
                  <th className="pb-2 pr-2">{t('invoices.client')}</th>
                  <th className="pb-2 pr-2">{t('common.amount')}</th>
                  <th className="pb-2 pr-2">{t('common.status')}</th>
                  <th className="pb-2">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {(recent?.recentInvoices ?? []).map((inv) => (
                  <tr key={inv.id} className="border-b border-border dark:border-dark-border">
                    <td className="py-2 pr-2 font-mono text-text-primary dark:text-dark-text">
                      <Link to={`/invoices/${inv.id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2 pr-2 text-text-secondary dark:text-dark-muted">{inv.clientName}</td>
                    <td className="py-2 pr-2 text-text-primary dark:text-dark-text">
                      {formatCurrency(inv.total, inv.currency as Currency)}
                    </td>
                    <td className="py-2 pr-2">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-lg ${statusColors[inv.status] ?? ''}`}>
                        {getInvoiceStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="py-2 text-text-secondary dark:text-dark-muted">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!recent?.recentInvoices?.length) && (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-text-secondary dark:text-dark-muted">
                      {t('dashboard.no_recent_invoices')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md hover:border-l-4 hover:border-l-primary dark:hover:border-l-dark-primary transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text">{t('dashboard.recent_payments')}</h2>
            <Link to="/payments" className="text-sm font-medium text-primary dark:text-dark-primary hover:underline">
              {t('dashboard.view_all')}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary dark:text-dark-muted border-b border-border dark:border-dark-border bg-background dark:bg-dark-bg/50">
                  <th className="pb-2 pr-2">{t('payments.client')}</th>
                  <th className="pb-2 pr-2">{t('payments.amount')}</th>
                  <th className="pb-2 pr-2">{t('payments.method')}</th>
                  <th className="pb-2">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {(recent?.recentPayments ?? []).map((p) => (
                  <tr key={p.id} className="border-b border-border dark:border-dark-border">
                    <td className="py-2 pr-2 text-text-primary dark:text-dark-text">{p.clientName}</td>
                    <td className="py-2 pr-2 font-medium text-success">
                      {formatCurrency(p.amount, p.currency as Currency)}
                    </td>
                    <td className="py-2 pr-2 text-text-secondary dark:text-dark-muted">{p.method}</td>
                    <td className="py-2 text-text-secondary dark:text-dark-muted">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!recent?.recentPayments?.length) && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-text-secondary dark:text-dark-muted">
                      {t('dashboard.no_recent_payments')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm hover:shadow-md hover:border-l-4 hover:border-l-primary dark:hover:border-l-dark-primary transition-all duration-300">
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text mb-4">{t('dashboard.top_clients')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary dark:text-dark-muted border-b border-border dark:border-dark-border bg-background dark:bg-dark-bg/50">
                <th className="pb-2 pr-2">{t('invoices.client')}</th>
                <th className="pb-2 pr-2">{t('dashboard.total_revenue')}</th>
                <th className="pb-2 pr-2">{t('invoices.title')}</th>
                <th className="pb-2">{t('dashboard.last_invoice')}</th>
              </tr>
            </thead>
            <tbody>
              {byClient.map((c) => (
                <tr key={c.clientName} className="border-b border-border dark:border-dark-border">
                  <td className="py-2 pr-2 font-medium text-text-primary dark:text-dark-text">{c.clientName}</td>
                  <td className="py-2 pr-2 text-text-primary dark:text-dark-text">
                    {formatCurrency(c.totalRevenue, currency)}
                  </td>
                  <td className="py-2 pr-2 text-text-secondary dark:text-dark-muted">{c.invoiceCount}</td>
                  <td className="py-2 text-text-secondary dark:text-dark-muted">
                    {c.lastInvoiceDate ? new Date(c.lastInvoiceDate).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {byClient.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-text-secondary dark:text-dark-muted">
                    {t('dashboard.no_client_data_yet')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
