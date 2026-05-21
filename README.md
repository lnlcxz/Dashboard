# Dashboard Open Finance

Dashboard financeiro integrado ao **Open Finance Brasil (OFB)** — planejamento aprovado, implementação por fases (Épicos 0–11).

## Documentação

| Documento | Descrição |
|-----------|-----------|
| [docs/PLANO-CONSOLIDADO.md](./docs/PLANO-CONSOLIDADO.md) | Plano técnico consolidado v1.0 (índice resumido) |
| [docs/PLANO-CONSOLIDADO-FONTE.md](./docs/PLANO-CONSOLIDADO-FONTE.md) | Plano-fonte completo (épicos, exemplos TypeScript/SQL, checklist) |
| [docs/schema/01-tables.sql](./docs/schema/01-tables.sql) | DDL SQL executável das tabelas |
| [docs/SETUP-PASSO-1.md](./docs/SETUP-PASSO-1.md) | Pré-requisitos: Node, pnpm, Docker, Supabase |

## Status

- **Fase atual:** Passo 1 — Pré-requisitos ([guia](./docs/SETUP-PASSO-1.md))
- **Próximo passo:** Épico 0 — Fundação (após checklist do Passo 1)

### Verificar ambiente (Windows)

```powershell
cd c:\Projetos\Dashboard
.\scripts\verify-prerequisites.ps1
```

```powershell
copy .env.example .env
# Edite .env com credenciais Supabase (não commitar)
```

## Stack (resumo)

- **Monorepo:** pnpm + Turborepo
- **Backend:** Node 20, Fastify, Prisma, PostgreSQL (Supabase), BullMQ, Redis
- **Frontend:** Next.js 14, shadcn/ui, Zustand, TanStack Query, ECharts

## Convenções

- Atualizar [CHANGELOG.md](./CHANGELOG.md) a cada alteração relevante
- Commits apenas quando solicitado explicitamente
