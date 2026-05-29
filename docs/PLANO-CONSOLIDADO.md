# PLANO CONSOLIDADO FINAL — Dashboard Open Finance

> **Versão:** 1.0 Final (Unificação Claude + Cursor)
> **Data:** Maio 2026
> **Status:** Aprovado para desenvolvimento
> **Destinado a:** IA de programação (Cursor) para implementação

---

## SUMÁRIO EXECUTIVO

### Objetivo do Produto

Dashboard financeiro de alta performance integrado ao **Open Finance Brasil (OFB)**, permitindo:

- Conectar múltiplas instituições bancárias via OAuth 2.0
- Sincronizar transações automaticamente
- Visualizar dados com gráficos interativos
- Categorizar gastos inteligentemente
- Definir e monitorar orçamentos
- Detectar assinaturas recorrentes
- Projetar fluxo de caixa futuro
- Garantir compliance LGPD

### Fases de Entrega

```
FASE 1 (MVP) — Épicos 0, 1, 2, 3
  Entrega: usuário conecta banco, sincroniza e filtra transações
  Duração: ~10 semanas (1 dev) | ~5 semanas (2 devs)

FASE 2 (Dashboard Completo) — Épicos 4, 5, 6
  Entrega: visualizações, categorização inteligente, orçamentos
  Duração: ~8 semanas (1 dev) | ~4 semanas (2 devs)

FASE 3 (Inteligência) — Épicos 7, 8
  Entrega: detecção de assinaturas, projeção de caixa
  Duração: ~4 semanas (1 dev) | ~2 semanas (2 devs)

FASE 4 (Compliance & Produção) — Épicos 9, 10, 11
  Entrega: LGPD, notificações, observabilidade, produção
  Duração: ~6 semanas (1 dev) | ~3 semanas (2 devs)

TOTAL: 28 semanas (7 meses) solo | 14 semanas (3.5 meses) dupla
```

---

## 1. STACK TECNOLÓGICA

### Backend

```yaml
Runtime: Node.js 20 LTS
Linguagem: TypeScript (strict mode)
Framework: Fastify 4.x
ORM: Prisma 5.x
Banco de dados: PostgreSQL 15 (via Supabase)
Filas: BullMQ 4.x + Redis 7.x
Autenticação: Supabase Auth (JWT + Refresh Token)
Validação: Zod 3.x
Cache: Redis 7.x
```

### Frontend Web

```yaml
Framework: Next.js 14 (App Router)
Linguagem: TypeScript (strict mode)
UI Library: shadcn/ui + Tailwind CSS 3.x
Gerenciamento de Estado: Zustand 4.x (UI/sessão) + TanStack Query 5.x (dados)
Gráficos: Apache ECharts 5.x
Formulários: React Hook Form 7.x + Zod
Virtualização: react-window ou @tanstack/react-virtual
```

### Mobile (Futuro)

```yaml
Framework: Expo (React Native)
Listas: FlashList
Gráficos: Victory Native + Skia
Navegação: Expo Router
```

### Infraestrutura

```yaml
Monorepo: pnpm workspaces + Turborepo
CI/CD: GitHub Actions
Hosting Web: Vercel
Hosting API: Railway ou Render
Secrets: Doppler
Observabilidade: Sentry + Betterstack + Grafana/APM
Container local: Docker + Docker Compose
```

---

## 2. ARQUITETURA DO MONOREPO

### Estrutura de Diretórios

```
dashboard-openfinance/
│
├── apps/
│   ├── web/                              # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── callback/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── reset-password/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx            # Protected layout
│   │   │   │   ├── page.tsx              # Overview/Home
│   │   │   │   ├── transactions/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   ├── budgets/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── connections/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── settings/
│   │   │   │       ├── page.tsx
│   │   │       └── privacy/
│   │   │           └── page.tsx
│   │   │   │
│   │   │   └── api/                      # BFF (Backend for Frontend)
│   │   │       └── [...proxy]/
│   │   │           └── route.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                       # shadcn components
│   │   │   ├── charts/                   # ECharts wrappers
│   │   │   ├── transactions/
│   │   │   ├── budgets/
│   │   │   └── layout/
│   │   │
│   │   ├── hooks/
│   │   ├── stores/                       # Zustand stores
│   │   ├── lib/
│   │   └── public/
│   │
│   └── mobile/                           # Expo (futuro)
│
├── packages/
│   ├── shared/                           # Código compartilhado
│   └── adapters/                         # Adapter Pattern
│
├── services/
│   ├── api/                              # Fastify API
│   └── workers/                          # BullMQ Jobs
│
├── infra/
│   ├── docker-compose.yml
│   └── docker-compose.test.yml
│
├── docs/
│   ├── PLANO-CONSOLIDADO.md              # Este documento
│   ├── openapi.yaml
│   ├── architecture.md
│   ├── lgpd-compliance.md
│   └── open-finance-brasil.md
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .github/workflows/
├── CHANGELOG.md
├── README.md
├── turbo.json
└── pnpm-workspace.yaml
```

