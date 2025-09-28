import type { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env.js';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      uptime: process.uptime(),
      version: process.env.npm_package_version ?? env.NODE_ENV
    };
  });
};

export default healthRoutes;
