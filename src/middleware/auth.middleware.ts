import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Try to get token from cookies first, fallback to Authorization header for testing/swagger
    let token = req.cookies?.accessToken;
    
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; email: string };
    req.user = decoded;
    
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
