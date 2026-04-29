/**
 * IMPORTANT — do NOT show a skeleton here.
 *
 * `loading.tsx` creates a Suspense boundary around `{children}` in the parent
 * layout (`src/app/admin/calendar/layout.tsx`). When `page.tsx` suspends to
 * resolve a modal, this fallback is what's rendered in the modal slot.
 *
 * If we returned a skeleton, the user would see a flash of skeleton UI on
 * every modal open. By returning null, we let the existing modal (or empty
 * space) stay visible until the new modal RSC arrives — no flash, no reload
 * feel. This boundary ALSO stops the parent `/admin/loading.tsx` from
 * replacing the entire calendar grid during navigation.
 */
export default function CalendarLoading() {
  return null;
}
