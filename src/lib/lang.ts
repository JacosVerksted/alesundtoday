export type Lang = 'en' | 'nb' | 'nn' | 'de' | 'nl' | 'fr';

const VALID: Lang[] = ['en', 'nb', 'nn', 'de', 'nl', 'fr'];

/** Pick the first browser language we support; Norwegian "no" maps to Bokmål. */
export function detectLang(): Lang {
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const raw of prefs) {
    const l = (raw ?? '').toLowerCase();
    if (l === 'no' || l.startsWith('no-') || l.startsWith('nb')) return 'nb';
    if (l.startsWith('nn')) return 'nn';
    for (const code of ['de', 'nl', 'fr', 'en'] as const) {
      if (l === code || l.startsWith(code + '-')) return code;
    }
  }
  return 'en';
}

/** The visitor's explicit choice if they made one, otherwise their browser language. */
export function getLang(): Lang {
  try {
    const stored = localStorage.getItem('lang');
    if (stored && (VALID as string[]).includes(stored)) return stored as Lang;
  } catch { /* storage blocked */ }
  return detectLang();
}
