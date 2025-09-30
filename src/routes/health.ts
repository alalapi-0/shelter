import type { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env.js';
import { prisma } from '../db/client.js';
import { redis } from '../config/redis.js';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    let dbStatus: 'ok' | 'down' = 'ok';
    let redisStatus: 'ok' | 'down' = 'ok';

    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (error) {
      fastify.log.error({ err: error }, 'Database health check failed');
      dbStatus = 'down';
    }

    try {
      await redis.ping();
    } catch (error) {
      fastify.log.error({ err: error }, 'Redis health check failed');
      redisStatus = 'down';
    }

    return {
      status: 'ok',
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? env.NODE_ENV,
      db: dbStatus,
      redis: redisStatus
    };
  });
};

export default healthRoutes;
