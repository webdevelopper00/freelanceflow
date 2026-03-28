import { useSubscriptionStore } from '../store/subscription-store';

export function usePlanCheck() {
  const { plan, status, limits, trialDaysRemaining, trialEndDate } = useSubscriptionStore();

  const isTrial = plan === 'TRIAL';
  const isExpired = status === 'EXPIRED' || status === 'CANCELLED';
  const isProOrBusiness = plan === 'PRO' || plan === 'BUSINESS';
  const hasActiveSubscription = isProOrBusiness && status === 'ACTIVE';

  const canAddClient = (): boolean => {
    if (isExpired) return false;
    if (!isTrial) return true;
    return limits.clientsUsed < limits.clientsLimit;
  };

  const canAddInvoice = (): boolean => {
    if (isExpired) return false;
    if (!isTrial) return true;
    return limits.invoicesUsed < limits.invoicesLimit;
  };

  const canViewAnalytics = (): boolean => hasActiveSubscription;

  const canDownloadPDF = (): boolean => hasActiveSubscription;

  const isTrialExpired = (): boolean => {
    if (plan !== 'TRIAL') return false;
    if (status === 'EXPIRED') return true;
    if (!trialEndDate) return false;
    return new Date(trialEndDate) < new Date();
  };

  const daysRemaining = (): number => {
    if (trialDaysRemaining !== null) return trialDaysRemaining;
    if (!trialEndDate) return 0;
    const diff = new Date(trialEndDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  };

  return {
    canAddClient: canAddClient(),
    canAddInvoice: canAddInvoice(),
    canViewAnalytics: canViewAnalytics(),
    canDownloadPDF: canDownloadPDF(),
    isTrialExpired: isTrialExpired(),
    daysRemaining: daysRemaining(),
    plan,
    status,
    isTrial,
    isExpired,
    limits,
  };
}
