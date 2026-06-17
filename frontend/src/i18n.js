import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import fr from './locales/fr.json';

const STORAGE_KEY = 'gid_lang';
const SUPPORTED = ['ar', 'fr'];

// Read persisted preference — language choice is a UI preference (not
// security-sensitive), so localStorage is appropriate here, unlike the
// session token which is stored in memory only.
function get_initial_lang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
  } catch {
    // localStorage unavailable (private browsing strict mode) — fall through
  }
  return 'ar'; // default: Arabic
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
    },
    lng: get_initial_lang(),
    fallbackLng: 'ar',
    interpolation: {
      // React already escapes values
      escapeValue: false,
    },
  });

// Sync document dir and persist preference whenever language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore
  }
});

// Apply immediately on load
document.documentElement.lang = i18n.language;
document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

export default i18n;

export function toggle_lang() {
  const next = i18n.language === 'ar' ? 'fr' : 'ar';
  i18n.changeLanguage(next);
}

export function current_lang() {
  return i18n.language;
}
