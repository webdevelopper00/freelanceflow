const blacklist = new Map<string, number>();
const JWT_EXPIRY_MS = 15 * 60 * 1000;
const CLEAN_INTERVAL_MS = 60 * 60 * 1000;

export function addToBlacklist(token: string): void {
  blacklist.set(token, Date.now() + JWT_EXPIRY_MS);
}

export function isBlacklisted(token: string): boolean {
  return blacklist.has(token);
}

function cleanExpired(): void {
  const now = Date.now();
  for (const [token, exp] of blacklist.entries()) {
    if (exp < now) blacklist.delete(token);
  }
}

setInterval(cleanExpired, CLEAN_INTERVAL_MS);
