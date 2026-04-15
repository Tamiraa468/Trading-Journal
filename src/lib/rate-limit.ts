import { db } from "@/lib/db";

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async check(ip: string): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
    const now = new Date();
    
    let record = await db.rateLimit.findUnique({ where: { ip } });

    if (!record) {
      record = await db.rateLimit.create({
        data: {
          ip,
          count: 1,
          resetTime: new Date(now.getTime() + this.windowMs),
        },
      });
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests - 1, reset: record.resetTime.getTime() };
    }

    if (now > record.resetTime) {
      record = await db.rateLimit.update({
        where: { ip },
        data: {
          count: 1,
          resetTime: new Date(now.getTime() + this.windowMs),
        },
      });
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests - 1, reset: record.resetTime.getTime() };
    }

    if (record.count >= this.maxRequests) {
      return { success: false, limit: this.maxRequests, remaining: 0, reset: record.resetTime.getTime() };
    }

    record = await db.rateLimit.update({
      where: { ip },
      data: {
        count: record.count + 1,
      },
    });
    
    return { success: true, limit: this.maxRequests, remaining: this.maxRequests - record.count, reset: record.resetTime.getTime() };
  }
}

// 5 requests per minute for auth endpoints
export const authRateLimiter = new RateLimiter(5, 60 * 1000);

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "unknown-ip";
}
