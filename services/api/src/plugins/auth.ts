import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { createClient, User } from '@supabase/supabase-js';

// Estende os tipos do Fastify para incluir a função de autenticação e o usuário
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user?: User;
  }
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const authPlugin: FastifyPluginAsync = async (server) => {
  server.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized: Missing or invalid token' });
      }

      const token = authHeader.replace('Bearer ', '');

      // Verifica o token JWT chamando o Supabase
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        server.log.error(error || 'User not found in Supabase for given token');
        return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
      }

      // Anexa o usuário à requisição para uso posterior nas rotas
      request.user = user;
    } catch (error) {
      server.log.error(error);
      return reply.status(401).send({ error: 'Unauthorized: Authentication failed' });
    }
  });
};

export default fp(authPlugin);
