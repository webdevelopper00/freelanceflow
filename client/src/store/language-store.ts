import { create } from 'zustand';
import i18n from '../lib/i18n';

const STORAGE_KEY = 'freelanceflow-language';

type Language = 'en' | 'fr' | 'ar';

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
}

function updateDocumentDirection(lang: Language) {
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
}

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'en' || stored === 'fr' || stored === 'ar') {
    return stored;
  }
  const browserLang = navigator.language.split('-')[0];
  if (browserLang === 'fr') return 'fr';
  if (browserLang === 'ar') return 'ar';
  return 'en';
}

const initialLang = getInitialLanguage();
updateDocumentDirection(initialLang);

export const useLanguageStore = create<LanguageState>((set) => ({
  language: initialLang,
  setLanguage: (lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
    i18n.changeLanguage(lang);
    updateDocumentDirection(lang);
    set({ language: lang });
  },
}));
