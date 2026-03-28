import { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  FileText,
  CreditCard,
  Receipt,
  Settings,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Star,
  Tag,
} from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore } from '../store/theme-store';
import { useSubscriptionStore } from '../store/subscription-store';
import { useLanguageStore } from '../store/language-store';
import { getInitials } from '../lib/avatar';
import PlanBadge from './PlanBadge';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/analytics', icon: BarChart3, labelKey: 'nav.analytics' },
  { to: '/clients', icon: Users, labelKey: 'nav.clients' },
  { to: '/invoices', icon: FileText, labelKey: 'nav.invoices' },
  { to: '/payments', icon: CreditCard, labelKey: 'nav.payments' },
  { to: '/expenses', icon: Receipt, labelKey: 'nav.expenses' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
] as const;

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { plan, status, fetchSubscriptionStatus } = useSubscriptionStore();
  const { language } = useLanguageStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  const showUpgrade = plan === 'TRIAL' || status === 'EXPIRED' || status === 'CANCELLED';
  const isRTL = language === 'ar';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-background dark:bg-dark-bg transition-colors duration-300">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 z-50 w-[260px] bg-sidebar dark:bg-dark-sidebar flex flex-col transition-transform duration-300 ease-out ${
          isRTL
            ? `right-0 border-l border-border dark:border-dark-border lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`
            : `left-0 border-r border-border dark:border-dark-border lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-border dark:border-dark-border">
          <span className="text-xl font-bold text-primary dark:text-dark-primary tracking-tight">
            FreelanceFlow
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {showUpgrade && (
            <Link
              to="/pricing"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-primary dark:text-dark-primary hover:bg-primary/10 dark:hover:bg-dark-primary/20 transition-colors mb-2"
              onClick={() => setSidebarOpen(false)}
            >
              <Star className="h-5 w-5 shrink-0" />
              <span>{t('nav.upgrade')}</span>
            </Link>
          )}
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isRTL ? 'border-r-4' : 'border-l-4'} ${
                  isActive
                    ? 'bg-primary/10 dark:bg-dark-primary/20 text-primary dark:text-dark-primary border-primary dark:border-dark-primary'
                    : 'border-transparent text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg hover:text-text-primary dark:hover:text-dark-text'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border dark:border-dark-border space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-10 w-10 rounded-full bg-primary/20 dark:bg-dark-primary/30 flex items-center justify-center text-sm font-semibold text-primary dark:text-dark-primary shrink-0">
              {getInitials(user?.name ?? 'G')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-text-primary dark:text-dark-text truncate">{user?.name ?? 'Guest'}</p>
              {user?.businessName && (
                <p className="text-xs text-text-secondary dark:text-dark-muted truncate">{user.businessName}</p>
              )}
              <div className="mt-1">
                <PlanBadge />
              </div>
            </div>
          </div>
          <Link
            to="/pricing"
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <Tag className="h-5 w-5" />
            <span>{t('nav.pricing')}</span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-text-secondary dark:text-dark-muted bg-background dark:bg-dark-bg hover:bg-border dark:hover:bg-dark-border transition-colors"
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
          </button>
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-text-secondary dark:text-dark-muted">{t('settings.language')}</span>
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('nav.logout')}</span>
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col ${isRTL ? 'lg:pr-[260px]' : 'lg:pl-[260px]'}`}>
        <header className="h-14 px-4 flex items-center justify-between border-b border-border dark:border-dark-border bg-card dark:bg-dark-card lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg"
            aria-label="Open sidebar"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-sm font-medium text-text-primary dark:text-dark-text">Menu</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
