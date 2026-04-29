'use client';

import { useEffect } from 'react';

/**
 * Closes any `<input type="checkbox" id$="-toggle">` (CSS-only menus)
 * when a link inside <aside>/<nav>/[data-menu] is clicked.
 *
 * Mounted ONLY in the (client) layout — keeps admin pages free of any
 * global capture-phase document listeners (which can interfere with
 * React 19 event delegation on iOS Safari).
 */
export default function MenuAutoClose() {
  useEffect(() => {
    function onClick(e: Event) {
      const t = e.target as Element | null;
      if (!t || typeof t.closest !== 'function') return;
      const link = t.closest('a[href]');
      if (!link) return;
      if (!link.closest('aside, nav, [data-menu]')) return;

      const inputs = document.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"][id$="-toggle"]'
      );
      inputs.forEach(i => {
        if (i.checked) i.checked = false;
      });
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return null;
}
