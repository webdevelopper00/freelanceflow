import { axiosInstance } from '../lib/axios';
import type { Client } from 'shared';

export interface ClientsResponse {
  data: Client[];
  pagination: { page: number; limit: number; total: number };
}

export interface CreateClientPayload {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  currency: string;
  notes?: string;
}

export async function getClients(params?: { page?: number; limit?: number }): Promise<ClientsResponse> {
  const { data } = await axiosInstance.get<ClientsResponse>('/api/clients', { params });
  return data;
}

export async function createClient(payload: CreateClientPayload): Promise<{ data: Client }> {
  const { data } = await axiosInstance.post<Client>('/api/clients', payload);
  return { data };
}

export async function updateClient(id: string, payload: CreateClientPayload): Promise<Client> {
  const { data } = await axiosInstance.put<Client>(`/api/clients/${id}`, payload);
  return data;
}

export async function deleteClient(id: string): Promise<void> {
  await axiosInstance.delete(`/api/clients/${id}`);
}
