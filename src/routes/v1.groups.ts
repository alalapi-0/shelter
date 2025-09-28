import type { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db/client.js';
import { groupingService } from '../services/grouping.js';

const groupsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/v1/groups/join',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const body = request.body as { topicTags?: string[] } | undefined;
      const group = await groupingService.assignUserToGroup(request.user!.id, body?.topicTags ?? []);

      return reply.send({
        id: group.id,
        name: group.name,
        capacity: group.capacity,
        memberCount: group.memberCount
      });
    }
  );

  fastify.get(
    '/v1/groups/:id/posts',
    { preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const membership = await prisma.membership.findFirst({
        where: {
          userId: request.user!.id,
          groupId: id
        }
      });

      if (!membership) {
        return reply.code(403).send({ error: 'FORBIDDEN', message: 'Not part of this group' });
      }

      const posts = await prisma.post.findMany({
        where: {
          groupId: id,
          expiresAt: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return reply.send({
        items: posts.map((post) => ({
          id: post.id,
          text: post.textClean,
          topicTags: post.topicTags,
          createdAt: post.createdAt
        }))
      });
    }
  );
};

export default groupsRoutes;