> A árvore completa de arquivos (rotas, controllers, jobs, adapters por banco) está detalhada na versão aprovada v1.0 — ver seções 3–12 abaixo e documentos complementares a criar nos épicos correspondentes.

---

## 3. MODELAGEM DE DADOS

### 3.1 Princípios Arquiteturais (Não Negociáveis)

| Área | Decisão | Justificativa |
|------|---------|---------------|
| **Valores monetários** | BIGINT em centavos | Evita erros de floating point |
| **Datas** | TIMESTAMPTZ (UTC) no banco | Normalização universal |
| **Exclusão** | Soft delete (`deleted_at`) | Trilhas de auditoria, LGPD |
| **Exceção** | `tb_audit_log` sem soft delete | Logs são imutáveis |
| **Isolamento** | Row Level Security (RLS) | Multitenancy nativo do Postgres |
| **Tokens OAuth** | AES-256 + IV único | Segurança máxima |
| **Idempotência** | `id_banco_origem` único | Evita duplicação de transações |
| **Índices** | B-Tree compostos | Performance em queries críticas |

### 3.2 Tabelas (16)

1. `tb_users` — MFA, locale, timezone, prefs, lock de login, role, username
2. `tb_workspaces` — Multi-tenant, nome da família/empresa
3. `tb_workspace_members` — Relação usuário <-> workspace (role)
4. `tb_audit_log` — imutável, LGPD
5. `tb_institutions` — ISPB, slug, adapter_class (BaaS Aggregator)
6. `tb_connections` — Auth BaaS, sync status
7. `tb_accounts` — saldos em centavos, external_id, credit card rules
8. `tb_sync_log` — rastreio de execuções de sync
9. `tb_categories` — hierárquicas, sistema + workspace
10. `tb_transactions` — merchant, tipo, status, recorrência, FTS
11. `tb_rules` — motor de categorização
12. `tb_budgets` — orçamentos com alert_at_pct
13. `tb_recurring_groups` — assinaturas detectadas
14. `tb_forecast_snapshots` — projeções 30/90 dias
15. `tb_notifications` — in-app
16. `tb_webhook_events` — idempotência de webhooks

**Modelo de Dados:** Orientado a `workspace_id` (B2B / Compartilhamento Familiar).
**RLS:** `auth.uid()` deve estar vinculado às permissões em `tb_workspace_members`.

**RLS:** `auth.uid()` deve corresponder a `tb_users.id` (recomendado: mesmo UUID do Supabase Auth).

**Ordem de migration:** criar `tb_categories` antes de `tb_transactions` (FK).

**DDL completo:** [docs/schema/01-tables.sql](./schema/01-tables.sql) (13 tabelas + `tb_webhook_events`).

Políticas RLS (`auth.uid() = user_id`) e índices adicionais: aplicar conforme plano v1.0 no Épico 0 via Supabase/Prisma.

---

## 4. SEGURANÇA — CHECKLIST

| Categoria | Itens |
|-----------|--------|
| Transporte | TLS 1.3, HSTS, CSP, CORS |
| Auth | JWT Supabase, refresh, MFA em ações destrutivas, rate limit 5/15min/IP, CSRF |
| Dados | AES-256 + IV, RotateKeysJob (90 dias), Doppler |
| Validação | Zod back/front, Prisma contra SQL injection |
| Webhooks | HMAC-SHA256, idempotência, resposta &lt; 5s, processamento async |
| OFB | mTLS, timeout 1500ms |

---

## 5. OPEN FINANCE (VIA AGREGADOR BAAS)

- Parceiro: Agregador BaaS (ex: Belvo, Pluggy ou Klavi)
- Vantagens: Sandbox unificado com mock data, zero burocracia de FAPI 2.0 / certificados DCR / mTLS no MVP.
- Endpoints: Integração via SDK/API do agregador.
- Webhooks: Recebimento de eventos unificados do agregador (ex: `TRANSACTIONS_SYNCED`).
- Desenvolvimento offline: fixtures JSON do próprio SDK do BaaS.

---

## 6. JOBS BULLMQ (8)

| Job | Trigger | Épico |
|-----|---------|-------|
| `SyncBankJob` | Manual / Webhook | 2 |
| `RefreshTokenJob` | Cron ~50 min | 2 |
| `RotateKeysJob` | Cron 90 dias | 2 |
| `RefreshConsentJob` | Cron diário | 2 |
| `DetectRecurringJob` | Cron diário 2h | 7 |
| `ForecastJob` | Semanal + pós-sync | 8 |
| `BudgetAlertJob` | Cron diário 8h | 6 |
| `CleanupOldJobsJob` | Cron semanal | 11 |

---

## 7. ALGORITMOS DE NEGÓCIO

### Recorrência (Épico 7)

- Mesmo merchant (nome normalizado + CNPJ)
- Valor ±5%
- Intervalo 7 / 14 / 30 / 365 dias (±3 dias)
- Mínimo 2 ocorrências

