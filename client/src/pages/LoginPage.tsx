import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff, Check, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/auth-store';
import { useThemeStore } from '../store/theme-store';
import LanguageSwitcher from '../components/LanguageSwitcher';

const FEATURES = [
  'Manage clients & invoices',
  'Track payments & expenses',
  'Powerful analytics',
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter email and password');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err &&
        err.response && typeof err.response === 'object' && 'data' in err.response &&
        typeof (err.response as { data?: { message?: string } }).data?.message === 'string'
          ? (err.response as { data: { message: string } }).data.message
          : 'Login failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background dark:bg-dark-bg">
      {/* Left: gradient + branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#0C1A2E] via-[#0F2744] to-[#06B6D4] overflow-hidden">
        {/* Floating shapes */}
        <div className="absolute inset-0">
          <div className="absolute top-[20%] left-[10%] w-20 h-20 rounded-2xl bg-white/5 animate-[float_8s_ease-in-out_infinite]" />
          <div className="absolute top-[60%] left-[70%] w-16 h-16 rounded-full bg-white/5 animate-[float_10s_ease-in-out_infinite]" style={{ animationDelay: '-2s' }} />
          <div className="absolute top-[40%] right-[15%] w-24 h-24 border border-white/10 rounded-lg animate-[float_12s_ease-in-out_infinite]" style={{ animationDelay: '-4s' }} />
          <div className="absolute bottom-[25%] left-[25%] w-12 h-12 rounded-full bg-cyan-400/10 animate-[float_7s_ease-in-out_infinite]" style={{ animationDelay: '-1s' }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-14 text-white">
          <h1 className="text-4xl font-bold tracking-tight">FreelanceFlow</h1>
          <p className="mt-5 text-lg text-sky-100/90 max-w-sm">
            Your freelance business, simplified.
          </p>
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

      {/* Right: form card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 py-12 bg-card dark:bg-dark-card border-l border-border dark:border-dark-border relative">
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
          <h2 className="text-2xl font-semibold text-text-primary dark:text-dark-text">{t('auth.sign_in')}</h2>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
            {t('auth.sign_in_subtitle')}
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-dark-text">
                {t('auth.email')}
              </label>
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
                  className="block w-full pl-10 pr-3 py-3 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text placeholder:text-text-secondary dark:placeholder:text-dark-muted focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-dark-primary transition duration-300"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-primary dark:text-dark-text">
                {t('auth.password')}
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary dark:text-dark-muted">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text placeholder:text-text-secondary dark:placeholder:text-dark-muted focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-dark-primary transition duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary hover:text-text-primary dark:text-dark-muted dark:hover:text-dark-text"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-primary hover:bg-primary-dark dark:bg-dark-primary dark:hover:opacity-90 shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition duration-300 active:scale-[0.98]"
            >
              {isSubmitting ? t('common.loading') : t('auth.sign_in_button')}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-text-secondary dark:text-dark-muted">
            {t('auth.no_account')}{' '}
            <Link to="/register" className="font-medium text-primary hover:text-primary-dark dark:text-dark-primary dark:hover:text-accent">
              {t('auth.create_one')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
