import { axiosInstance } from '../lib/axios';
import type { InvoiceListItem, InvoiceDetail, Currency } from 'shared';

export interface InvoicesResponse {
  data: InvoiceListItem[];
  pagination: { page: number; limit: number; total: number };
}

export interface InvoiceItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateInvoicePayload {
  clientId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItemInput[];
  currency: Currency;
  taxPercent?: number;
  notes?: string;
}

export async function getInvoices(params?: { page?: number; limit?: number }): Promise<InvoicesResponse> {
  const { data } = await axiosInstance.get<InvoicesResponse>('/api/invoices', { params });
  return data;
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  const { data } = await axiosInstance.get<InvoiceDetail>(`/api/invoices/${id}`);
  return data;
}

export async function createInvoice(payload: CreateInvoicePayload): Promise<InvoiceDetail> {
  const { data } = await axiosInstance.post<InvoiceDetail>('/api/invoices', {
    ...payload,
    status: 'DRAFT',
  });
  return data;
}

export interface UpdateInvoicePayload extends CreateInvoicePayload {
  status: string;
}

export async function updateInvoice(id: string, payload: UpdateInvoicePayload): Promise<InvoiceDetail> {
  const { data } = await axiosInstance.put<InvoiceDetail>(`/api/invoices/${id}`, payload);
  return data;
}

/** Download invoice PDF; triggers browser download. */
export async function downloadInvoicePdf(id: string, filename?: string): Promise<void> {
  const { data } = await axiosInstance.get<Blob>(`/api/invoices/${id}/pdf`, {
    responseType: 'blob',
  });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename ?? `invoice-${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
