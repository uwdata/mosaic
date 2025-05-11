
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
  let key = null;
  let value;
  return (locale = 'en') => locale === key
    ? value
    : (value = f(key = locale));
}

// Code below modified from https://github.com/mbostock/isoformat/
// Added here due to longstanding unmerged fixes on original package
//
// Copyright 2021 Mike Bostock
//
// Permission to use, copy, modify, and/or distribute this software for any purpose
// with or without fee is hereby granted, provided that the above copyright notice
// and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
// REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
// INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
// OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
// TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
// THIS SOFTWARE.

/**
 * Format a Date in ISO format.
 * @param {Date} date The date to format
 * @param {string | ((date: Date) => string)} fallback Fallback value or function.
 * @returns {string}
 */
function isoformat(date, fallback) {
  if (!(date instanceof Date)) date = new Date(+date);
  if (isNaN(+date)) return typeof fallback === "function" ? fallback(date) : fallback;
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const milliseconds = date.getUTCMilliseconds();
  return `${formatYear(date.getUTCFullYear())}-${pad(date.getUTCMonth() + 1, 2)}-${pad(date.getUTCDate(), 2)}${
    hours || minutes || seconds || milliseconds ? `T${pad(hours, 2)}:${pad(minutes, 2)}${
      seconds || milliseconds ? `:${pad(seconds, 2)}${
        milliseconds ? `.${pad(milliseconds, 3)}` : ``
      }` : ``
    }Z` : ``
  }`;
}

function formatYear(year) {
  return year < 0 ? `-${pad(-year, 6)}`
    : year > 9999 ? `+${pad(year, 6)}`
    : pad(year, 4);
}

function pad(value, width) {
  return `${value}`.padStart(width, "0");
}
