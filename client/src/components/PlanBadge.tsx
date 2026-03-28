import { useSubscriptionStore } from '../store/subscription-store';

export default function PlanBadge() {
  const { plan, status, trialDaysRemaining } = useSubscriptionStore();

  if (plan === 'PRO') {
    return (
      <span className="inline-flex items-center rounded-lg bg-primary/20 dark:bg-dark-primary/30 px-2 py-0.5 text-xs font-medium text-primary dark:text-dark-primary">
        Pro
      </span>
    );
  }
  if (plan === 'BUSINESS') {
    return (
      <span className="inline-flex items-center rounded-lg bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-600 dark:text-purple-400">
        Business
      </span>
    );
  }
  if (status === 'EXPIRED' || status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center rounded-lg bg-danger/20 px-2 py-0.5 text-xs font-medium text-danger">
        Expired
      </span>
    );
  }
  const days = trialDaysRemaining ?? 0;
  return (
    <span className="inline-flex items-center rounded-lg bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
      Trial{days > 0 ? ` - ${days} days left` : ''}
    </span>
  );
}
