// Simple in-memory rate limiter for serverless (per-instance)
// For production at scale, consider @upstash/ratelimit with Redis

const rateLimitMap = new Map();

/**
 * Rate limiter
 * @param {string} key - Unique identifier (e.g., IP + route)
 * @param {number} limit - Max requests allowed in window
 * @param {number} windowMs - Time window in milliseconds
 * @returns {{ success: boolean, remaining: number, resetIn: number }}
 */
export function rateLimit(key, limit = 5, windowMs = 60 * 1000) {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { success: true, remaining: limit - record.count, resetIn: record.resetTime - now };
}

/**
 * Get client IP from request
 */
export function getClientIP(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}
