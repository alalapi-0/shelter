import { randomBytes, createHash, randomUUID } from 'crypto';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/client.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { hashToken } from '../utils/auth.js';

const buildShadowId = () => {
  const seed = randomUUID();
  return createHash('sha256').update(`${seed}:${env.TOKEN_SECRET}`).digest('hex');
};

const registerRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/v1/register', async (request, reply) => {
    const body = request.body as { deviceFingerprint?: string | null } | undefined;
    const token = randomBytes(24).toString('hex');
    const tokenHash = hashToken(token);
    const shadowId = buildShadowId();

    const user = await prisma.user.create({
      data: {
        shadowId,
        tokenHash
      }
    });

    logger.info({ userId: user.id, fingerprint: body?.deviceFingerprint }, 'New shadow user registered');

    return reply.code(201).send({
      shadowId,
      token
    });
  });
};

export default registerRoutes;
