import Fastify from 'fastify';
import type { FastifyBaseLogger } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import type { FastifyRequest } from 'fastify';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import healthRoutes from './routes/health.js';
import registerRoutes from './routes/v1.register.js';
import postsRoutes from './routes/v1.posts.js';
import groupsRoutes from './routes/v1.groups.js';
import { prisma } from './db/client.js';
import { redis } from './config/redis.js';
import { hashToken } from './utils/auth.js';

const authenticate = async (request: FastifyRequest) => {
  const authorization = request.headers.authorization;
  if (!authorization) {
    throw { statusCode: 401, message: 'Missing Authorization header' };
  }

  const [, token] = authorization.split(' ');
  if (!token) {
    throw { statusCode: 401, message: 'Invalid Authorization header' };
  }

  const tokenHash = hashToken(token);
  const user = await prisma.user.findFirst({ where: { tokenHash } });

  if (!user) {
    throw { statusCode: 401, message: 'Invalid token' };
  }

  request.user = {
    id: user.id,
    shadowId: user.shadowId
  };

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() }
  });
};

export const buildApp = async () => {
  const fastify = Fastify({
    logger: logger as unknown as FastifyBaseLogger
  });

  const corsOrigins = env.CORS_ORIGIN.split(',').map((item) => item.trim());

  await fastify.register(cors, {
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
  });

  await fastify.register(sensible);

  fastify.decorate('authenticate', async (request, _reply) => {
    void _reply;
    try {
      await authenticate(request);
    } catch (error) {
      const err = error as { statusCode?: number; message?: string };
      throw fastify.httpErrors.unauthorized(err.message ?? 'Unauthorized');
    }
  });

  fastify.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'Request failed');
    if (!reply.sent) {
      reply.status(error.statusCode ?? 500).send({
        error: error.name ?? 'InternalServerError',
        message: env.NODE_ENV === 'production' ? 'Internal error' : error.message
      });
    }
  });

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
    await redis.quit();
  });

  await fastify.register(healthRoutes);
  await fastify.register(registerRoutes);
  await fastify.register(postsRoutes);
  await fastify.register(groupsRoutes);

  return fastify;
};
