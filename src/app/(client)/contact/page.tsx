import { createClient } from '@/lib/supabase/server';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { FadeUp, StaggerContainer, StaggerItem } from '@/components/motion/FadeUp';
import type { SiteSettings } from '@/types/database';

export default async function ContactPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .single();

  const siteSettings = settings as SiteSettings | null;

  const contactCards = [
    siteSettings?.address && {
      icon: MapPin,
      label: 'Naša adresa',
      value: siteSettings.address,
      href: undefined,
    },
    siteSettings?.phone && {
      icon: Phone,
      label: 'Telefon',
      value: siteSettings.phone,
      href: `tel:${siteSettings.phone}`,
    },
    siteSettings?.email && {
      icon: Mail,
      label: 'E-mail',
      value: siteSettings.email,
      href: `mailto:${siteSettings.email}`,
    },
    (siteSettings?.check_in_time || siteSettings?.check_out_time) && {
      icon: Clock,
      label: 'Dolazak / Odlazak',
      value: [
        siteSettings?.check_in_time && `Dolazak: ${siteSettings.check_in_time}`,
        siteSettings?.check_out_time && `Odlazak: ${siteSettings.check_out_time}`,
      ].filter(Boolean).join('\n'),
      href: undefined,
    },
  ].filter(Boolean) as Array<{
    icon: React.ElementType;
    label: string;
    value: string;
    href: string | undefined;
  }>;

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="hero-mediterranean py-24 lg:py-32 pt-32 lg:pt-40">
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center animate-fade-up">
          <span className="inline-flex items-center gap-3 font-mono text-[10.5px] tracking-[0.28em] uppercase text-emerald-700 mb-4">
            <span className="h-px w-6 bg-emerald-700/50" />
            Javite nam se
            <span className="h-px w-6 bg-emerald-700/50" />
          </span>
          <h1 className="font-display font-medium text-ink text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
            <span className="italic text-emerald-700">Kontakt</span>
          </h1>
          <p className="mt-6 text-[15.5px] sm:text-base text-ink-muted max-w-xl mx-auto leading-relaxed">
            Imate pitanja o vili Casa Grazia ili trebate pomoć s rezervacijom? Javite nam se — odgovaramo brzo.
          </p>
        </div>
      </div>

      {/* Sadržaj */}
      <div className="py-20 lg:py-28 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20">

            {/* Lijeva kolona: info */}
            <div>
              <FadeUp className="mb-10">
                <h2 className="font-display font-medium text-ink text-3xl sm:text-4xl tracking-tight leading-tight">
                  Kontaktirajte <span className="italic text-emerald-700">nas</span>
                </h2>
                <p className="mt-3 text-ink-muted leading-relaxed">
                  Obično odgovaramo unutar nekoliko sati. Slobodno nas kontaktirajte putem bilo kojeg kanala.
                </p>
              </FadeUp>

              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {contactCards.map((card) => {
                  const Icon = card.icon;
                  const content = (
                    <div className={`bg-white border border-emerald-900/[0.07] rounded-2xl p-6 shadow-sm hover:shadow-premium hover:-translate-y-0.5 hover:border-emerald-700/30 transition-all duration-300 h-full ${card.href ? 'cursor-pointer' : ''}`}>
                      <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 mb-4">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-faint mb-2">
                        {card.label}
                      </h3>
                      <p className="text-[14.5px] font-medium text-ink whitespace-pre-line leading-relaxed">
                        {card.value}
                      </p>
                    </div>
                  );

                  return (
                    <StaggerItem key={card.label}>
                      {card.href ? (
                        <a href={card.href} className="block h-full">{content}</a>
                      ) : content}
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>

              {/* WhatsApp CTA */}
              {siteSettings?.whatsapp && (
                <FadeUp className="mt-8" delay={0.2}>
                  <a
                    href={`https://wa.me/${siteSettings.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-ink text-white font-medium text-[14.5px] hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-md"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Piši nam na WhatsApp
                    <span className="ml-1 text-emerald-200 text-sm font-normal group-hover:translate-x-0.5 transition-transform">→</span>
                  </a>
                </FadeUp>
              )}
            </div>

            {/* Desna kolona: karta */}
            <FadeUp className="h-full" delay={0.1}>
              {siteSettings?.google_maps_url ? (
                <div className="rounded-3xl overflow-hidden shadow-premium border border-emerald-900/[0.08] h-full min-h-[420px] bg-white">
                  <iframe
                    src={siteSettings.google_maps_url}
                    className="w-full h-full min-h-[420px]"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Karta lokacije"
                  />
                </div>
              ) : (
                <div className="rounded-3xl bg-emerald-50/60 flex flex-col items-center justify-center h-full min-h-[420px] text-ink-muted gap-3 border border-emerald-900/[0.08]">
                  <MapPin className="w-8 h-8 text-emerald-700/60" />
                  <span className="text-sm">Karta nije dostupna</span>
                </div>
              )}
            </FadeUp>
          </div>
        </div>
      </div>
    </div>
  );
}
