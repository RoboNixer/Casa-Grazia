import type { Locale } from '../config';
import hr from './hr';
import en from './en';
import it from './it';
import de from './de';

export type Dictionary = typeof hr;

const dictionaries: Record<Locale, Dictionary> = {
  hr,
  en: en as unknown as Dictionary,
  it: it as unknown as Dictionary,
  de: de as unknown as Dictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.hr;
}
