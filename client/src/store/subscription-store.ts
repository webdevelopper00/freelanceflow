import { create } from 'zustand';
import { getSubscriptionStatus } from '../services/subscription-service';
import type { SubscriptionStatusResponse } from 'shared';

interface SubscriptionState extends SubscriptionStatusResponse {
  loaded: boolean;
  fetchSubscriptionStatus: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  plan: 'TRIAL',
  status: 'ACTIVE',
  trialDaysRemaining: null,
  trialEndDate: null,
  subscriptionEndDate: null,
  trialUsed: false,
  limits: {
    clientsUsed: 0,
    clientsLimit: 3,
    invoicesUsed: 0,
    invoicesLimit: 5,
  },
  loaded: false,

  fetchSubscriptionStatus: async () => {
    try {
      const status = await getSubscriptionStatus();
      set({ ...status, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
