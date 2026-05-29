import { FastifyPluginAsync } from 'fastify';
import { prisma } from '@findash/database';

export const healthRoutes: FastifyPluginAsync = async (server) => {
  server.get('/', async (request, reply) => {
    try {
      // Valida conexão com o banco
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected', timestamp: new Date().toISOString() };
    } catch (error) {
      server.log.error(error);
      reply.status(500).send({ status: 'error', database: 'disconnected' });
    }
  });
};
