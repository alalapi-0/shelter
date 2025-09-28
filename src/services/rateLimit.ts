import type { FastifyReply, FastifyRequest } from 'fastify';
import type { Redis as RedisClient } from 'ioredis';

export type RateLimitConfig = {
  limit: number;
  windowInSeconds: number;
  keyGenerator: (request: FastifyRequest) => string | Promise<string>;
};

export const createRateLimiter = (redis: RedisClient) => {
  return ({ limit, windowInSeconds, keyGenerator }: RateLimitConfig) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const key = await keyGenerator(request);
      const redisKey = `ratelimit:${key}:${Math.floor(Date.now() / (windowInSeconds * 1000))}`;

      const requests = await redis.incr(redisKey);
      if (requests === 1) {
        await redis.expire(redisKey, windowInSeconds);
      }

      if (requests > limit) {
        reply.code(429).send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Allowance is ${limit} per ${windowInSeconds} seconds.`
        });
        return reply;
      }

      return undefined;
    };
  };
};
