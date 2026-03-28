import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
  ComposedChart,
} from 'recharts';
import { useAuthStore } from '../store/auth-store';
import {
  getDashboardSummary,
  getMonthlyData,
  getClientRevenue,
  getExpensesByCategory,
  getInvoiceStatusBreakdown,
  getMonthlyExpensesByCategory,
  type DashboardSummary as SummaryType,
  type MonthlyData,
  type ClientRevenue,
  type ExpenseByCategory,
  type MonthlyExpensesByCategory,
} from '../services/dashboard-service';
import { formatCurrency } from '../lib/format-currency';
import type { Currency } from 'shared';

const CHART_COLORS = [
  '#0EA5E9',
  '#06B6D4',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#38BDF8',
  '#22D3EE',
];

type DateRange = '3' | '6' | '12';

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const currency = (user?.currency as Currency) || 'USD';
  const [dateRange, setDateRange] = useState<DateRange>('6');
  const [summary, setSummary] = useState<SummaryType | null>(null);
  const [monthly, setMonthly] = useState<MonthlyData[]>([]);
  const [byClient, setByClient] = useState<ClientRevenue[]>([]);
  const [byCategory, setByCategory] = useState<ExpenseByCategory[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({});
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpensesByCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthsNum = parseInt(dateRange, 10);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getDashboardSummary(),
      getMonthlyData(monthsNum),
      getClientRevenue(),
      getExpensesByCategory(),
      getInvoiceStatusBreakdown(),
      getMonthlyExpensesByCategory(monthsNum),
    ])
      .then(([s, m, c, cat, status, me]) => {
        if (cancelled) return;
        setSummary(s);
        setMonthly(m);
        setByClient(c);
        setByCategory(cat);
        setStatusBreakdown(status);
        setMonthlyExpenses(me);
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
  }, [monthsNum]);

  if (loading && !summary) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 rounded-xl bg-border dark:bg-dark-border animate-shimmer" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-border dark:bg-dark-border animate-shimmer" />
          ))}
        </div>
        <div className="h-80 rounded-2xl bg-border dark:bg-dark-border animate-shimmer" />
      </div>
    );
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  const avgMonthlyRevenue =
    monthly.length > 0
      ? monthly.reduce((s, m) => s + m.revenue, 0) / monthly.length
      : 0;
  const bestMonth = monthly.length > 0
    ? monthly.reduce((best, m) => (m.revenue > best.revenue ? m : best), monthly[0])
    : null;
  const totalInvoices = summary?.totalInvoices ?? 0;
  const paidInvoices = summary?.paidInvoices ?? 0;
  const paymentSuccessRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0;

  const lineData = monthly.map((m) => ({
    month: m.month,
    revenue: m.revenue / 100,
  }));

  const categoryKeys = Array.from(
    new Set(monthlyExpenses.flatMap((me) => Object.keys(me.byCategory)))
  );
  const stackedBarData = monthlyExpenses.map((me) => {
    const row: Record<string, number | string> = { month: me.month };
    for (const k of categoryKeys) {
      row[k] = (me.byCategory[k] ?? 0) / 100;
    }
    return row;
  });

  const clientBarData = byClient.slice(0, 8).map((c: ClientRevenue) => ({
    name: c.clientName.length > 15 ? c.clientName.slice(0, 15) + '…' : c.clientName,
    fullName: c.clientName,
    revenue: c.totalRevenue / 100,
  }));

  const statusPieData = Object.entries(statusBreakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  return (
    <div data-lang={language} className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">{t('analytics.title')}</h1>
        <div className="flex gap-2">
          {(['3', '6', '12'] as const).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setDateRange(range)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                dateRange === range
                  ? 'bg-primary text-white dark:bg-dark-primary'
                  : 'bg-card dark:bg-dark-card border border-border dark:border-dark-border text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg'
              }`}
            >
              {range === '12' ? t('analytics.last_year') : t('analytics.last_n_months', { months: range })}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-4 shadow-sm">
          <p className="text-xs font-medium text-text-secondary dark:text-dark-muted">{t('analytics.avg_monthly_revenue')}</p>
          <p className="mt-1 text-lg font-semibold text-text-primary dark:text-dark-text">
            {formatCurrency(Math.round(avgMonthlyRevenue), currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-4 shadow-sm">
          <p className="text-xs font-medium text-text-secondary dark:text-dark-muted">{t('analytics.best_month')}</p>
          <p className="mt-1 text-lg font-semibold text-text-primary dark:text-dark-text">
            {bestMonth ? `${bestMonth.month}: ${formatCurrency(bestMonth.revenue, currency)}` : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-4 shadow-sm">
          <p className="text-xs font-medium text-text-secondary dark:text-dark-muted">{t('analytics.total_invoices_sent')}</p>
          <p className="mt-1 text-lg font-semibold text-text-primary dark:text-dark-text">{totalInvoices}</p>
        </div>
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-4 shadow-sm">
          <p className="text-xs font-medium text-text-secondary dark:text-dark-muted">{t('analytics.payment_success_rate')}</p>
          <p className="mt-1 text-lg font-semibold text-text-primary dark:text-dark-text">
            {paymentSuccessRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Line chart - Revenue trend */}
      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text mb-4">{t('analytics.revenue_trend')}</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border dark:stroke-dark-border" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip formatter={(value: number) => [formatCurrency(value * 100, currency), t('analytics.revenue')]} />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={{ fill: '#4F46E5' }}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stacked bar - Monthly expenses by category */}
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text mb-4">
            {t('analytics.monthly_expenses_by_category')}
            {byCategory.length > 0 && ` (${t('analytics.categories_count', { count: byCategory.length })})`}
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={stackedBarData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border dark:stroke-dark-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency((value as number) * 100, currency), '']}
                  labelFormatter={(label) => label}
                />
                <Legend />
                {categoryKeys.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="a"
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                    name={key}
                    isAnimationActive
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie - Invoice status */}
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text mb-4">{t('analytics.invoice_status_breakdown')}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                  isAnimationActive
                >
                  {statusPieData.map((_, i) => (
                    <Cell key={i} fill={statusPieData[i].color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, t('analytics.invoices')]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Horizontal bar - Top clients */}
      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text mb-4">{t('analytics.top_clients_by_revenue')}</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={clientBarData} layout="vertical" margin={{ left: 80, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border dark:stroke-dark-border" />
              <XAxis type="number" tickFormatter={(v) => `$${v}`} />
              <YAxis type="category" dataKey="name" width={75} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value * 100, currency), t('analytics.revenue')]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
              />
              <Bar dataKey="revenue" fill="#0EA5E9" radius={[0, 4, 4, 0]} isAnimationActive />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
