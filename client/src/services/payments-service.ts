import { axiosInstance } from '../lib/axios';
import type { Payment, Currency, PaymentMethod } from 'shared';

export interface PaymentWithClient extends Payment {
  clientName: string;
}

export interface PaymentsResponse {
  data: PaymentWithClient[];
  pagination: { page: number; limit: number; total: number };
}

export interface CreatePaymentPayload {
  clientId: string;
  invoiceId?: string | null;
  amount: number;
  currency: Currency;
  date: string;
  method: PaymentMethod;
  notes?: string | null;
}

export async function getPayments(params?: { page?: number; limit?: number }): Promise<PaymentsResponse> {
  const { data } = await axiosInstance.get<PaymentsResponse>('/api/payments', { params });
  return data;
}

export async function createPayment(payload: CreatePaymentPayload): Promise<PaymentWithClient> {
  const { data } = await axiosInstance.post<PaymentWithClient>('/api/payments', payload);
  return data;
}

export async function updatePayment(id: string, payload: CreatePaymentPayload): Promise<PaymentWithClient> {
  const { data } = await axiosInstance.put<PaymentWithClient>(`/api/payments/${id}`, payload);
  return data;
}

export async function deletePayment(id: string): Promise<void> {
  await axiosInstance.delete(`/api/payments/${id}`);
}
