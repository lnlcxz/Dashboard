import { FastifyPluginAsync } from 'fastify';
import { prisma } from '@findash/database';

export const usersRoutes: FastifyPluginAsync = async (server) => {
  // Rota protegida: GET /api/users/me
  // Retorna os dados do usuário e seus workspaces. Cria automaticamente no primeiro acesso.
  server.get('/me', { preValidation: [server.authenticate] }, async (request, reply) => {
    const supabaseUser = request.user!;
    
    try {
      // 1. Verifica se o usuário já existe na tabela tb_users
      let user = await prisma.user.findUnique({
        where: { id: supabaseUser.id }
      });

      // 2. Se não existir, cria o usuário e o Workspace padrão dele
      if (!user) {
        const email = supabaseUser.email || '';
        const fullName = supabaseUser.user_metadata?.full_name || email.split('@')[0] || 'Usuário';
        
        user = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              id: supabaseUser.id,
              email: email,
              username: email.split('@')[0] + Math.floor(Math.random() * 10000),
              fullName: fullName,
            }
          });

          const workspace = await tx.workspace.create({
            data: {
              name: 'Meu Dashboard',
              slug: 'meu-dashboard-' + newUser.id.substring(0, 8),
            }
          });

          await tx.workspaceMember.create({
            data: {
              userId: newUser.id,
              workspaceId: workspace.id,
              role: 'owner'
            }
          });

          return newUser;
        });
      }

      // 3. Busca os workspaces que o usuário tem acesso
      const userWorkspaces = await prisma.workspaceMember.findMany({
        where: { userId: user.id },
        include: { workspace: true }
      });

      return {
        user,
        workspaces: userWorkspaces.map(w => ({
          id: w.workspace.id,
          name: w.workspace.name,
          slug: w.workspace.slug,
          role: w.role
        }))
      };
    } catch (error) {
      server.log.error(error);
      return reply.status(500).send({ error: 'Erro interno ao processar usuário' });
    }
  });
};
