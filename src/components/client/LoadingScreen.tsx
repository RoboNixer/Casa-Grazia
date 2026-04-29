'use client';

import { useEffect, useState } from 'react';

const MIN_DISPLAY_MS = 1400; // never feels like a flash
const EXIT_MS = 850;         // matches the curtain transition in globals.css
const SAFETY_MS = 4500;      // hard cap so the loader can never get stuck

interface LoadingScreenProps {
  /** Brand display name. Last word is italicised in emerald. */
  siteName: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * LoadingScreen
 *
 * • Renders as a fixed overlay above EVERYTHING (z-index very high).
 * • Mediterranean wash: cream + emerald + amber radial blobs + drift.
 * • Brand wordmark with a staggered letter reveal.
 * • Animated emerald progress bar.
 * • Exit choreography: brand fades + curtain slides up to reveal the page
 *   that has been hydrating behind it.
 * • Lifecycle: appears on every full page load (refresh / direct URL).
 *   Internal SPA navigations don't re-trigger it because this component
 *   lives in the layout that stays mounted as the user clicks around.
 * ───────────────────────────────────────────────────────────────────────── */

export default function LoadingScreen({ siteName }: LoadingScreenProps) {
  // 'in' → visible, 'leaving' → exit animation, 'gone' → unmounted.
  const [phase, setPhase] = useState<'in' | 'leaving' | 'gone'>('in');

  useEffect(() => {
    const startedAt = Date.now();
    const timers: number[] = [];
    let leftAlready = false;

    const triggerLeave = () => {
      if (leftAlready) return;
      leftAlready = true;
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_DISPLAY_MS - elapsed);
      timers.push(
        window.setTimeout(() => {
          setPhase('leaving');
          timers.push(window.setTimeout(() => setPhase('gone'), EXIT_MS));
        }, wait),
      );
    };

    if (document.readyState === 'complete') {
      triggerLeave();
    } else {
      window.addEventListener('load', triggerLeave, { once: true });
    }

    // Safety net: page never finishes loading (slow image, blocked CDN…).
    const safetyTimer = window.setTimeout(triggerLeave, SAFETY_MS);
    timers.push(safetyTimer);

    return () => {
      window.removeEventListener('load', triggerLeave);
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  if (phase === 'gone') return null;

  // Split brand for two-tone wordmark, e.g. "Casa" + italicised "Grazia".
  const parts = siteName.trim().split(' ').filter(Boolean);
  const lead = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const accent = parts[parts.length - 1] ?? siteName;

  // Stagger delays for the brand letters.
  const fullName = (lead ? lead + ' ' : '') + accent;
  const letters = Array.from(fullName);
  const baseDelay = 220; // matches the small-label fade-in tail

  return (
    <div
      role="status"
      aria-label="Učitavanje"
      data-phase={phase}
      className="cg-loader fixed inset-0 z-[2147483645] flex items-center justify-center select-none"
      style={
        {
          '--cg-loader-duration': `${MIN_DISPLAY_MS}ms`,
        } as React.CSSProperties
      }
    >
      {/* ── Curtain background — slides up on exit, taking the page reveal
            energy with it. The Mediterranean wash (cream + emerald + amber +
            peach blobs) is defined inside `.cg-loader-curtain` itself in
            globals.css so this stays opaque regardless of utility class
            ordering. ───────────────────────────────────────────────────── */}
      <div aria-hidden className="cg-loader-curtain" />

      {/* Subtle drifting emerald + amber blobs over the wash for depth */}
      <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="cg-loader-blob-a absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(110,231,183,0.55) 0%, rgba(110,231,183,0.10) 45%, transparent 75%)',
          }}
        />
        <div
          className="cg-loader-blob-b absolute -bottom-40 -left-20 w-[460px] h-[460px] rounded-full blur-2xl"
          style={{
            background:
              'radial-gradient(circle, rgba(253,186,116,0.48) 0%, rgba(253,186,116,0.10) 45%, transparent 75%)',
          }}
        />
        <div
          className="cg-loader-blob-a absolute -bottom-24 -right-32 w-[420px] h-[420px] rounded-full blur-2xl"
          style={{
            animationDelay: '0.6s',
            background:
              'radial-gradient(circle, rgba(252,165,165,0.36) 0%, rgba(252,165,165,0.08) 45%, transparent 75%)',
          }}
        />
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-6 max-w-3xl">
        {/* Tiny ornamented label */}
        <p
          className="cg-loader-fade-in inline-flex items-center gap-3 font-mono text-[10.5px] tracking-[0.32em] uppercase text-emerald-700 mb-7"
          style={{ animationDelay: '40ms' }}
        >
          <span className="h-px w-7 bg-emerald-700/50" />
          Villa · Istra
          <span className="h-px w-7 bg-emerald-700/50" />
        </p>

        {/* Brand — stagger letter reveal */}
        <h1
          aria-label={fullName}
          className="font-display font-medium text-ink text-6xl sm:text-7xl lg:text-8xl tracking-tight leading-[1.0]"
        >
          {letters.map((ch, i) => {
            const isAccent = i >= (lead ? lead.length + 1 : 0);
            const isSpace = ch === ' ';
            return (
              <span
                key={`${ch}-${i}`}
                aria-hidden
                className="cg-loader-letter"
                style={{
                  animationDelay: `${baseDelay + i * 55}ms`,
                  fontStyle: isAccent ? 'italic' : undefined,
                  color: isAccent ? '#047857' : undefined,
                  width: isSpace ? '0.32em' : undefined,
                }}
              >
                {isSpace ? '\u00A0' : ch}
              </span>
            );
          })}
        </h1>

        {/* Hairline that draws outward */}
        <div
          aria-hidden
          className="mt-10 mx-auto h-px w-44 sm:w-56 bg-gradient-to-r from-transparent via-emerald-700/60 to-transparent cg-loader-hairline"
        />

        {/* Determinate progress bar */}
        <div className="mt-8 mx-auto w-44 sm:w-56 h-[3px] rounded-full bg-emerald-900/10 overflow-hidden">
          <div className="cg-loader-bar h-full rounded-full bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-500" />
        </div>

        {/* Caption */}
        <p
          className="cg-loader-fade-up mt-6 font-mono text-[10px] tracking-[0.28em] uppercase text-ink-muted"
          style={{ animationDelay: '900ms' }}
        >
          Pripremamo vaš boravak
        </p>
      </div>
    </div>
  );
}
