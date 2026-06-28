import { Request, Response, NextFunction } from 'express';
import { CacheService } from './cache.service';

export const cacheMiddleware = (ttl: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    
    const cachedResponse = await CacheService.get<any>(key);
    
    if (cachedResponse) {
      res.status(200).json(cachedResponse);
      return;
    }

    // Override res.json to intercept the response and cache it
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        CacheService.set(key, body, ttl).catch(console.error);
      }
      return originalJson(body);
    };

    next();
  };
};
