import type { Locale } from './config';

/* ─────────────────────────────────────────────────────────────────────────────
 * Translations for admin-managed DB content (site_settings.site_description,
 * site_settings.hero_subtitle, properties.amenities[]).
 *
 * The admin UI stays untouched, so these strings live in Croatian in the DB.
 * When the active locale is not Croatian we look them up here and fall back
 * to the original text if a translation isn't registered.
 *
 * Keys are matched after trimming + collapsing whitespace, so minor edits to
 * the seed (extra spaces, accidental newlines) still resolve correctly.
 * ───────────────────────────────────────────────────────────────────────── */

function normaliseKey(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

type Map = Record<string, string>;

// ── Amenities — exact-match strings from the seed ─────────────────────────
const AMENITIES_EN: Map = {
  'Privatni bazen': 'Private pool',
  'Vlastiti vrt': 'Private garden',
  'Vrtna garnitura': 'Garden furniture',
  'Roštilj na korištenje': 'BBQ available',
  'Klima uređaj': 'Air conditioning',
  'Besplatan Wi-Fi': 'Free Wi-Fi',
  'SAT-TV': 'Satellite TV',
  'Potpuno opremljena kuhinja': 'Fully equipped kitchen',
  'Perilica suđa': 'Dishwasher',
  'Natkrivena terasa': 'Covered terrace',
  'Privatni parking': 'Private parking',
  'Domaćin govori engleski': 'Host speaks English',
  'Domaćin govori njemački': 'Host speaks German',
  'Domaćin govori talijanski': 'Host speaks Italian',
  'Kućni ljubimci nisu dozvoljeni': 'Pets not allowed',
};

const AMENITIES_IT: Map = {
  'Privatni bazen': 'Piscina privata',
  'Vlastiti vrt': 'Giardino privato',
  'Vrtna garnitura': 'Mobili da giardino',
  'Roštilj na korištenje': 'Barbecue a disposizione',
  'Klima uređaj': 'Aria condizionata',
  'Besplatan Wi-Fi': 'Wi-Fi gratuito',
  'SAT-TV': 'TV satellitare',
  'Potpuno opremljena kuhinja': 'Cucina completamente attrezzata',
  'Perilica suđa': 'Lavastoviglie',
  'Natkrivena terasa': 'Terrazza coperta',
  'Privatni parking': 'Parcheggio privato',
  'Domaćin govori engleski': 'Il padrone di casa parla inglese',
  'Domaćin govori njemački': 'Il padrone di casa parla tedesco',
  'Domaćin govori talijanski': 'Il padrone di casa parla italiano',
  'Kućni ljubimci nisu dozvoljeni': 'Animali domestici non ammessi',
};

const AMENITIES_DE: Map = {
  'Privatni bazen': 'Privater Pool',
  'Vlastiti vrt': 'Eigener Garten',
  'Vrtna garnitura': 'Gartenmöbel',
  'Roštilj na korištenje': 'Grill zur Nutzung',
  'Klima uređaj': 'Klimaanlage',
  'Besplatan Wi-Fi': 'Kostenloses WLAN',
  'SAT-TV': 'Sat-TV',
  'Potpuno opremljena kuhinja': 'Voll ausgestattete Küche',
  'Perilica suđa': 'Geschirrspüler',
  'Natkrivena terasa': 'Überdachte Terrasse',
  'Privatni parking': 'Privatparkplatz',
  'Domaćin govori engleski': 'Gastgeber spricht Englisch',
  'Domaćin govori njemački': 'Gastgeber spricht Deutsch',
  'Domaćin govori talijanski': 'Gastgeber spricht Italienisch',
  'Kućni ljubimci nisu dozvoljeni': 'Haustiere nicht erlaubt',
};

// ── Hero subtitle (site_settings.hero_subtitle) ──────────────────────────
const HERO_SUBTITLE_HR =
  'Vila s privatnim bazenom u srcu Istre — savršen bijeg za 4 + 1 osobu, samo 8 minuta od Rovinja.';

const HERO_SUBTITLE_EN =
  'A villa with a private pool in the heart of Istria — the perfect getaway for 4 + 1 guests, only 8 minutes from Rovinj.';
const HERO_SUBTITLE_IT =
  'Una villa con piscina privata nel cuore dell’Istria — la fuga perfetta per 4 + 1 persone, a soli 8 minuti da Rovigno.';
const HERO_SUBTITLE_DE =
  'Eine Villa mit privatem Pool im Herzen Istriens — die perfekte Auszeit für 4 + 1 Gäste, nur 8 Minuten von Rovinj entfernt.';

// ── Site description (site_settings.site_description) ────────────────────
const SITE_DESC_HR =
  'Casa Grazia je ugodna obiteljska kuća za odmor s bazenom u srcu Istre — samo 8 minuta vožnje od Rovinja. Smještaj za 4 + 1 osobu, okružen maslinikom i idiličnim krajolikom.';

const SITE_DESC_EN =
  'Casa Grazia is a cosy family holiday home with a pool in the heart of Istria — only an 8-minute drive from Rovinj. Accommodation for 4 + 1 guests, surrounded by olive groves and an idyllic landscape.';
const SITE_DESC_IT =
  'Casa Grazia è un’accogliente casa vacanze per famiglie con piscina nel cuore dell’Istria — a soli 8 minuti d’auto da Rovigno. Soggiorno per 4 + 1 persone, circondata da oliveti e da un paesaggio idilliaco.';
const SITE_DESC_DE =
  'Casa Grazia ist ein gemütliches Familien-Ferienhaus mit Pool im Herzen Istriens — nur 8 Autominuten von Rovinj entfernt. Unterkunft für 4 + 1 Gäste, umgeben von Olivenhainen und einer idyllischen Landschaft.';

// ── Per-locale aggregate lookup ──────────────────────────────────────────
const TABLES: Record<Exclude<Locale, 'hr'>, Map> = {
  en: {
    ...AMENITIES_EN,
    [HERO_SUBTITLE_HR]: HERO_SUBTITLE_EN,
    [SITE_DESC_HR]: SITE_DESC_EN,
  },
  it: {
    ...AMENITIES_IT,
    [HERO_SUBTITLE_HR]: HERO_SUBTITLE_IT,
    [SITE_DESC_HR]: SITE_DESC_IT,
  },
  de: {
    ...AMENITIES_DE,
    [HERO_SUBTITLE_HR]: HERO_SUBTITLE_DE,
    [SITE_DESC_HR]: SITE_DESC_DE,
  },
};

/**
 * Translate an admin-managed Croatian string to the active locale.
 * Returns the original string when locale is `hr` or no translation exists,
 * so newly added DB strings don't crash the page.
 */
export function translateContent(text: string | null | undefined, locale: Locale): string {
  if (!text) return '';
  if (locale === 'hr') return text;
  const key = normaliseKey(text);
  const table = TABLES[locale];
  return table[key] ?? text;
}
