import { redis } from '@/lib/redis'

// In-memory fallback used when Redis is unavailable
const memoryStore = new Map<string, { count: number; resetAt: number }>()

/**
 * Sliding-window rate limiter backed by Redis.
 * Returns { allowed, remaining } based on the number of calls
 * for the given key within windowSeconds.
 * Falls back to an in-memory counter if Redis is unavailable.
 */
export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const full = `ratelimit:${key}`
    const current = await redis.incr(full)
    if (current === 1) {
      await redis.expire(full, windowSeconds)
    }
    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current),
    }
  } catch {
    // Redis unavailable - use in-memory fallback so rate limiting stays active
    const now = Date.now()
    const entry = memoryStore.get(key)
    if (!entry || entry.resetAt < now) {
      memoryStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
      return { allowed: true, remaining: limit - 1 }
    }
    entry.count++
    return { allowed: entry.count <= limit, remaining: Math.max(0, limit - entry.count) }
  }
}
