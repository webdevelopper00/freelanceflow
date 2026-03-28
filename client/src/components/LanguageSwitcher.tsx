import { useLanguageStore } from '../store/language-store';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ar', label: 'AR' },
] as const;

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="flex gap-1">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => setLanguage(lang.code)}
          className={`px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
            language === lang.code
              ? 'bg-primary dark:bg-dark-primary text-white'
              : 'bg-background dark:bg-dark-bg text-text-secondary dark:text-dark-muted hover:bg-border dark:hover:bg-dark-border'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
