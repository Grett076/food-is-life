const FRACS: [string, number][] = [
  ['⅛', 0.125], ['¼', 0.25],  ['⅓', 1 / 3], ['⅜', 0.375],
  ['½', 0.5],   ['⅝', 0.625], ['⅔', 2 / 3], ['¾', 0.75], ['⅞', 0.875],
];

function parseLeading(s: string): [number, number] | null {
  let i = 0;
  let val = 0;

  const m = s.match(/^(\d+)/);
  if (m) { val = parseInt(m[1]); i = m[1].length; }

  for (const [frac, dec] of FRACS) {
    if (s.slice(i).startsWith(frac)) { val += dec; i += frac.length; break; }
  }

  return i > 0 ? [val, i] : null;
}

function fmt(n: number): string {
  if (n <= 0) return '0';
  const whole = Math.floor(n);
  const frac  = n - whole;

  if (frac < 0.06) return String(whole);
  if (frac > 0.94) return String(whole + 1);

  let best = '';
  let bestDiff = 0.07;
  for (const [str, dec] of FRACS) {
    const diff = Math.abs(frac - dec);
    if (diff < bestDiff) { bestDiff = diff; best = str; }
  }

  if (best) return whole > 0 ? `${whole}${best}` : best;
  return n < 10 ? n.toFixed(1).replace(/\.0$/, '') : String(Math.round(n));
}

export interface ScaledAmount {
  text: string;
  /** true = kleine maat (tl/snuf) → proef zelf */
  seasoning: boolean;
  /** true = ongewijzigd (naar smaak, sectiekop, factor 1) */
  unchanged: boolean;
}

export function scaleAmount(amount: string | undefined, factor: number): ScaledAmount {
  if (!amount) return { text: '', seasoning: false, unchanged: true };

  const trimmed = amount.trim();

  if (/naar smaak|^—/.test(trimmed) || factor === 1) {
    return { text: trimmed, seasoning: false, unchanged: true };
  }

  const seasoning = /\btl\b|snuf/i.test(trimmed);

  const parsed = parseLeading(trimmed);
  if (!parsed) return { text: trimmed, seasoning, unchanged: true };

  const [val, len] = parsed;
  return { text: fmt(val * factor) + trimmed.slice(len), seasoning, unchanged: false };
}
