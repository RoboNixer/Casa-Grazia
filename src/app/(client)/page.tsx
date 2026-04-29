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

  const [{ data: settings }, { data: propertiesData }] = await Promise.all([
    supabase.from('site_settings').select('*').single(),
    supabase
      .from('properties')
      .select('*, images:property_images(*)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1),
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
            Villa · Istra
          </p>

          <h1 className="animate-fade-up font-display font-medium text-white text-6xl sm:text-7xl lg:text-8xl leading-[1.0] tracking-tight">
            {nameLead && <span>{nameLead} </span>}
            <span className="italic text-emerald-200">{nameAccent}</span>
          </h1>

          <p className="animate-fade-up delay-200 mt-7 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed font-light">
            {siteSettings?.hero_subtitle ??
              'Vila s privatnim bazenom u srcu Istre — savršen bijeg za 4 + 1 osobu, samo 8 minuta od Rovinja.'}
          </p>

          <div className="animate-fade-up delay-300 mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/book"
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-white text-ink font-medium text-[14.5px] hover:bg-emerald-700 hover:text-white active:scale-[0.97] transition-all shadow-lg shadow-black/20"
            >
              Provjeri dostupnost
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center px-7 py-3.5 rounded-full bg-white/10 backdrop-blur-sm text-white font-medium text-[14.5px] hover:bg-white/20 active:scale-[0.97] transition-all border border-white/25"
            >
              Pogledaj galeriju
            </Link>
          </div>

          {villa && (
            <div className="animate-fade-up delay-400 mt-10 inline-flex items-center divide-x divide-white/15 rounded-full bg-white/8 backdrop-blur-md border border-white/20 text-white/90 text-[11px] sm:text-[13px]">
              <span className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 whitespace-nowrap">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-200" />
                {villa.max_guests}
                <span className="hidden sm:inline">&nbsp;gostiju</span>
                <span className="sm:hidden">&nbsp;gost.</span>
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 whitespace-nowrap">
                <BedDouble className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-200" />
                {villa.bedrooms}
                <span className="hidden sm:inline">&nbsp;spavaće sobe</span>
                <span className="sm:hidden">&nbsp;sobe</span>
              </span>
              <span className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-5 py-1.5 sm:py-2.5 whitespace-nowrap">
                <Bath className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-200" />
                {villa.bathrooms}
                <span className="hidden sm:inline">&nbsp;kupaonice</span>
                <span className="sm:hidden">&nbsp;kup.</span>
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
              <SectionLabel>O vili</SectionLabel>
              <SectionTitle lead="Istarska oaza okružena" accent="maslinikom" />
              <div className="mt-6 space-y-4 text-[15.5px] text-ink-muted leading-relaxed">
                <p>
                  Casa Grazia je ugodna obiteljska kuća za odmor, ukusno obnovljena 2017.
                  godine u tipičnom istarskom stilu. Smještena je u selu Rovinjsko Selo
                  i može primiti <strong className="text-ink">4 + 1 osobu</strong>.
                </p>
                <p>
                  Okružena je idiličnim krajolikom na <strong className="text-ink">2,5 hektara
                  zemlje</strong>, od čega <strong className="text-ink">1 hektar maslinika</strong>,
                  samo 8 minuta vožnje automobilom od živopisnog grada Rovinja.
                </p>
                <p>
                  Sastoji se od dvije spavaće sobe, dnevnog boravka, potpuno opremljene
                  kuhinje, dvije kupaonice, perilice suđa, klima uređaja, satelitske TV
                  i prostrane natkrivene terase s pogledom na maslinik.
                </p>
              </div>

              {villa && (
                <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
                  <Stat label="Gostiju" value={`${villa.max_guests}`} />
                  <Stat label="Spavaonica" value={`${villa.bedrooms}`} />
                  <Stat label="Kupaonica" value={`${villa.bathrooms}`} />
                </div>
              )}
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="grid grid-cols-2 gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/villa/casa-grazia-1.jpg"
                  alt="Terasa s pogledom na bazen"
                  className="rounded-2xl object-cover aspect-[4/5] w-full shadow-premium"
                />
                <div className="space-y-3 pt-10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/villa/casa-grazia-2.png"
                    alt="Privatni bazen"
                    className="rounded-2xl object-cover aspect-square w-full shadow-premium"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/villa/casa-grazia-4.jpg"
                    alt="Natkrivena terasa"
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
              <SectionLabel>Sadržaji</SectionLabel>
              <SectionTitle lead="Sve što vam treba za" accent="savršen odmor" />
              <p className="mt-5 text-[15.5px] text-ink-muted max-w-xl mx-auto leading-relaxed">
                Od privatnog bazena do potpuno opremljene kuhinje — pažljivo smo se
                pobrinuli za svaki detalj.
              </p>
            </FadeUp>

            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {villa.amenities.map((amenity) => {
                const Icon = iconFor(amenity);
                return (
                  <StaggerItem key={amenity}>
                    <div className="bg-white/75 backdrop-blur-sm rounded-2xl p-5 border border-emerald-900/[0.07] hover:border-emerald-700/30 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 h-full">
                      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 mb-3 ring-1 ring-emerald-100">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <p className="text-[13.5px] font-semibold text-ink leading-snug">
                        {amenity}
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
              <SectionLabel>Galerija</SectionLabel>
              <SectionTitle lead="Pogledajte" accent="izbliza" />
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
                Sve fotografije
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
              <SectionLabel>Lokacija</SectionLabel>
              <SectionTitle lead="Mir Rovinjskog Sela," accent="blizina Rovinja" />
              <p className="mt-5 text-[15.5px] text-ink-muted leading-relaxed">
                Vila se nalazi u mirnom istarskom selu, okružena maslinicima — a do
                centra Rovinja, plaža i restorana stižete autom za samo 8 minuta.
              </p>

              <ul className="mt-8 space-y-3">
                <InfoRow
                  icon={MapPin}
                  label={siteSettings?.address ?? 'Duranka 44, 52210 Rovinjsko Selo, Hrvatska'}
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
                  Rezerviraj
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3.5 rounded-full bg-white/80 backdrop-blur-sm text-ink font-medium text-[14.5px] border border-emerald-900/[0.1] hover:border-emerald-700 hover:text-emerald-700 active:scale-[0.97] transition-all"
                >
                  Kontakt
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
                    title={`Karta lokacije ${villaName}`}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src="/villa/casa-grazia-1.jpg"
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
            <SectionLabel>Spremni za odmor?</SectionLabel>
            <h2 className="font-display font-medium text-ink text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Vaš boravak u<br />
              <span className="italic text-emerald-700">{villaName}</span>
            </h2>
            <p className="mt-6 text-[15.5px] sm:text-base text-ink-muted max-w-xl mx-auto leading-relaxed">
              Rezervirajte svoje datume već danas. Bez online plaćanja —
              jednostavno platite pri dolasku.
              {villa && (
                <>
                  {' '}Cijena od{' '}
                  <span className="text-ink font-semibold">
                    {formatCurrency(villa.base_price, currencySymbol)}/noć
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
                Rezerviraj sada
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center px-8 py-4 rounded-full bg-white/80 backdrop-blur-sm text-ink font-medium text-[15px] hover:border-emerald-700 hover:text-emerald-700 active:scale-[0.97] transition-all border border-emerald-900/[0.1]"
              >
                Kontaktirajte nas
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
