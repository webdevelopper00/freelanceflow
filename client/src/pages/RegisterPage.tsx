import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Building2, Check, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore } from '../store/theme-store';
import LanguageSwitcher from '../components/LanguageSwitcher';

const CURRENCIES = ['MAD', 'USD', 'EUR', 'GBP'] as const;
const FEATURES = [
  'Manage clients & invoices',
  'Track payments & expenses',
  'Powerful analytics',
];

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState<string>('USD');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();

  function validate(): boolean {
    const next: FieldErrors = {};
    if (name.trim().length < 2) next.name = 'Name must be at least 2 characters';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) next.email = 'Invalid email address';
    if (password.length < 8) next.password = 'Password must be at least 8 characters';
    else if (!/\d/.test(password)) next.password = 'Password must contain at least one number';
    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        businessName: businessName.trim() || undefined,
        currency,
      });
      toast.success('Account created successfully');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err &&
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        typeof (err.response as { data?: { message?: string } }).data?.message === 'string'
          ? (err.response as { data: { message: string } }).data.message
          : 'Registration failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background dark:bg-dark-bg">
      {/* Left: gradient + branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#0C1A2E] via-[#0F2744] to-[#06B6D4] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-[20%] left-[10%] w-20 h-20 rounded-2xl bg-white/5 animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute top-[60%] left-[70%] w-16 h-16 rounded-full bg-white/5 animate-[float_10s_ease-in-out_infinite]" style={{ animationDelay: '-2s' }} />
          <div className="absolute top-[40%] right-[15%] w-24 h-24 border border-white/10 rounded-lg animate-[float_12s_ease-in-out_infinite]" style={{ animationDelay: '-4s' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-14 text-white">
          <h1 className="text-4xl font-bold tracking-tight">FreelanceFlow</h1>
          <p className="mt-5 text-lg text-sky-100/90 max-w-sm">{t('auth.tagline')}</p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map((text, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-sky-50/95">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 bg-card dark:bg-dark-card border-l border-border dark:border-dark-border overflow-auto relative">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-text-secondary dark:text-dark-muted hover:bg-border dark:hover:bg-dark-border transition-colors"
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-text-primary dark:text-dark-text">Create account</h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">Enter your details to get started.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary dark:text-dark-text">{t('auth.full_name')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text placeholder:text-text-secondary dark:placeholder:text-dark-muted focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent transition duration-300"
                  placeholder="John Doe"
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-danger">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-dark-text">{t('auth.email')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text placeholder:text-text-secondary dark:placeholder:text-dark-muted focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent transition duration-300"
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-danger">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary dark:text-dark-text">{t('auth.password')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text placeholder:text-text-secondary dark:placeholder:text-dark-muted focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent transition duration-300"
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-danger">{errors.password}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary dark:text-dark-text">{t('auth.confirm_password')}</label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text placeholder:text-text-secondary dark:placeholder:text-dark-muted focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent transition duration-300"
                  placeholder="••••••••"
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-danger">{errors.confirmPassword}</p>}
            </div>
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-text-primary dark:text-dark-text">{t('auth.business_name')} <span className="text-text-secondary dark:text-dark-muted">({t('common.optional')})</span></label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                  <Building2 className="h-5 w-5" />
                </div>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text placeholder:text-text-secondary dark:placeholder:text-dark-muted focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent transition duration-300"
                  placeholder="My Agency"
                />
              </div>
            </div>
            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-text-primary dark:text-dark-text">{t('common.currency')}</label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 block w-full py-3 px-3 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent transition duration-300"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-dark dark:bg-dark-primary dark:hover:opacity-90 shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition duration-300 mt-6 active:scale-[0.98]"
            >
              {isSubmitting ? t('common.loading') : t('auth.register')}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-text-secondary dark:text-dark-muted">
            {t('auth.have_account')}{' '}
            <Link to="/login" className="font-medium text-primary hover:text-primary-dark dark:text-dark-primary dark:hover:text-accent">{t('auth.sign_in_link')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
