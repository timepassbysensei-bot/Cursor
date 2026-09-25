/**
 * Best-effort client-side throttling for the public forms.
 *
 * A honeypot field and this limiter stop casual spam from a browser; the real
 * envelope is rate limiting inside the serverless function for chat and the
 * database policies for writes. It is intentionally not presented as
 * protection against a determined attacker.
 */

interface Bucket {
  stamps: number[];
}

const KEY = "arian.rate-limit.v1";

function readBuckets(): Record<string, Bucket> {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Bucket>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function writeBuckets(buckets: Record<string, Bucket>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(buckets));
  } catch {
    /* storage disabled — throttling simply becomes a no-op */
  }
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  bucketName: string,
  max = 3,
  windowMs = 10 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const buckets = readBuckets();
  const stamps = (buckets[bucketName]?.stamps ?? []).filter((t) => now - t < windowMs);

  if (stamps.length >= max) {
    const oldest = Math.min(...stamps);
    const retryAfterSeconds = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
    buckets[bucketName] = { stamps };
    writeBuckets(buckets);
    return { allowed: false, retryAfterSeconds };
  }

  stamps.push(now);
  buckets[bucketName] = { stamps };
  writeBuckets(buckets);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function rateLimitMessage(retryAfterSeconds: number): string {
  const minutes = Math.ceil(retryAfterSeconds / 60);
  return minutes <= 1
    ? "That was sent a moment ago. Please wait a minute before sending another."
    : `You have sent several messages already. Please try again in about ${minutes} minutes.`;
}
