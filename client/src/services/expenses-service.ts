import { axiosInstance } from '../lib/axios';
import type { Expense, ExpenseCategory } from 'shared';

export interface ExpensesResponse {
  data: Expense[];
  pagination: { page: number; limit: number; total: number };
}

export interface CreateExpensePayload {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string | null;
}

export async function getExpenses(params?: { page?: number; limit?: number }): Promise<ExpensesResponse> {
  const { data } = await axiosInstance.get<ExpensesResponse>('/api/expenses', { params });
  return data;
}

export async function createExpense(payload: CreateExpensePayload): Promise<Expense> {
  const { data } = await axiosInstance.post<Expense>('/api/expenses', payload);
  return data;
}

export async function updateExpense(id: string, payload: CreateExpensePayload): Promise<Expense> {
  const { data } = await axiosInstance.put<Expense>(`/api/expenses/${id}`, payload);
  return data;
}

export async function deleteExpense(id: string): Promise<void> {
  await axiosInstance.delete(`/api/expenses/${id}`);
}
