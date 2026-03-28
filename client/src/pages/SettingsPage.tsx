import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Upload, X } from 'lucide-react';
import { useAuthStore } from '../store/auth-store';
import { useSubscriptionStore } from '../store/subscription-store';
import { getSettings, updateProfile, updatePassword, uploadLogo, deleteLogo, type SettingsProfile } from '../services/settings-service';
import { getInitials } from '../lib/avatar';
import { format } from 'date-fns';
import LanguageSwitcher from '../components/LanguageSwitcher';
import type { Currency } from 'shared';

export default function SettingsPage() {
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [nameError, setNameError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { plan, fetchSubscriptionStatus } = useSubscriptionStore();
  const { t } = useTranslation();

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [fetchSubscriptionStatus]);

  useEffect(() => {
    getSettings()
      .then((data) => {
        setProfile(data);
        setName(data.name);
        setBusinessName(data.businessName ?? '');
        setCurrency(data.currency as Currency);
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setProfileLoading(false));
  }, []);

  const onProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setNameError('Name must be at least 2 characters');
      return;
    }
    setNameError('');
    setProfileSaving(true);
    try {
      const updated = await updateProfile({
        name: trimmedName,
        businessName: businessName.trim() || undefined,
        currency,
      });
      setProfile((p) => (p ? { ...p, ...updated } : null));
      useAuthStore.setState({ user: updated });
      toast.success('Profile updated');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to update profile';
      toast.error(message ?? 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }
    if (!/\d/.test(newPassword)) {
      setPasswordError('New password must contain at least one number');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await updatePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to change password';
      toast.error(message ?? 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP files are allowed');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const updated = await uploadLogo(file);
      setProfile((p) => (p ? { ...p, logoUrl: updated.logoUrl } : null));
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Logo uploaded successfully');
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    setLogoUploading(true);
    try {
      const updated = await deleteLogo();
      setProfile((p) => (p ? { ...p, logoUrl: updated.logoUrl } : null));
      toast.success('Logo removed');
    } catch {
      toast.error('Failed to remove logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const cancelLogoPreview = () => {
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (profileLoading) {
    return (
      <div className="space-y-6 max-w-xl">
        <div className="h-8 w-48 rounded-xl bg-border dark:bg-dark-border animate-shimmer" />
        <div className="h-64 rounded-2xl bg-border dark:bg-dark-border animate-shimmer" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-text-secondary dark:text-dark-muted">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-text-primary dark:text-dark-text mb-4">{t('settings.profile')}</h2>
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div
            className="flex-shrink-0 w-20 h-20 rounded-full bg-primary/20 dark:bg-dark-primary/30 flex items-center justify-center text-2xl font-semibold text-primary dark:text-dark-primary"
            aria-hidden
          >
            {profile ? getInitials(profile.name) : '?'}
          </div>
          <form onSubmit={onProfileSubmit} className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('settings.full_name')}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary focus:border-transparent"
                placeholder="Your name"
              />
              {nameError && <p className="mt-1 text-sm text-danger">{nameError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('settings.email')}</label>
              <input
                type="email"
                readOnly
                value={profile?.email ?? ''}
                className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-secondary dark:text-dark-muted px-3 py-2 text-sm cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('settings.business_name')}</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
                placeholder="Your business name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('settings.currency')}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="MAD">MAD</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={profileSaving}
              className="inline-flex items-center justify-center rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition active:scale-[0.98]"
            >
              {profileSaving ? t('common.saving') : t('settings.save_profile')}
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-text-primary dark:text-dark-text mb-4">{t('settings.password')}</h2>
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('settings.current_password')}</label>
            <input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('settings.new_password')}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-dark-text mb-1">{t('settings.confirm_password')}</label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full rounded-xl border border-border dark:border-dark-border bg-background dark:bg-dark-bg text-text-primary dark:text-dark-text px-3 py-2 text-sm focus:ring-2 focus:ring-primary dark:focus:ring-dark-primary"
              placeholder="••••••••"
            />
            {passwordError && <p className="mt-1 text-sm text-danger">{passwordError}</p>}
          </div>
          <button
            type="submit"
            disabled={passwordSaving}
            className="inline-flex items-center justify-center rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {passwordSaving ? t('common.updating') : t('settings.change_password')}
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-text-primary dark:text-dark-text mb-4">{t('settings.company_logo')}</h2>
        <p className="text-sm text-text-secondary dark:text-dark-muted mb-4">{t('settings.logo_hint')}</p>
        
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {(logoPreview || profile?.logoUrl) ? (
            <div className="relative w-36 h-16 rounded-xl border border-border dark:border-dark-border overflow-hidden bg-background dark:bg-dark-bg flex items-center justify-center">
              <img
                src={logoPreview || `${apiBaseUrl}${profile?.logoUrl}`}
                alt="Company logo"
                className="max-w-full max-h-full object-contain"
              />
              {!logoPreview && profile?.logoUrl && (
                <button
                  type="button"
                  onClick={handleLogoDelete}
                  disabled={logoUploading}
                  className="absolute top-1 right-1 p-1 rounded-full bg-danger/80 text-white hover:bg-danger transition-colors"
                  title="Remove logo"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ) : (
            <div className="w-36 h-16 rounded-xl border-2 border-dashed border-border dark:border-dark-border flex items-center justify-center">
              <span className="text-xs text-text-secondary dark:text-dark-muted">{t('settings.no_logo')}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleLogoSelect}
              className="hidden"
            />
            {logoPreview ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  disabled={logoUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary dark:bg-dark-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition"
                >
                  {logoUploading ? t('common.saving') : t('common.save')}
                </button>
                <button
                  type="button"
                  onClick={cancelLogoPreview}
                  disabled={logoUploading}
                  className="inline-flex items-center gap-2 rounded-xl border border-border dark:border-dark-border px-4 py-2 text-sm font-medium text-text-secondary dark:text-dark-muted hover:bg-background dark:hover:bg-dark-bg transition"
                >
                  {t('common.cancel')}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={logoUploading}
                className="inline-flex items-center gap-2 rounded-xl border border-border dark:border-dark-border px-4 py-2 text-sm font-medium text-text-primary dark:text-dark-text hover:bg-background dark:hover:bg-dark-bg transition"
              >
                <Upload className="h-4 w-4" />
                {t('settings.upload_logo')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-text-primary dark:text-dark-text mb-4">{t('settings.language')}</h2>
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-secondary dark:text-dark-muted">{t('settings.language')}</p>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="rounded-2xl border border-border dark:border-dark-border bg-card dark:bg-dark-card p-6 shadow-sm">
        <h2 className="text-lg font-medium text-text-primary dark:text-dark-text mb-4">{t('settings.account')}</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-secondary dark:text-dark-muted">{t('settings.member_since')}</dt>
            <dd className="text-text-primary dark:text-dark-text">
              {profile?.createdAt ? format(new Date(profile.createdAt), 'MMM d, yyyy') : '—'}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary dark:text-dark-muted">{t('settings.account_type')}</dt>
            <dd className="text-text-primary dark:text-dark-text">{plan === 'TRIAL' ? 'Free Trial' : plan}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
