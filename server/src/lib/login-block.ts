const failedAttempts = new Map<string, { count: number; firstAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 60 * 60 * 1000;

export function recordFailedLogin(ip: string): void {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry) {
    failedAttempts.set(ip, { count: 1, firstAt: now });
    return;
  }
  if (now - entry.firstAt > WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstAt: now });
    return;
  }
  entry.count += 1;
}

export function isBlocked(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.firstAt > WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function getRemainingAttempts(ip: string): number {
  const entry = failedAttempts.get(ip);
  if (!entry) return MAX_ATTEMPTS;
  if (Date.now() - entry.firstAt > WINDOW_MS) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - entry.count);
}
