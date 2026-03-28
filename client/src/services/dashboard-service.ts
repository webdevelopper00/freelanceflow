import { axiosInstance } from '../lib/axios';

export interface DashboardSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  pendingAmount: number;
  totalClients: number;
  totalInvoices: number;
  paidInvoices: number;
  overdueInvoices: number;
  revenueThisMonth: number;
  expensesThisMonth: number;
  revenueLastMonth: number;
  expensesLastMonth: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface RecentActivity {
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    clientName: string;
    total: number;
    currency: string;
    status: string;
    issueDate: string;
  }>;
  recentPayments: Array<{
    id: string;
    clientName: string;
    amount: number;
    currency: string;
    method: string;
    date: string;
  }>;
  recentExpenses: Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    date: string;
  }>;
}

export interface ClientRevenue {
  clientName: string;
  totalRevenue: number;
  invoiceCount: number;
  lastInvoiceDate: string | null;
}

export interface ExpenseByCategory {
  category: string;
  total: number;
  percentage: number;
  count: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await axiosInstance.get<DashboardSummary>('/api/dashboard/summary');
  return data;
}

export async function getMonthlyData(months?: number): Promise<MonthlyData[]> {
  const params = months != null ? { months } : undefined;
  const { data } = await axiosInstance.get<MonthlyData[]>('/api/dashboard/monthly', { params });
  return data;
}

export async function getRecentActivity(): Promise<RecentActivity> {
  const { data } = await axiosInstance.get<RecentActivity>('/api/dashboard/recent');
  return data;
}

export async function getClientRevenue(): Promise<ClientRevenue[]> {
  const { data } = await axiosInstance.get<ClientRevenue[]>('/api/dashboard/by-client');
  return data;
}

export async function getExpensesByCategory(): Promise<ExpenseByCategory[]> {
  const { data } = await axiosInstance.get<ExpenseByCategory[]>('/api/dashboard/expenses-by-category');
  return data;
}

export async function getInvoiceStatusBreakdown(): Promise<Record<string, number>> {
  const { data } = await axiosInstance.get<Record<string, number>>('/api/dashboard/invoice-status-breakdown');
  return data;
}

export interface MonthlyExpensesByCategory {
  month: string;
  total: number;
  byCategory: Record<string, number>;
}

export async function getMonthlyExpensesByCategory(months?: number): Promise<MonthlyExpensesByCategory[]> {
  const params = months != null ? { months } : undefined;
  const { data } = await axiosInstance.get<MonthlyExpensesByCategory[]>('/api/dashboard/monthly-expenses-by-category', { params });
  return data;
}
