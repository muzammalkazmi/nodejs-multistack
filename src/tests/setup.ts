import { prisma } from '../config/db';
import { redisClient } from '../cache/cache.service';

beforeAll(async () => {
  // Wait for connections if needed
});

afterAll(async () => {
  // Cleanup DB
  const deleteUsers = prisma.user.deleteMany();
  await prisma.$transaction([deleteUsers]);

  await prisma.$disconnect();

  // Cleanup Redis Cache
  await redisClient.flushall();
  await redisClient.quit();
});

afterEach(async () => {
  // Clear tables between tests for clean state
  await prisma.user.deleteMany();
  await redisClient.flushall();
});
