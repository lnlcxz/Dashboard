import { FastifyPluginAsync } from 'fastify';
import { healthRoutes } from './health';
import { usersRoutes } from './users';

export const routes: FastifyPluginAsync = async (server) => {
  // Rota de Health Check
  server.register(healthRoutes, { prefix: '/health' });
  
  // Rotas de Usuário
  server.register(usersRoutes, { prefix: '/users' });
  
  // Rota raiz da API
  server.get('/', async () => {
    return { message: 'Welcome to FinDash API' };
  });
};
