import { axiosInstance } from '../lib/axios';
import type { SubscriptionStatusResponse } from 'shared';

export async function getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
  const { data } = await axiosInstance.get<SubscriptionStatusResponse>('/api/subscription/status');
  return data;
}

export async function upgradeSubscription(plan: 'PRO' | 'BUSINESS'): Promise<SubscriptionStatusResponse> {
  const { data } = await axiosInstance.post<SubscriptionStatusResponse>('/api/subscription/upgrade', { plan });
  return data;
}
