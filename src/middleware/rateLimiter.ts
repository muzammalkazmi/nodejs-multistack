import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../cache/cache.service';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    // @ts-expect-error - Known issue with rate-limit-redis and ioredis types
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
});

export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per window for auth routes
  message: 'Too many authentication attempts, please try again after an hour',
  store: new RedisStore({
    // @ts-expect-error
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
});
