import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { getServerDictionary } from '@/i18n/server';

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [params, { t }] = await Promise.all([searchParams, getServerDictionary()]);
  const name = typeof params.name === 'string' ? params.name : t.book.success.defaultGuest;
  const email = typeof params.email === 'string' ? params.email : '';

  return (
    <div className="min-h-[80vh] hero-mediterranean flex items-center justify-center py-20 lg:py-28 pt-32 lg:pt-40">
      <div className="relative z-10 max-w-md mx-auto text-center px-5 animate-fade-up">
        {/* Ikona */}
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-scale-in ring-1 ring-emerald-200">
            <CheckCircle2 className="h-10 w-10 text-emerald-700" />
          </div>
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '2s' }} />
        </div>

        {/* Tekst */}
        <div className="bg-white/85 backdrop-blur-sm rounded-3xl border border-emerald-900/[0.08] shadow-premium p-8">
          <p className="font-mono text-[10.5px] tracking-[0.28em] uppercase text-emerald-700 mb-3">
            {t.book.success.eyebrow}
          </p>
          <h1 className="font-display font-medium text-ink text-3xl sm:text-4xl tracking-tight leading-tight mb-4">
            {t.book.success.thanks}, <span className="italic text-emerald-700">{name}</span>!
          </h1>
          <p className="text-ink-muted leading-relaxed text-[15px]">
            {t.book.success.body}
          </p>
          {email && (
            <p className="text-sm text-ink-faint mt-3 leading-relaxed">
              {t.book.success.emailNoteBefore}
              <span className="font-medium text-ink-muted">{email}</span>
              {t.book.success.emailNoteAfter}
            </p>
          )}

          <div className="mt-8 pt-6 border-t border-emerald-900/[0.07] flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-ink text-white text-[14px] font-medium hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-md"
            >
              {t.book.success.backHome}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/gallery"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-emerald-900/[0.1] text-ink text-[14px] font-medium hover:border-emerald-700 hover:text-emerald-700 active:scale-[0.97] transition-all"
            >
              {t.book.success.viewGallery}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
