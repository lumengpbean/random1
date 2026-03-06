const bucket = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const value = bucket.get(key);
  if (!value || value.resetAt < now) {
    bucket.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (value.count >= limit) return { ok: false };
  value.count += 1;
  return { ok: true };
}

export function hasSpamSignals(text: string) {
  const lower = text.toLowerCase();
  return ["buy now", "free crypto", "click here"].some((s) => lower.includes(s));
}
