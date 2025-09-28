import { createHash } from 'crypto';
import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/client.js';
import { redis } from '../config/redis.js';
import { depersonalize } from '../services/depersonalize.js';
import { moderation } from '../services/moderation.js';
import { createRateLimiter } from '../services/rateLimit.js';
import { env } from '../config/env.js';
import { hashToken } from '../utils/auth.js';

const rateLimiter = createRateLimiter(redis);

const generateVector = (text: string) => {
  const hash = createHash('sha256').update(text).digest();
  const floats: number[] = new Array(1536);
  for (let i = 0; i < floats.length; i += 1) {
    const value = hash[i % hash.length] / 255;
    floats[i] = Number((value * 2 - 1).toFixed(6));
  }
  return floats;
};

const postsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request, _reply) => {
    void _reply;
    await redis.set(`risk:ip:${request.ip}`, 'seen', 'EX', 60 * 60);
  });

  fastify.post(
    '/v1/posts',
    {
      preHandler: [
        fastify.authenticate,
        rateLimiter({
          limit: 5,
          windowInSeconds: 60,
          keyGenerator: async (request) => {
            const token = request.headers.authorization?.split(' ')[1] ?? 'anonymous';
            return `token:${hashToken(token)}`;
          }
        })
      ]
    },
    async (request, reply) => {
      const body = request.body as { text: string; topicTags?: string[] };
      if (!body?.text) {
        return reply.code(400).send({ error: 'INVALID_REQUEST', message: 'text is required' });
      }

      const cleanText = depersonalize(body.text, { maxLength: 2000 });
      const moderationResult = moderation.check(cleanText);

      if (moderationResult.status === 'blocked') {
        return reply.code(400).send({
          error: 'CONTENT_BLOCKED',
          category: moderationResult.category,
          message: moderationResult.message
        });
      }

      const latestMembership = await prisma.membership.findFirst({
        where: { userId: request.user!.id },
        orderBy: { joinedAt: 'desc' }
      });

      const post = await prisma.post.create({
        data: {
          authorId: request.user!.id,
          textRaw: body.text,
          textClean: cleanText,
          topicTags: body.topicTags ?? [],
          groupId: latestMembership?.groupId,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 48)
        }
      });

      if (moderationResult.status === 'needs_review') {
        return reply.code(202).send({
          id: post.id,
          text: post.textClean,
          topicTags: post.topicTags,
          expiresAt: post.expiresAt,
          moderation: moderationResult
        });
      }

      return reply.code(201).send({
        id: post.id,
        text: post.textClean,
        topicTags: post.topicTags,
        expiresAt: post.expiresAt
      });
    }
  );

  fastify.get('/v1/posts', async (request, reply) => {
    const query = request.query as { limit?: string; cursor?: string };
    const parsedLimit = query.limit ? Number(query.limit) : undefined;
    const limit = parsedLimit && Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 50) : 20;
    const cursor = query.cursor;

    const posts = await prisma.post.findMany({
      where: {
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor
        ? {
            skip: 1,
            cursor: { id: cursor }
          }
        : {})
    });

    const hasNextPage = posts.length > limit;
    const items = posts.slice(0, limit).map((post) => ({
      id: post.id,
      text: post.textClean,
      topicTags: post.topicTags,
      groupId: post.groupId,
      createdAt: post.createdAt
    }));

    return reply.send({
      items,
      nextCursor: hasNextPage ? posts[limit].id : null
    });
  });

  fastify.post('/v1/posts/:id/vec', async (request, reply) => {
    if (!env.INTERNAL_API_TOKEN) {
      return reply.code(501).send({ error: 'NOT_CONFIGURED', message: 'INTERNAL_API_TOKEN missing' });
    }

    const internalToken = request.headers['x-internal-token'];
    if (internalToken !== env.INTERNAL_API_TOKEN) {
      return reply.code(403).send({ error: 'FORBIDDEN', message: 'invalid internal token' });
    }

    const { id } = request.params as { id: string };
    const body = request.body as { text?: string } | undefined;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return reply.code(404).send({ error: 'NOT_FOUND', message: 'Post not found' });
    }

    const sourceText = body?.text ?? post.textClean;
    const embedding = generateVector(sourceText);
    const vectorLiteral = `[${embedding.join(',')}]`;

    await prisma.$executeRawUnsafe(
      'UPDATE "Post" SET "embedding" = $1::vector WHERE "id" = $2',
      vectorLiteral,
      id
    );

    return reply.send({ id, embeddingUpdated: true });
  });
};

export default postsRoutes;
