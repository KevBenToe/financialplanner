export const toCents = (value: number): number => Math.round(value * 100);

export const fromCents = (value: number): number => value / 100;

export const clampCents = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value);
};

export const formatCurrency = (
  cents: number,
  currency = 'EUR',
  locale = 'de-DE',
): string =>
  new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(fromCents(cents));

export const formatPercent = (value: number, locale = 'de-DE'): string =>
  new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
