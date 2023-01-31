import { format as isoformat } from 'isoformat';

// Note: use formatAuto (or any other localized format) to present values to the
// user; stringify is only intended for machine values.
export function stringify(x) {
  return x == null ? '' : `${x}`;
}

export const formatLocaleAuto = localize(locale => {
  const formatNumber = formatLocaleNumber(locale);
  return value => value == null ? ''
    : typeof value === 'number' ? formatNumber(value)
    : value instanceof Date ? formatDate(value)
    : `${value}`;
});

export const formatLocaleNumber = localize(locale => {
  return value => value === 0 ? '0' : value.toLocaleString(locale); // handle negative zero
});

export const formatAuto = formatLocaleAuto();

export const formatNumber = formatLocaleNumber();

export function formatTrim(value) {
  const s = value.toString();
  const n = s.length;
  let i0 = -1, i1;
  out: for (let i = 1; i < n; ++i) {
    switch (s[i]) {
      case '.': i0 = i1 = i; break;
      case '0': if (i0 === 0) i0 = i; i1 = i; break;
      default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
    }
  }
  return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
}

export function formatDate(date) {
  return isoformat(date, 'Invalid Date');
}

// Memoize the last-returned locale.
export function localize(f) {
  let key = localize, value;
  return (locale = 'en') => locale === key ? value : (value = f(key = locale));
}
