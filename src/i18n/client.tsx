'use client';

import { createContext, useContext, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from './config';
import { getDictionary, type Dictionary } from './dictionaries';

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (l: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const t = useMemo(() => getDictionary(locale), [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t,
      setLocale: (next) => {
        // 1 year, root path so it applies to every route under (client) and admin
        // is unaffected because the cookie is only read by our i18n helpers.
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
        // Force RSC payload refresh so server components re-read the cookie
        // and re-render with the new dictionary.
        router.refresh();
      },
    }),
    [locale, t, router],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * Returns the active dictionary + locale. If used outside the provider
 * (e.g. admin code by accident), falls back to the default locale so the
 * component still renders something meaningful.
 */
export function useT(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;
  return {
    locale: DEFAULT_LOCALE,
    t: getDictionary(DEFAULT_LOCALE),
    setLocale: () => {
      /* no-op outside provider */
    },
  };
}
