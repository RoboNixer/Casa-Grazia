'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Početna' },
  { href: '/book', label: 'Rezerviraj' },
  { href: '/gallery', label: 'Galerija' },
  { href: '/contact', label: 'Kontakt' },
];

function isActive(currentPath: string, href: string) {
  if (href === '/') return currentPath === '/';
  return currentPath === href || currentPath.startsWith(href + '/');
}

export default function Header({ siteName }: { siteName: string }) {
  const pathname = usePathname() ?? '/';
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Split brand into "Casa" + accent word ("Grazia") for BURA-style two-tone logo.
  const brandParts = siteName.trim().split(' ');
  const brandLead = brandParts.length > 1 ? brandParts.slice(0, -1).join(' ') : '';
  const brandAccent = brandParts[brandParts.length - 1];

  // Pages where the header sits over a dark hero — text must be light at top.
  const overlayPaths = ['/', '/book', '/gallery', '/contact', '/book/success'];
  const isOverDark = overlayPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );
  const lightOnTop = isOverDark && !scrolled;

  // Scroll-driven background swap (transparent → glass)
  useEffect(() => {
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > 40);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Body scroll-lock + Esc + close-on-route-change for the mobile menu
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const prevHtml = document.documentElement.style.overflow;
    const prevBody = document.body.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prevHtml;
      document.body.style.overflow = prevBody;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-40',
          'transition-[background-color,backdrop-filter,border-color,box-shadow] duration-500 ease-out',
          scrolled
            ? 'bg-white/85 backdrop-blur-xl backdrop-saturate-[1.6] border-b border-emerald-900/[0.07] shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)]'
            : 'bg-transparent border-b border-transparent',
        )}
      >
        <div className="flex items-center justify-between gap-4 px-5 sm:px-8 lg:px-10 h-[68px] sm:h-[78px]">

          {/* Brand — stacked: small mono label + large italic serif name */}
          <Link
            href="/"
            className="group flex flex-col leading-none gap-[3px] sm:gap-1.5 shrink-0"
          >
            <span
              className={cn(
                'font-mono text-[9px] sm:text-[10px] tracking-[0.28em] uppercase transition-colors duration-500',
                lightOnTop ? 'text-white/55' : 'text-ink-faint',
              )}
            >
              Villa · Istra
            </span>
            <span
              className={cn(
                'font-display font-medium tracking-tight leading-none transition-colors duration-500',
                'text-[22px] sm:text-[26px]',
                lightOnTop ? 'text-white' : 'text-ink',
              )}
            >
              {brandLead && (
                <span className="italic">{brandLead}</span>
              )}
              {brandLead && ' '}
              <span
                className={cn(
                  'italic transition-colors duration-500',
                  lightOnTop ? 'text-emerald-300' : 'text-emerald-700',
                )}
              >
                {brandAccent}
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7 lg:gap-9">
            {navLinks.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'group relative font-mono text-[11px] tracking-[0.18em] uppercase transition-colors duration-300',
                    active
                      ? lightOnTop
                        ? 'text-white'
                        : 'text-ink'
                      : lightOnTop
                        ? 'text-white/65 hover:text-white'
                        : 'text-ink-muted hover:text-ink',
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      'absolute -bottom-1.5 left-0 right-0 h-px origin-left transition-transform duration-400 ease-out',
                      active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                      lightOnTop
                        ? 'bg-white'
                        : 'bg-gradient-to-r from-emerald-700 to-emerald-500',
                    )}
                  />
                </Link>
              );
            })}

            {/* CTA */}
            <Link
              href="/book"
              className={cn(
                'group inline-flex items-center gap-2 px-5 lg:px-6 py-2.5 lg:py-3',
                'font-mono text-[11px] tracking-[0.18em] uppercase font-semibold',
                'transition-all duration-300 hover:-translate-y-[2px]',
                lightOnTop
                  ? 'bg-white text-ink hover:bg-emerald-300 hover:text-ink shadow-[0_8px_22px_-10px_rgba(255,255,255,0.4)]'
                  : 'bg-ink text-white hover:bg-emerald-700 shadow-[0_8px_22px_-10px_rgba(15,23,42,0.55)]',
              )}
            >
              Rezerviraj
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
            </Link>
          </nav>

          {/* Mobile burger (BURA-style, asymmetric line + morph to X) */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Otvori izbornik"
            className={cn(
              'md:hidden relative flex flex-col items-center justify-center gap-[5px] w-10 h-10 -mr-1 transition-colors',
              lightOnTop ? 'text-white' : 'text-ink',
            )}
          >
            <span
              aria-hidden
              className="block h-[1.5px] w-6 bg-current rounded-full transition-all duration-400 ease-[cubic-bezier(0.77,0,0.175,1)]"
            />
            <span
              aria-hidden
              className="block h-[1.5px] w-6 bg-current rounded-full transition-all duration-300 ease-out"
            />
            <span
              aria-hidden
              className="block h-[1.5px] w-4 bg-current rounded-full transition-all duration-400 ease-[cubic-bezier(0.77,0,0.175,1)]"
            />
          </button>
        </div>
      </header>

      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        siteName={siteName}
        brandLead={brandLead}
        brandAccent={brandAccent}
        pathname={pathname}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────── */

function MobileMenu({
  open,
  onClose,
  siteName,
  brandLead,
  brandAccent,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  siteName: string;
  brandLead: string;
  brandAccent: string;
  pathname: string;
}) {
  // Two-phase mount: first render at "closed" state so the browser commits
  // the initial styles, then on the NEXT frame flip to "open" state so the
  // CSS transition has a before/after to interpolate between.
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // Two rAFs: first paints the closed state, second triggers the transition.
      let rafA = 0;
      let rafB = 0;
      rafA = window.requestAnimationFrame(() => {
        rafB = window.requestAnimationFrame(() => setShow(true));
      });
      return () => {
        window.cancelAnimationFrame(rafA);
        window.cancelAnimationFrame(rafB);
      };
    }
    setShow(false);
    const t = window.setTimeout(() => setMounted(false), 650);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        'md:hidden fixed inset-0 z-[60]',
        show ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Glavni izbornik"
    >
      {/* Backdrop — soft tint */}
      <button
        type="button"
        aria-label="Zatvori izbornik"
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-slate-900/30',
          'transition-opacity duration-400 ease-out',
          show ? 'opacity-100' : 'opacity-0',
        )}
      />

      {/* Panel — slides up from bottom (transform-only, GPU-promoted) */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 top-0 flex flex-col overflow-hidden',
          // Fully opaque base — no see-through anywhere
          'bg-white',
          'shadow-[0_-30px_80px_-20px_rgba(15,23,42,0.18)]',
          'transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          'will-change-transform',
          show ? 'translate-y-0' : 'translate-y-full',
        )}
        style={{ transform: show ? 'translate3d(0,0,0)' : 'translate3d(0,100%,0)' }}
      >
        {/* Base color wash — multi-stop Mediterranean gradient covering the whole panel */}
        <div
          aria-hidden
          className="absolute inset-0 -z-0 bg-[linear-gradient(140deg,#ffffff_0%,#ecfdf5_30%,#fef3e8_70%,#fef0e6_100%)]"
        />

        {/* Decorative blobs — opacity-only fade */}
        <div
          aria-hidden
          className={cn(
            'absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full',
            'bg-[radial-gradient(circle,rgba(110,231,183,0.55)_0%,rgba(110,231,183,0.15)_45%,transparent_75%)] blur-2xl',
            'transition-opacity ease-out',
            show ? 'opacity-100 duration-[700ms] delay-[300ms]' : 'opacity-0 duration-200',
          )}
        />
        <div
          aria-hidden
          className={cn(
            'absolute -bottom-40 -left-20 w-[460px] h-[460px] rounded-full',
            'bg-[radial-gradient(circle,rgba(253,186,116,0.48)_0%,rgba(253,186,116,0.12)_45%,transparent_75%)] blur-2xl',
            'transition-opacity ease-out',
            show ? 'opacity-100 duration-[700ms] delay-[380ms]' : 'opacity-0 duration-200',
          )}
        />
        {/* Bottom-right blob — peach/rose to cover the previously see-through area */}
        <div
          aria-hidden
          className={cn(
            'absolute -bottom-32 -right-28 w-[440px] h-[440px] rounded-full',
            'bg-[radial-gradient(circle,rgba(252,165,165,0.40)_0%,rgba(252,165,165,0.10)_45%,transparent_75%)] blur-2xl',
            'transition-opacity ease-out',
            show ? 'opacity-100 duration-[700ms] delay-[440ms]' : 'opacity-0 duration-200',
          )}
        />
        {/* Soft center wash — emerald hint behind the nav */}
        <div
          aria-hidden
          className={cn(
            'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[280px] rounded-full',
            'bg-[radial-gradient(ellipse,rgba(167,243,208,0.25)_0%,transparent_70%)] blur-3xl',
            'transition-opacity ease-out',
            show ? 'opacity-100 duration-[800ms] delay-[500ms]' : 'opacity-0 duration-200',
          )}
        />

        {/* Drag handle */}
        <div
          className={cn(
            'relative mx-auto mt-3 h-1 w-10 rounded-full bg-slate-900/15',
            'transition-all ease-out',
            show
              ? 'opacity-100 scale-x-100 duration-500 delay-[180ms]'
              : 'opacity-0 scale-x-50 duration-200',
          )}
        />

        {/* Top bar: brand + close X */}
        <div
          className={cn(
            'relative flex items-center justify-between px-6 pt-5',
            'transition-all ease-[cubic-bezier(0.22,1,0.36,1)]',
            show
              ? 'opacity-100 translate-y-0 duration-500 delay-[260ms]'
              : 'opacity-0 -translate-y-2 duration-200',
          )}
        >
          <div className="flex flex-col leading-none gap-1">
            <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-ink-faint">
              Villa · Istra
            </span>
            <span className="font-display font-medium text-[22px] leading-none tracking-tight text-ink">
              {brandLead && <span className="italic">{brandLead} </span>}
              <span className="italic text-emerald-700">{brandAccent || siteName}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zatvori izbornik"
            className="
              flex items-center justify-center w-10 h-10 rounded-none
              border border-slate-900/15 text-ink text-lg leading-none
              hover:border-emerald-700/60 hover:text-emerald-700 hover:rotate-90
              active:scale-95 transition-all duration-300
            "
          >
            ✕
          </button>
        </div>

        {/* Nav — BURA-style "rolling up" reveal, centered */}
        <nav className="relative flex-1 flex flex-col items-center justify-center px-6 min-h-0">
          <ul className="w-full max-w-sm flex flex-col items-center text-center space-y-1">
            {navLinks.map((link, i) => {
              const active = isActive(pathname, link.href);
              return (
                <li
                  key={link.href}
                  className="relative overflow-hidden w-full"
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      'group block py-2 sm:py-3 text-center transition-all ease-[cubic-bezier(0.34,1.56,0.64,1)]',
                      show
                        ? 'translate-y-0 opacity-100 duration-700'
                        : 'translate-y-[110%] opacity-0 duration-300',
                    )}
                    style={{ transitionDelay: show ? `${320 + i * 80}ms` : '0ms' }}
                  >
                    <span
                      className={cn(
                        'font-display italic font-medium leading-[0.95] tracking-tight',
                        'text-[44px] sm:text-[56px]',
                        active
                          ? 'text-emerald-700'
                          : 'text-ink/65 group-hover:text-emerald-700',
                        'transition-colors duration-300',
                      )}
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Hairline divider — centered */}
          <div
            className={cn(
              'mt-7 h-px w-32 bg-gradient-to-r from-transparent via-slate-900/15 to-transparent',
              'origin-center transition-transform duration-700 ease-out',
              show ? 'scale-x-100 delay-[640ms]' : 'scale-x-0 duration-200',
            )}
          />

          {/* Meta line — centered */}
          <div
            className={cn(
              'mt-5 transition-all duration-700 ease-out text-center',
              show
                ? 'opacity-100 translate-y-0 delay-[700ms]'
                : 'opacity-0 translate-y-3 duration-200',
            )}
          >
            <p className="font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-faint leading-relaxed">
              Duranka 44, Rovinjsko Selo
              <br />
              <a
                href="tel:+385989744931"
                className="text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                +385 98 974 4931
              </a>
            </p>
          </div>
        </nav>

        {/* CTA */}
        <div
          className={cn(
            'relative px-6 pb-7 transition-all ease-[cubic-bezier(0.22,1,0.36,1)]',
            show
              ? 'opacity-100 translate-y-0 duration-700 delay-[760ms]'
              : 'opacity-0 translate-y-4 duration-200',
          )}
          style={{ paddingBottom: 'calc(1.75rem + env(safe-area-inset-bottom))' }}
        >
          <Link
            href="/book"
            onClick={onClose}
            className="
              group flex items-center justify-center gap-2 w-full max-w-sm mx-auto px-5 py-4
              bg-ink text-white font-mono font-bold text-[12.5px] tracking-[0.18em] uppercase
              hover:bg-emerald-700 active:scale-[0.98] transition-all duration-300
              shadow-[0_14px_30px_-12px_rgba(15,23,42,0.45)]
            "
          >
            Rezerviraj
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
