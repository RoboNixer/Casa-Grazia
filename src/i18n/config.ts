export const LOCALES = ['hr', 'en', 'it', 'de'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'hr';
export const LOCALE_COOKIE = 'cg-lang';

export const LOCALE_LABELS: Record<Locale, { native: string; short: string; flag: string }> = {
  hr: { native: 'Hrvatski', short: 'HR', flag: '🇭🇷' },
  en: { native: 'English', short: 'EN', flag: '🇬🇧' },
  it: { native: 'Italiano', short: 'IT', flag: '🇮🇹' },
  de: { native: 'Deutsch', short: 'DE', flag: '🇩🇪' },
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as readonly string[]).includes(v);
}
