/**
 * Replaces `{key}` placeholders in a template string with values.
 *
 *   format('You picked {n} {label}', { n: 3, label: 'nights' })
 *   // → 'You picked 3 nights'
 */
export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v === undefined ? `{${key}}` : String(v);
  });
}
