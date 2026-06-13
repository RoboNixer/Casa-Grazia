import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Waves,
  Trees,
  Wifi,
  Tv,
  Snowflake,
  Utensils,
  Car,
  Flame,
  BedDouble,
  Bath,
  Users,
  MapPin,
  Phone,
  Languages,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StaggerContainer, StaggerItem, FadeUp } from '@/components/motion/FadeUp';
import { formatCurrency } from '@/lib/utils';
import type { SiteSettings, Property } from '@/types/database';
import { getServerDictionary } from '@/i18n/server';
import { translateContent } from '@/i18n/content';

const amenityIcons: Record<string, React.ElementType> = {
  bazen: Waves,
  vrt: Trees,
  wi: Wifi,
  sat: Tv,
  klima: Snowflake,
  kuhinja: Utensils,
  parking: Car,
  rošt: Flame,
  govori: Languages,
};

function iconFor(label: string): React.ElementType {
  const k = label.toLowerCase();
  for (const [needle, Icon] of Object.entries(amenityIcons)) {
    if (k.includes(needle)) return Icon;
  }
  return Sparkles;
}

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: propertiesData }, { t, locale }] = await Promise.all([
    supabase.from('site_settings').select('*').single(),
    supabase
      .from('properties')
      .select('*, images:property_images(*)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1),
    getServerDictionary(),
  ]);

  const siteSettings = settings as SiteSettings | null;
  const villa = (propertiesData?.[0] ?? null) as Property | null;
  const currencySymbol = siteSettings?.currency_symbol ?? '€';

  const heroImg =
    siteSettings?.hero_image_url ||
    villa?.images?.find((i) => i.is_cover)?.url ||
    villa?.images?.[0]?.url ||
    '/villa/casa-grazia-2.png';

  const galleryImgs = (villa?.images ?? []).slice(0, 6);

  // Italicise the last word of the villa name to echo the brand wordmark
  const villaName = (siteSettings?.hero_title ?? villa?.name ?? 'Casa Grazia').trim();
  const nameParts = villaName.split(' ');
  const nameLead = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : '';
  const nameAccent = nameParts[nameParts.length - 1];

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImg}
          alt={villaName}
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        {/* Warm Mediterranean tint instead of cold black */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/45 via-emerald-950/30 to-amber-950/65" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(110,231,183,0.18)_0%,transparent_70%)]" />

        <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 text-center">
          <p className="animate-fade-up font-mono text-[11px] tracking-[0.32em] uppercase text-emerald-200/80 mb-5">
            {t.header.tagline}
          </p>

          <h1 className="animate-fade-up font-display font-medium text-white text-6xl sm:text-7xl lg:text-8xl leading-[1.0] tracking-tight">
            {nameLead && <span>{nameLead} </span>}
            <span className="italic text-emerald-200">{nameAccent}</span>
          </h1>

          <p className="animate-fade-up delay-200 mt-7 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed font-light">
            {siteSettings?.hero_subtitle
              ? translateContent(siteSettings.hero_subtitle, locale)
              : t.home.hero.subtitle}
          </p>

          <div className="animate-fade-up delay-300 mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/book"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-ink font-medium text-[14.5px] hover:bg-emerald-700 hover:text-white active:scale-[0.97] transition-all shadow-lg shadow-black/20"
            >
              {t.home.hero.checkAvailability}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center px-7 py-3.5 rounded-full bg-white/10 backdrop-blur-sm text-white font-medium text-[14.5px] hover:bg-white/20 active:scale-[0.97] transition-all border border-white/25"
            >
              {t.home.hero.viewGallery}
            </Link>
          </div>

          {villa && (
            <div className="animate-fade-up delay-400 mt-10 inline-flex items-center divide-x divide-white/15 rounded-full bg-white/8 backdrop-blur-md border border-white/20 text-white/90 text-[11px] sm:text-[13px]">
              <span className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 whitespace-nowrap">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-200" />
                {villa.max_guests}
                <span className="hidden sm:inline">&nbsp;{t.home.hero.guestsLong}</span>
                <span className="sm:hidden">&nbsp;{t.home.hero.guestsShort}</span>
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 whitespace-nowrap">
                <BedDouble className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-200" />
                {villa.bedrooms}
                <span className="hidden sm:inline">&nbsp;{t.home.hero.bedroomsLong}</span>
                <span className="sm:hidden">&nbsp;{t.home.hero.bedroomsShort}</span>
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 whitespace-nowrap">
                <Bath className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-200" />
                {villa.bathrooms}
                <span className="hidden sm:inline">&nbsp;{t.home.hero.bathroomsLong}</span>
                <span className="sm:hidden">&nbsp;{t.home.hero.bathroomsShort}</span>
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── O vili ─────────────────────────────────────────────────────────── */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <FadeUp>
              <SectionLabel>{t.home.about.eyebrow}</SectionLabel>
              <SectionTitle lead={t.home.about.titleLead} accent={t.home.about.titleAccent} />
              <div className="mt-6 space-y-4 text-[15.5px] text-ink-muted leading-relaxed">
                <p>
                  {t.home.about.p1Before}
                  <strong className="text-ink">{t.home.about.p1Bold}</strong>
                  {t.home.about.p1After}
                </p>
                <p>
                  {t.home.about.p2Before}
                  <strong className="text-ink">{t.home.about.p2Bold1}</strong>
                  {t.home.about.p2Middle}
                  <strong className="text-ink">{t.home.about.p2Bold2}</strong>
                  {t.home.about.p2After}
                </p>
                <p>{t.home.about.p3}</p>
              </div>

              {villa && (
                <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
                  <Stat label={t.home.about.statGuests} value={`${villa.max_guests}`} />
                  <Stat label={t.home.about.statBedrooms} value={`${villa.bedrooms}`} />
                  <Stat label={t.home.about.statBathrooms} value={`${villa.bathrooms}`} />
                </div>
              )}
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="grid grid-cols-2 gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/villa/gallery-01.jpg"
                  alt={t.home.about.imgTerrace}
                  className="rounded-2xl object-cover aspect-[4/5] w-full shadow-premium"
                />
                <div className="space-y-3 pt-10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/villa/gallery-02.jpg"
                    alt={t.home.about.imgPool}
                    className="rounded-2xl object-cover aspect-square w-full shadow-premium"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/villa/gallery-03.jpg"
                    alt={t.home.about.imgCovered}
                    className="rounded-2xl object-cover aspect-[4/3] w-full shadow-premium"
                  />
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── Sadržaji / Amenities ───────────────────────────────────────────── */}
      {villa && villa.amenities?.length > 0 && (
        <section className="hero-mediterranean py-24 lg:py-32">
          <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <FadeUp className="text-center mb-14">
              <SectionLabel>{t.home.amenities.eyebrow}</SectionLabel>
              <SectionTitle lead={t.home.amenities.titleLead} accent={t.home.amenities.titleAccent} />
              <p className="mt-5 text-[15.5px] text-ink-muted max-w-xl mx-auto leading-relaxed">
                {t.home.amenities.subtitle}
              </p>
            </FadeUp>

            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {villa.amenities.map((amenity) => {
                // Icon detection runs on the original Croatian string so the
                // emoji/icon mapping stays stable regardless of UI language.
                const Icon = iconFor(amenity);
                const label = translateContent(amenity, locale);
                return (
                  <StaggerItem key={amenity}>
                    <div className="bg-white/75 backdrop-blur-sm rounded-2xl p-5 border border-emerald-900/[0.07] hover:border-emerald-700/30 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 h-full">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 mb-3 ring-1 ring-emerald-100">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <p className="text-[13.5px] font-semibold text-ink leading-snug">
                        {label}
                      </p>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* ── Galerija (preview) ─────────────────────────────────────────────── */}
      {galleryImgs.length > 0 && (
        <section className="py-24 lg:py-32 bg-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
            <FadeUp className="text-center mb-12">
              <SectionLabel>{t.home.gallery.eyebrow}</SectionLabel>
              <SectionTitle lead={t.home.gallery.titleLead} accent={t.home.gallery.titleAccent} />
            </FadeUp>

            <StaggerContainer className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {galleryImgs.map((img, i) => (
                <StaggerItem
                  key={img.id}
                  className={i === 0 ? 'col-span-2 row-span-2' : ''}
                >
                  <Link
                    href={`/gallery?img=${i}`}
                    className="block w-full h-full overflow-hidden rounded-2xl group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt_text || villaName}
                      className={`w-full ${i === 0 ? 'aspect-square' : 'aspect-[4/3]'} object-cover group-hover:scale-105 transition-transform duration-700`}
                    />
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>

            <div className="mt-12 text-center">
              <Link
                href="/gallery"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-ink/15 text-ink font-medium text-[14px] hover:border-emerald-700 hover:text-emerald-700 transition-all"
              >
                {t.home.gallery.viewAll}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Lokacija ──────────────────────────────────────────────────────── */}
      <section className="hero-mediterranean py-24 lg:py-32">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <FadeUp>
              <SectionLabel>{t.home.location.eyebrow}</SectionLabel>
              <SectionTitle lead={t.home.location.titleLead} accent={t.home.location.titleAccent} />
              <p className="mt-5 text-[15.5px] text-ink-muted leading-relaxed">
                {t.home.location.description}
              </p>

              <ul className="mt-8 space-y-3">
                <InfoRow
                  icon={MapPin}
                  label={siteSettings?.address ?? t.home.location.fallbackAddress}
                />
                {siteSettings?.phone && (
                  <InfoRow
                    icon={Phone}
                    label={siteSettings.phone}
                    href={`tel:${siteSettings.phone}`}
                  />
                )}
              </ul>

              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  href="/book"
                  className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-ink text-white font-medium text-[14.5px] hover:bg-emerald-700 active:scale-[0.97] transition-all"
                >
                  {t.home.location.book}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3.5 rounded-full bg-white/80 backdrop-blur-sm text-ink font-medium text-[14.5px] border border-emerald-900/[0.1] hover:border-emerald-700 hover:text-emerald-700 active:scale-[0.97] transition-all"
                >
                  {t.home.location.contact}
                </Link>
              </div>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="rounded-3xl overflow-hidden shadow-premium border border-emerald-900/[0.08] aspect-[4/3] bg-white">
                {siteSettings?.google_maps_url ? (
                  <iframe
                    src={siteSettings.google_maps_url}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`${t.home.location.mapTitle} ${villaName}`}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/villa/gallery-04.jpg"
                    alt={villaName}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="hero-mediterranean py-24 lg:py-32">
        <div className="relative z-10 mx-auto max-w-4xl px-5 sm:px-6 text-center">
          <FadeUp>
            <SectionLabel>{t.home.cta.eyebrow}</SectionLabel>
            <h2 className="font-display font-medium text-ink text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              {t.home.cta.stayLead}<br />
              <span className="italic text-emerald-700">{villaName}</span>
            </h2>
            <p className="mt-6 text-[15.5px] sm:text-base text-ink-muted max-w-xl mx-auto leading-relaxed">
              {t.home.cta.subtitle}
              {villa && (
                <>
                  {' '}{t.home.cta.priceFrom}{' '}
                  <span className="text-ink font-semibold">
                    {formatCurrency(villa.base_price, currencySymbol)}{t.home.cta.perNight}
                  </span>
                  .
                </>
              )}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/book"
                className="group inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-ink text-white font-medium text-[15px] hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-md"
              >
                {t.home.cta.bookNow}
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 rounded-full bg-white/80 backdrop-blur-sm text-ink font-medium text-[15px] hover:border-emerald-700 hover:text-emerald-700 active:scale-[0.97] transition-all border border-emerald-900/[0.1]"
              >
                {t.home.cta.contactUs}
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3 font-mono text-[10.5px] tracking-[0.28em] uppercase text-emerald-700 mb-4">
      <span className="h-px w-6 bg-emerald-700/50" />
      {children}
    </span>
  );
}

function SectionTitle({ lead, accent }: { lead: string; accent: string }) {
  return (
    <h2 className="font-display font-medium text-ink text-4xl sm:text-5xl tracking-tight leading-[1.05]">
      {lead}{' '}
      <span className="italic text-emerald-700">{accent}</span>
    </h2>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-900/[0.08] bg-white px-3 py-4 text-center shadow-sm">
      <p className="font-display text-3xl text-ink tracking-tight tabular-nums leading-none">
        {value}
      </p>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint mt-2">
        {label}
      </p>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href?: string;
}) {
  const inner = (
    <div className="flex items-start gap-3 text-[14px] text-ink">
      <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 flex-shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <span className="pt-1.5 leading-snug">{label}</span>
    </div>
  );
  return href ? (
    <li>
      <a href={href} className="hover:text-emerald-700 transition-colors block">
        {inner}
      </a>
    </li>
  ) : (
    <li>{inner}</li>
  );
}
