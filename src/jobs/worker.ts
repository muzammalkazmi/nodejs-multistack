import { Worker } from 'bullmq';
import { redisClient } from '../cache/cache.service';
import { logger } from '../utils/logger';

const emailWorker = new Worker(
  'email-queue',
  async (job) => {
    logger.info(`Processing job ${job.id} of type ${job.name}`);
    logger.info(`Sending email to ${job.data.email} with template ${job.data.template}`);
    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 1000));
    logger.info(`Successfully processed job ${job.id}`);
  },
  {
    connection: redisClient,
  }
);

emailWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error ${err.message}`);
});

logger.info('BullMQ Email Worker started.');
