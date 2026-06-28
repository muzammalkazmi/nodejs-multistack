import { Queue } from 'bullmq';
import { redisClient } from '../cache/cache.service';

export const emailQueue = new Queue('email-queue', {
  connection: redisClient,
});

export const addEmailJob = async (email: string, template: string) => {
  await emailQueue.add('send-email', { email, template });
};
