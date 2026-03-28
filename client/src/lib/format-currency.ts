import type { Currency } from 'shared';

const CURRENCY_CODES: Record<Currency, string> = {
  MAD: 'MAD',
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
};

/** Format amount stored in cents to display string with currency. */
export function formatCurrency(cents: number, currency: Currency = 'USD'): string {
  const code = CURRENCY_CODES[currency];
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
  }).format(cents / 100);
}
