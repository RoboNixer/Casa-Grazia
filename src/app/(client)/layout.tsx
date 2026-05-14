import { createClient } from '@/lib/supabase/server';
import Header from '@/components/client/Header';
import Footer from '@/components/client/Footer';
import MenuAutoClose from '@/components/client/MenuAutoClose';
import LoadingScreen from '@/components/client/LoadingScreen';
import type { SiteSettings } from '@/types/database';
import { LocaleProvider } from '@/i18n/client';
import { getLocale } from '@/i18n/server';

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const [{ data: settings }, locale] = await Promise.all([
    supabase.from('site_settings').select('*').single(),
    getLocale(),
  ]);

  const siteSettings = settings as SiteSettings | null;
  const siteName = siteSettings?.site_name ?? 'Casa Grazia';

  return (
    <LocaleProvider locale={locale}>
      <div className="min-h-screen flex flex-col bg-white">
        {/* First-visit Mediterranean intro overlay. Renders FIRST in the DOM
            so it paints immediately while the rest of the page hydrates and
            loads images underneath. Hidden via CSS for returning visitors
            (see the inline boot script in app/layout.tsx). */}
        <LoadingScreen siteName={siteName} />

        <Header siteName={siteName} />
        <main className="flex-1">{children}</main>
        {siteSettings && <Footer siteSettings={siteSettings} />}
        <MenuAutoClose />
      </div>
    </LocaleProvider>
  );
}