### Previsão de caixa (Épico 8)

- Média móvel ponderada 3 meses (pesos 3, 2, 1)
- Entradas/saídas fixas por recorrência
- Variável por categoria
- Horizontes 30 e 90 dias; recalcular após sync

---

## 8. MÉTRICAS DE PERFORMANCE

Baseline: **Motorola Moto G** (4 GB RAM, 3G lento).

| Métrica | Meta |
|---------|------|
| TTI | &lt; 3s |
| FCP | &lt; 1,5s |
| FPS no scroll | ≥ 55 |
| 10k transações | Sem jank (virtualização) |
| Bundle inicial (gzip) | &lt; 200 KB |
| RAM contínua | &lt; 150 MB |
| Lighthouse | ≥ 90 |

---

## 9. FRONTEND

### Stores Zustand (6)

`useAuthStore`, `useConnectionsStore`, `useTransactionStore`, `useFilterStore`, `useBudgetStore`, `useUIStore`

**Regra:** dados de API apenas via TanStack Query (`apps/web/lib/api.ts`). Na v5, usar `gcTime` em vez de `cacheTime`.

### Rotas App Router

`(auth)/login`, `callback`, `reset-password` · `(dashboard)/`, `transactions`, `budgets`, `connections`, `reports`, `settings`, `settings/privacy` · `api/[...proxy]`

### Gráficos (Épico 4 — ECharts)

Linha, rosca, waterfall, barras empilhadas, KPI cards, treemap, heatmap.

---

## 10. ÉPICOS E SPRINTS

### FASE 1 — MVP (Épicos 0–3, ~10 sem)

- **0 — Fundação:** monorepo, Docker, Prisma, CI, CHANGELOG, README
- **1 — Auth:** Supabase, rotas auth, MFA prep, telas login/cadastro/reset, E2E
- **2 — Bancos:** integração SDK Agregador BaaS, webhooks de sync, adapters unificados
- **3 — Transações:** API cursor + filtros + bulk, lista virtualizada, filtros na URL

### FASE 2 — Dashboard (Épicos 4–6, ~8 sem)

- **4 — Visualizações:** reports API + ECharts + cache Redis
- **5 — Categorização:** regras, auto-categorização, CRUD categorias
- **6 — Orçamentos:** CRUD, progress, BudgetAlertJob

### FASE 3 — Inteligência (Épicos 7–8, ~4 sem)

- **7 — Assinaturas:** DetectRecurringJob, subscriptions API/UI
- **8 — Forecast:** ForecastJob, snapshots, gráfico de projeção

### FASE 4 — Compliance (Épicos 9–11, ~6 sem)

- **9 — LGPD:** export, revogação, exclusão, audit log, painel privacidade
- **10 — Notificações:** in-app + email, preferências
- **11 — Qualidade:** cobertura ≥80%, Playwright, carga, Sentry, APM, Lighthouse

---

## 11. CONVENÇÕES

- **CHANGELOG** obrigatório a cada alteração (build Debug/Release, testes, cobertura)
- **Commits:** Conventional Commits; apenas quando solicitado
- **Testes:** em `tests/`, separados de produção
- **Seeds:** apenas Dev/Staging, nunca produção
- **Validação de build** ao final de cada épico

---

## 12. DEPENDÊNCIAS CRÍTICAS

| Dependência | Para |
|-------------|------|
| Conta Supabase | Épico 1 |
| Conta Doppler | Épico 0 |
| Conta Agregador BaaS | Épico 2 (Chaves de API) |
| Fluxo de Criação de Workspaces | Épico 1 (Auth) |

**Sem sandbox no BaaS:** usar mocks do próprio provedor (ex: Belvo sandbox links).

---

## 13. CHECKLIST DE APROVAÇÃO

- [x] Stack definida
- [x] Estrutura de monorepo
- [x] 16 tabelas (Multi-tenant Workspaces + Cartão de Crédito)
- [x] Segurança via Agregador BaaS
- [x] 8 jobs BullMQ
- [x] Algoritmos recorrência e forecast
- [x] Métricas Moto G
- [x] 12 épicos, 4 fases, 28/14 semanas
- [x] Convenções e stores
- [x] LGPD Épico 9

---

## Próximo passo

Após aprovação: iniciar **Épico 0** (Fundação). Nenhuma feature antes do CI verde.

---

## Anexos no repositório

| Arquivo | Conteúdo |
|---------|----------|
| [PLANO-CONSOLIDADO-FONTE.md](./PLANO-CONSOLIDADO-FONTE.md) | Plano-fonte completo com exemplos TypeScript |
| [schema/01-tables.sql](./schema/01-tables.sql) | DDL das 14 tabelas (incl. webhooks) |
| [CHANGELOG.md](../CHANGELOG.md) | Histórico de alterações do projeto |

---

**Fim do Plano Consolidado Final** — *Versão 1.0, Maio 2026*
