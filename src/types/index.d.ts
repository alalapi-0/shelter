import 'fastify';
import type { FastifyReply, FastifyRequest as FastifyRequestType } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      shadowId: string;
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequestType, reply: FastifyReply) => Promise<unknown>;
  }
}
