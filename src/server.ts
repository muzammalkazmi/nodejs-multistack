import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { prisma } from './config/db';
import { redisClient } from './cache/cache.service';

const PORT = env.PORT || 3000;

async function bootstrap() {
  try {
    // Connect to Database
    await prisma.$connect();
    logger.info('Connected to PostgreSQL via Prisma');

    // Connect to Redis
    await redisClient.ping();
    logger.info('Connected to Redis');

    // Start Server
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
    });

    // Graceful Shutdown
    const gracefulShutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(async () => {
        logger.info('HTTP server closed.');
        await prisma.$disconnect();
        await redisClient.quit();
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
