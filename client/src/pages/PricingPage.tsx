import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Lock, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth-store';
import { useSubscriptionStore } from '../store/subscription-store';
import { upgradeSubscription } from '../services/subscription-service';

export default function PricingPage() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { plan, status, trialUsed, fetchSubscriptionStatus } = useSubscriptionStore();
  const [upgrading, setUpgrading] = useState<'PRO' | 'BUSINESS' | null>(null);

  useEffect(() => {
    if (isAuthenticated) fetchSubscriptionStatus();
  }, [isAuthenticated, fetchSubscriptionStatus]);

  async function handleUpgrade(toPlan: 'PRO' | 'BUSINESS') {
    setUpgrading(toPlan);
    try {
      await upgradeSubscription(toPlan);
      toast.success(`Upgraded to ${toPlan}!`);
      fetchSubscriptionStatus();
      navigate('/dashboard');
    } catch {
      toast.error('Upgrade failed. Please try again.');
    } finally {
      setUpgrading(null);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text">Simple pricing</h1>
        <p className="mt-2 text-text-secondary dark:text-dark-muted">Choose the plan that fits your business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Trial */}
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text">Free Trial</h2>
          <p className="mt-1 text-2xl font-bold text-text-primary dark:text-dark-text">$0</p>
          <p className="text-sm text-text-secondary dark:text-dark-muted">for 7 days</p>
          <ul className="mt-6 space-y-3 flex-1">
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Up to 3 clients
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Up to 5 invoices/month
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Basic dashboard
            </li>
            <li className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-muted">
              <Lock className="h-4 w-4 shrink-0" /> PDF download
            </li>
            <li className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-muted">
              <Lock className="h-4 w-4 shrink-0" /> Analytics
            </li>
            <li className="flex items-center gap-2 text-sm text-text-secondary dark:text-dark-muted">
              <Lock className="h-4 w-4 shrink-0" /> Unlimited invoices
            </li>
          </ul>
          <div className="mt-6">
            {isAuthenticated && trialUsed ? (
              <button
                type="button"
                disabled
                className="w-full py-2.5 rounded-xl border border-border dark:border-dark-border text-text-secondary dark:text-dark-muted font-medium cursor-not-allowed"
              >
                Trial used
              </button>
            ) : isAuthenticated ? (
              <span className="block w-full py-2.5 rounded-xl border border-border dark:border-dark-border text-center text-text-secondary dark:text-dark-muted font-medium">
                Current plan
              </span>
            ) : (
              <Link
                to="/register"
                className="block w-full py-2.5 rounded-xl border border-primary dark:border-dark-primary text-primary dark:text-dark-primary font-medium text-center hover:bg-primary/5 dark:hover:bg-dark-primary/10 transition-colors"
              >
                Start free trial
              </Link>
            )}
          </div>
        </div>

        {/* Pro - highlighted */}
        <div className="rounded-2xl border-2 border-primary dark:border-dark-primary bg-card dark:bg-dark-card p-6 shadow-lg flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary dark:bg-dark-primary px-3 py-0.5 text-xs font-medium text-white">
              <Star className="h-3 w-3" /> Most popular
            </span>
          </div>
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text">Pro</h2>
          <p className="mt-1 text-2xl font-bold text-text-primary dark:text-dark-text">$9</p>
          <p className="text-sm text-text-secondary dark:text-dark-muted">/month</p>
          <ul className="mt-6 space-y-3 flex-1">
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Unlimited clients
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Unlimited invoices
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> PDF download
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Full Analytics
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> All features
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Email support
            </li>
          </ul>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => handleUpgrade('PRO')}
              disabled={upgrading !== null || (plan === 'PRO' && status === 'ACTIVE')}
              className="mt-6 w-full py-2.5 rounded-xl bg-primary dark:bg-dark-primary text-white font-medium hover:opacity-90 disabled:opacity-50 transition-colors active:scale-[0.98]"
            >
              {upgrading === 'PRO' ? 'Upgrading…' : plan === 'PRO' && status === 'ACTIVE' ? 'Current plan' : 'Upgrade to Pro'}
            </button>
          ) : (
            <Link
              to="/login"
              className="mt-6 block w-full py-2.5 rounded-xl bg-primary dark:bg-dark-primary text-white font-medium text-center hover:opacity-90 transition-colors"
            >
              Log in to upgrade
            </Link>
          )}
        </div>

        {/* Business */}
        <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm flex flex-col">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text">Business</h2>
          <p className="mt-1 text-2xl font-bold text-text-primary dark:text-dark-text">$79</p>
          <p className="text-sm text-text-secondary dark:text-dark-muted">/year</p>
          <ul className="mt-6 space-y-3 flex-1">
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Everything in Pro
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Priority support
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Advanced reports
            </li>
            <li className="flex items-center gap-2 text-sm text-text-primary dark:text-dark-text">
              <Check className="h-4 w-4 text-success shrink-0" /> Early access to features
            </li>
          </ul>
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => handleUpgrade('BUSINESS')}
              disabled={upgrading !== null || (plan === 'BUSINESS' && status === 'ACTIVE')}
              className="mt-6 w-full py-2.5 rounded-xl bg-purple-600 dark:bg-purple-500 text-white font-medium hover:opacity-90 disabled:opacity-50 transition-colors active:scale-[0.98]"
            >
              {upgrading === 'BUSINESS' ? 'Upgrading…' : plan === 'BUSINESS' && status === 'ACTIVE' ? 'Current plan' : 'Upgrade to Business'}
            </button>
          ) : (
            <Link
              to="/login"
              className="mt-6 block w-full py-2.5 rounded-xl bg-purple-600 dark:bg-purple-500 text-white font-medium text-center hover:opacity-90 transition-colors"
            >
              Log in to upgrade
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
