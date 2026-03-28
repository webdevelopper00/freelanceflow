import validator from 'validator';

const MAX_STRING_LENGTH = 2000;

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

/** Strip HTML tags, escape and limit length. */
export function sanitizeString(value: unknown): string {
  if (value == null || typeof value !== 'string') return '';
  const stripped = validator.stripLow(validator.escape(stripTags(value.trim())));
  return stripped.length > MAX_STRING_LENGTH ? stripped.slice(0, MAX_STRING_LENGTH) : stripped;
}

/** For email: strip tags, trim, lowercase, limit length. */
export function sanitizeEmail(value: unknown): string {
  if (value == null || typeof value !== 'string') return '';
  return stripTags(validator.escape(value.trim().toLowerCase())).slice(0, 255);
}
