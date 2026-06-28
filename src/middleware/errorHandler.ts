import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    if (err.isOperational) {
      logger.warn(`[${req.method}] ${req.url} - ${err.message}`);
    } else {
      logger.error(`[${req.method}] ${req.url} - ${err.message}`, err);
    }

    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle other errors (e.g. Prisma errors, unhandled exceptions)
  logger.error(`[${req.method}] ${req.url} - ${err.message}`, err);

  res.status(500).json({
    status: 'error',
    message: 'Internal Server Error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
