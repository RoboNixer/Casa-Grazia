import { cookies } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from './config';
import { getDictionary, type Dictionary } from './dictionaries';

export async function getLocale(): Promise<Locale> {
  const c = await cookies();
  const v = c.get(LOCALE_COOKIE)?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export async function getServerDictionary(): Promise<{
  locale: Locale;
  t: Dictionary;
}> {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
