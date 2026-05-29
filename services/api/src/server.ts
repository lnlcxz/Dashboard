import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { routes } from './routes';
import authPlugin from './plugins/auth';

const server = Fastify({
  logger: true
});

const start = async () => {
  try {
    // Registrar Plugins
    await server.register(authPlugin);
    
    // Configurações Globais
    await server.register(cors, {
      origin: '*', // Em produção, ajustar para a URL correta do web/mobile
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    });

    // Registrar Rotas Base da API
    await server.register(routes, { prefix: '/api' });

    // Iniciar Servidor
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('API Server running at http://localhost:3001');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
