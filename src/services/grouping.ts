import { prisma } from '../db/client.js';
import { logger } from '../utils/logger.js';

const DEFAULT_CAPACITY = 12;

const buildGroupName = (tag?: string) => {
  const base = tag ? tag.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'open';
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || 'open'}-${suffix}`;
};

export const groupingService = {
  async assignUserToGroup(userId: string, topicTags: string[] = []) {
    const primaryTag = topicTags[0]?.toLowerCase();

    const existingMembership = await prisma.membership.findFirst({
      where: { userId },
      orderBy: { joinedAt: 'desc' },
      include: { group: true }
    });

    if (existingMembership && !existingMembership.group.isArchived) {
      return existingMembership.group;
    }

    return prisma.$transaction(async (tx) => {
      let candidate = await tx.group.findFirst({
        where: {
          isArchived: false,
          memberCount: { lt: DEFAULT_CAPACITY },
          ...(primaryTag
            ? {
                name: {
                  startsWith: primaryTag,
                  mode: 'insensitive'
                }
              }
            : {})
        },
        orderBy: { memberCount: 'asc' }
      });

      if (!candidate) {
        candidate = await tx.group.create({
          data: {
            name: buildGroupName(primaryTag),
            capacity: DEFAULT_CAPACITY
          }
        });
      }

      const membership = await tx.membership.findUnique({
        where: {
          userId_groupId: {
            userId,
            groupId: candidate.id
          }
        }
      });

      if (!membership) {
        await tx.membership.create({
          data: {
            userId,
            groupId: candidate.id
          }
        });
        await tx.group.update({
          where: { id: candidate.id },
          data: { memberCount: { increment: 1 } }
        });
      }

      logger.debug({ userId, groupId: candidate.id }, 'User assigned to group');
      return candidate;
    });
  }
};
