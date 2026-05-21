# PLANO CONSOLIDADO FINAL — Dashboard Open Finance

> **Versão:** 1.0 Final (Unificação Claude + Cursor)  
> **Data:** Maio 2026  
> **Status:** Aprovado para desenvolvimento  
> **Destinado a:** IA de programação (Cursor) para implementação  
> **Tipo:** Documento-fonte completo (texto integral + exemplos de código)

---

> **Relacionado:** [PLANO-CONSOLIDADO.md](./PLANO-CONSOLIDADO.md) (índice resumido) · [schema/01-tables.sql](./schema/01-tables.sql) (DDL executável)

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
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── callback/page.tsx
│   │   │   │   └── reset-password/page.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── transactions/page.tsx
│   │   │   │   ├── transactions/[id]/page.tsx
│   │   │   │   ├── budgets/page.tsx
│   │   │   │   ├── connections/page.tsx
│   │   │   │   ├── reports/page.tsx
│   │   │   │   └── settings/page.tsx
│   │   │   │   └── settings/privacy/page.tsx
│   │   │   └── api/[...proxy]/route.ts
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── charts/ (LineChart, DonutChart, WaterfallChart, KPICard)
│   │   │   ├── transactions/
│   │   │   ├── budgets/
│   │   │   └── layout/ (Header, Sidebar, NotificationBell)
│   │   ├── hooks/ (useTransactions, useBudgets, useConnections)
│   │   ├── stores/ (6 Zustand stores)
│   │   ├── lib/ (api.ts, supabase.ts, formatters.ts, validators.ts)
│   │   └── public/institutions/
│   └── mobile/                           # Expo (futuro)
│
├── packages/
│   ├── shared/ (types, schemas Zod, utils currency/date/math)
│   └── adapters/ (BankAdapter, nubank, itau, bradesco, inter + fixtures)
│
├── services/
│   ├── api/ (Fastify: routes, controllers, services, middleware, prisma)
│   └── workers/ (BullMQ jobs + queues)
│
├── infra/ (docker-compose.yml, docker-compose.test.yml, k8s/)
├── docs/
├── tests/ (unit, integration, e2e/playwright)
├── .github/workflows/ (ci.yml, deploy.yml)
├── CHANGELOG.md
├── README.md
├── turbo.json
└── pnpm-workspace.yaml
```

### Rotas API (Fastify)

```
auth.routes.ts
accounts.routes.ts
transactions.routes.ts
budgets.routes.ts
connections.routes.ts
consents.routes.ts          # Open Finance Brasil
reports.routes.ts
categories.routes.ts
subscriptions.routes.ts
forecast.routes.ts
notifications.routes.ts
privacy.routes.ts
institutions.routes.ts
webhooks.routes.ts
```

### Jobs (Workers)

```
SyncBankJob.ts
RefreshTokenJob.ts
DetectRecurringJob.ts
ForecastJob.ts
BudgetAlertJob.ts
RotateKeysJob.ts            # Rotação AES a cada 90 dias
RefreshConsentJob.ts        # Refresh OFB a cada 12 meses
CleanupOldJobsJob.ts
```

## 3. MODELAGEM DE DADOS

### 3.1 Princípios Arquiteturais (Não Negociáveis)

| Área | Decisão | Justificativa |
|------|---------|---------------|
| Valores monetários | BIGINT em centavos | Evita floating point |
| Datas | TIMESTAMPTZ (UTC) | Normalização universal |
| Exclusão | Soft delete (`deleted_at`) | Auditoria, LGPD |
| Exceção | `tb_audit_log` imutável | Logs não deletáveis |
| Isolamento | RLS | Multitenancy Postgres |
| Tokens OAuth | AES-256 + IV único | Segurança máxima |
| Idempotência | `id_banco_origem` | Sem duplicatas |
| Índices | B-Tree compostos | Performance |

### 3.2 Schema SQL Completo

> **DDL executável:** ver também [schema/01-tables.sql](./schema/01-tables.sql).  
> **RLS:** `auth.uid()` = `tb_users.id` (mesmo UUID do Supabase Auth).  
> **Ordem FK:** `tb_categories` antes de `tb_transactions`.

#### 3.2.1 `tb_users`

```sql
CREATE TABLE tb_users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email              TEXT UNIQUE NOT NULL,
  full_name          TEXT NOT NULL,
  avatar_url         TEXT,
  mfa_enabled        BOOLEAN DEFAULT false,
  mfa_secret         TEXT,
  locale             VARCHAR(10) DEFAULT 'pt-BR',
  timezone           VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  notification_prefs JSONB DEFAULT '{"email": true, "push": false}',
  last_login_at      TIMESTAMPTZ,
  failed_login_count INTEGER DEFAULT 0,
  locked_until       TIMESTAMPTZ,
  role               VARCHAR(20) DEFAULT 'user',
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);
CREATE INDEX idx_users_email ON tb_users(email) WHERE deleted_at IS NULL;
ALTER TABLE tb_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own data" ON tb_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON tb_users FOR UPDATE USING (auth.uid() = id);
```

#### 3.2.2 `tb_audit_log`

```sql
CREATE TABLE tb_audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES tb_users(id),
  action         VARCHAR(100) NOT NULL,
  resource_type  VARCHAR(50),
  resource_id    UUID,
  ip_address     INET,
  user_agent     TEXT,
  metadata       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
-- Sem soft delete
CREATE INDEX idx_audit_user_id ON tb_audit_log(user_id);
CREATE INDEX idx_audit_created_at ON tb_audit_log(created_at DESC);
ALTER TABLE tb_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON tb_audit_log FOR SELECT USING (auth.uid() = user_id);
```

#### 3.2.3 a 3.2.13 — Demais tabelas

Tabelas: `tb_institutions`, `tb_connections`, `tb_accounts`, `tb_sync_log`, `tb_categories`, `tb_transactions`, `tb_rules`, `tb_budgets`, `tb_recurring_groups`, `tb_forecast_snapshots`, `tb_notifications`.

Scripts completos com índices e RLS: [schema/01-tables.sql](./schema/01-tables.sql).

#### 3.2.14 `tb_webhook_events` (Épico 2)

```sql
CREATE TABLE tb_webhook_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id   UUID REFERENCES tb_institutions(id) NOT NULL,
  webhook_event_id TEXT NOT NULL,
  payload_hash     TEXT,
  processed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_webhook_event UNIQUE (institution_id, webhook_event_id)
);
```

---

## 4. SEGURANÇA — CHECKLIST COMPLETO

### 4.1 Transporte e Infraestrutura

| Item | Descrição | Épico |
|------|-----------|-------|
| TLS 1.3 | Obrigatório em produção | 0 |
| HSTS | Strict-Transport-Security | 0 |
| CSP | Content Security Policy | 1 |
| CORS | Whitelist de origens | 0 |

### 4.2 Autenticação

| Item | Implementação | Épico |
|------|---------------|-------|
| JWT | Supabase Auth, Bearer header | 1 |
| Refresh Token | Interceptor frontend | 1 |
| MFA | TOTP em ações destrutivas | 2, 9 |
| Rate Limit | 5 req / 15 min / IP | 1 |
| CSRF | POST/PUT/DELETE | 1 |
| RLS | Políticas Postgres | 0 |

### 4.3 Dados Sensíveis

| Item | Implementação | Épico |
|------|---------------|-------|
| AES-256 | `crypto.ts` | 2 |
| IV único | Coluna `iv` em `tb_connections` | 2 |
| Rotação de chaves | `RotateKeysJob` (90 dias) | 2 |
| Secrets | Doppler | 0 |

### 4.4 Webhooks

| Item | Implementação | Épico |
|------|---------------|-------|
| HMAC-SHA256 | Validação no endpoint | 2 |
| Idempotência | `webhook_event_id` | 2 |
| Timeout | Resposta 200 em < 5s, async | 2 |

---

## 5. OPEN FINANCE BRASIL (OFB)

### 5.1 Regulamentação

- BCB nº 1 e Circular 4.015
- Certificação FAPI 2.0 (OpenID Foundation)
- SLA: resposta bancária < 1500ms

### 5.2 mTLS

```typescript
// services/api/src/lib/httpClient.ts
import axios from 'axios';
import https from 'https';
import fs from 'fs';

const httpsAgent = new https.Agent({
  cert: fs.readFileSync(process.env.OFB_CERT_PATH!),
  key: fs.readFileSync(process.env.OFB_KEY_PATH!),
  ca: fs.readFileSync(process.env.OFB_CA_PATH!),
});

export const ofbClient = axios.create({
  httpsAgent,
  timeout: 1500,
});
```

### 5.3 Fluxo de Consentimento

```typescript
// POST /consents
{
  "data": {
    "permissions": ["ACCOUNTS_READ", "ACCOUNTS_BALANCES_READ", "RESOURCES_READ"],
    "expirationDateTime": "2027-05-19T00:00:00Z",
    "transactionFromDateTime": "2024-01-01T00:00:00Z",
    "transactionToDateTime": "2026-05-19T23:59:59Z"
  }
}
```

```typescript
// services/api/src/routes/consents.routes.ts
export async function consentsRoutes(fastify: FastifyInstance) {
  const consentService = new ConsentService();

  fastify.post('/consents', async (request) => {
    const { institutionId, permissions } = request.body;
    const userId = request.user.id;
    const consent = await consentService.createConsent({
      userId,
      institutionId,
      permissions,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
    return { consent };
  });

  fastify.get('/consents/:id', async (request) => {
    return { consent: await consentService.getConsent(request.params.id, request.user.id) };
  });

  fastify.delete('/consents/:id', async (request) => {
    await consentService.revokeConsent(request.params.id, request.user.id);
    return { success: true };
  });
}
```

### 5.4 Escopos OFB

| Escopo | Descrição |
|--------|-----------|
| `accounts` | Contas |
| `accounts.balances` | Saldos |
| `credit-cards-accounts` | Cartões |
| `credit-cards-accounts.bills.transactions` | Transações de cartão |
| `loans` | Empréstimos |
| `resources` | Status da API |

### 5.5 RefreshConsentJob (12 meses)

```typescript
// services/workers/src/jobs/RefreshConsentJob.ts
export async function RefreshConsentJob(job: Job) {
  const expiring = await consentService.getExpiringConsents(7);
  for (const consent of expiring) {
    try {
      await consentService.renewConsent(consent.id);
    } catch (error) {
      await notificationService.create({
        userId: consent.userId,
        type: 'consent_expiring',
        title: 'Renovação de consentimento necessária',
        message: `O consentimento com ${consent.institution.name} expira em breve.`,
      });
    }
  }
}
```

### 5.6 Diretório de Participantes

- Produção: https://data.directory.openbankingbrasil.org.br
- Sandbox: https://data.sandbox.directory.openbankingbrasil.org.br

## 6. JOBS EM BACKGROUND (BullMQ)

### 6.1 Lista de Jobs

| Job | Trigger | Frequência | Épico |
|-----|---------|------------|-------|
| SyncBankJob | Manual / Webhook | On-demand | 2 |
| RefreshTokenJob | Cron | ~50 min | 2 |
| RotateKeysJob | Cron | 90 dias | 2 |
| RefreshConsentJob | Cron | Diário | 2 |
| DetectRecurringJob | Cron | Diário 2h | 7 |
| ForecastJob | Cron + pós-sync | Semanal | 8 |
| BudgetAlertJob | Cron | Diário 8h | 6 |
| CleanupOldJobsJob | Cron | Semanal | 11 |

### 6.2 Filas

```typescript
// services/workers/src/queues/index.ts
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL!);

export const syncQueue = new Queue('sync', { connection });
export const tokenQueue = new Queue('token', { connection });
export const recurringQueue = new Queue('recurring', { connection });
export const forecastQueue = new Queue('forecast', { connection });
export const budgetQueue = new Queue('budget', { connection });
export const maintenanceQueue = new Queue('maintenance', { connection });
```

### 6.3 SyncBankJob

```typescript
// services/workers/src/jobs/SyncBankJob.ts
export async function SyncBankJob(job: Job) {
  const { connectionId, userId } = job.data;
  const syncService = new SyncService();

  try {
    await syncService.syncConnection(connectionId);
    await forecastQueue.add('generate', { userId });
  } catch (error) {
    console.error(`Sync failed for connection ${connectionId}:`, error);
    throw error;
  }
}
```

---

## 7. ALGORITMOS DE NEGÓCIO

### 7.1 Detecção de Recorrências (Épico 7)

**Critérios:**

- Mesmo merchant (nome normalizado + CNPJ)
- Valor ±5%
- Intervalo 7, 14, 30 ou 365 dias (±3 dias)
- Mínimo 2 ocorrências

```typescript
// services/workers/src/jobs/DetectRecurringJob.ts
export async function DetectRecurringJob(job: Job) {
  const users = await prisma.user.findMany({ where: { deleted_at: null } });

  for (const user of users) {
    const transactions = await prisma.transaction.findMany({
      where: { user_id: user.id, deleted_at: null },
      orderBy: { date: 'asc' },
    });

    const groups = groupByMerchant(transactions);

    for (const [merchant, txs] of Object.entries(groups)) {
      if (txs.length < 2) continue;

      const intervals = calculateIntervals(txs);
      const avgInterval = mean(intervals);
      const avgAmount = mean(txs.map((t) => t.amount));

      const isRecurring = intervals.every((interval) =>
        [7, 14, 30, 365].some((expected) => Math.abs(interval - expected) <= 3)
      );

      if (isRecurring) {
        const group = await prisma.recurring_group.create({
          data: {
            user_id: user.id,
            name: merchant,
            merchant_name: merchant,
            period: determinePeriod(avgInterval),
            average_amount: Math.round(avgAmount),
            first_occurrence: txs[0].date,
            last_occurrence: txs[txs.length - 1].date,
            next_expected: calculateNextExpected(txs[txs.length - 1].date, avgInterval),
          },
        });

        await prisma.transaction.updateMany({
          where: { id: { in: txs.map((t) => t.id) } },
          data: {
            is_recurring: true,
            recurring_period: determinePeriod(avgInterval),
            recurring_group_id: group.id,
          },
        });
      }
    }
  }
}

function determinePeriod(intervalDays: number): string {
  if (Math.abs(intervalDays - 7) <= 3) return 'weekly';
  if (Math.abs(intervalDays - 14) <= 3) return 'biweekly';
  if (Math.abs(intervalDays - 30) <= 3) return 'monthly';
  if (Math.abs(intervalDays - 365) <= 7) return 'yearly';
  return 'custom';
}
```

### 7.2 Previsão de Caixa (Épico 8)

**Técnica:** média móvel ponderada 3 meses (pesos 3, 2, 1).

```typescript
// services/workers/src/jobs/ForecastJob.ts
export async function ForecastJob(job: Job) {
  const { userId } = job.data;

  const transactions = await prisma.transaction.findMany({
    where: {
      user_id: userId,
      date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      deleted_at: null,
    },
    include: { category: true },
  });

  const recurring = transactions.filter((t) => t.is_recurring);
  const fixedIncome = recurring.filter((t) => t.transaction_type === 'credit');
  const fixedExpenses = recurring.filter((t) => t.transaction_type === 'debit');
  const variable = transactions.filter((t) => !t.is_recurring);
  const byCategory = groupBy(variable, 'category_id');

  const variableByCategory = Object.entries(byCategory).map(([catId, txs]) => ({
    categoryId: catId,
    avgAmount: weightedAverage(txs, 3),
    confidence: calculateConfidence(txs),
  }));

  for (const horizonDays of [30, 90]) {
    const projectedIncome = calculateProjected(fixedIncome, horizonDays);
    const projectedExpense =
      calculateProjected(fixedExpenses, horizonDays) +
      variableByCategory.reduce((sum, v) => sum + v.avgAmount * (horizonDays / 30), 0);

    const currentBalance = await getCurrentBalance(userId);
    const projectedBalance = currentBalance + projectedIncome - projectedExpense;

    await prisma.forecast_snapshot.create({
      data: {
        user_id: userId,
        forecast_date: new Date(),
        horizon_days: horizonDays,
        projected_balance: Math.round(projectedBalance),
        projected_income: Math.round(projectedIncome),
        projected_expense: Math.round(projectedExpense),
        confidence_score: calculateOverallConfidence(variableByCategory),
        algorithm_version: 'v1',
      },
    });
  }
}

function weightedAverage(txs: Transaction[], months: number): number {
  const weights = [3, 2, 1];
  const now = Date.now();
  const byMonth = txs.reduce((acc, tx) => {
    const monthsAgo = Math.floor((now - tx.date.getTime()) / (30 * 24 * 60 * 60 * 1000));
    if (monthsAgo < months) acc[monthsAgo] = (acc[monthsAgo] || 0) + tx.amount;
    return acc;
  }, {} as Record<number, number>);
  const weightedSum = Object.entries(byMonth).reduce(
    (sum, [monthsAgo, amount]) => sum + amount * weights[Number(monthsAgo)],
    0
  );
  const totalWeight = weights.slice(0, Object.keys(byMonth).length).reduce((a, b) => a + b, 0);
  return weightedSum / totalWeight;
}
```

---

## 8. MÉTRICAS DE PERFORMANCE

### Baseline: Motorola Moto G

```yaml
Processador: Snapdragon 680 ou equivalente
RAM: 4 GB
Rede: 4G / 3G lento
```

| Métrica | Meta | Ferramenta |
|---------|------|------------|
| TTI | < 3s | Lighthouse |
| FCP | < 1.5s | Lighthouse |
| FPS scroll | ≥ 55 | React Profiler |
| 10k transações | Sem jank | Virtualização |
| Bundle gzip | < 200 KB | next build |
| RAM | < 150 MB | Chrome DevTools |
| Lighthouse | ≥ 90 | Lighthouse CI |

```typescript
// tests/e2e/performance.spec.ts
test('10k transactions render without jank', async ({ page }) => {
  await seedTransactions(10000);
  await page.goto('/dashboard/transactions');
  const fps = await page.evaluate(() => {
    return new Promise((resolve) => {
      let frameCount = 0;
      let lastTime = performance.now();
      function countFrame() {
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) resolve(frameCount);
        else requestAnimationFrame(countFrame);
      }
      window.scrollBy(0, 1000);
      requestAnimationFrame(countFrame);
    });
  });
  expect(fps).toBeGreaterThanOrEqual(55);
});
```

## 9. FRONTEND — STORES E ROTAS

### 9.1 useAuthStore

```typescript
// apps/web/stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setSession: (session: Session) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setSession: (session) => set({ session }),
      logout: () => set({ user: null, session: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);
```

### 9.2 useFilterStore

```typescript
// apps/web/stores/useFilterStore.ts
import { create } from 'zustand';

interface FilterStore {
  dateFrom: string | null;
  dateTo: string | null;
  categories: string[];
  accounts: string[];
  amountMin: number | null;
  amountMax: number | null;
  search: string;
  setFilter: (key: string, value: unknown) => void;
  resetFilters: () => void;
  syncWithURL: () => void;
}

export const useFilterStore = create<FilterStore>((set, get) => ({
  dateFrom: null,
  dateTo: null,
  categories: [],
  accounts: [],
  amountMin: null,
  amountMax: null,
  search: '',
  setFilter: (key, value) => {
    set({ [key]: value });
    get().syncWithURL();
  },
  resetFilters: () => {
    set({
      dateFrom: null,
      dateTo: null,
      categories: [],
      accounts: [],
      amountMin: null,
      amountMax: null,
      search: '',
    });
    get().syncWithURL();
  },
  syncWithURL: () => {
    const params = new URLSearchParams();
    const state = get();
    Object.entries(state).forEach(([key, value]) => {
      if (value && !['syncWithURL', 'setFilter', 'resetFilters'].includes(key)) {
        params.set(key, Array.isArray(value) ? value.join(',') : String(value));
      }
    });
    window.history.pushState({}, '', `?${params.toString()}`);
  },
}));
```

### 9.3 TanStack Query

```typescript
// apps/web/lib/api.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30, // v5 (antes: cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

```typescript
// apps/web/hooks/useTransactions.ts
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '@/stores/useFilterStore';

export function useTransactions() {
  const filters = useFilterStore();
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.set(key, String(value));
      });
      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    },
  });
}
```

### 9.4 LineChart (ECharts)

```typescript
// apps/web/components/charts/LineChart.tsx
'use client';
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

export function LineChart({ data }: { data: { date: string; value: number }[] }) {
  const chartRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: data.map((d) => d.date) },
      yAxis: { type: 'value' },
      series: [{ data: data.map((d) => d.value), type: 'line', smooth: true, areaStyle: { opacity: 0.3 } }],
    });
    return () => chart.dispose();
  }, [data]);
  return <motion.div ref={chartRef} style={{ width: '100%', height: 400 }} />;
}
```

> _Nota removida._ usar `<motion.div>` → `<motion.div>` no código real usar `<div>`.

### 9.5 Stores adicionais

- `useConnectionsStore` — bancos, status sync
- `useTransactionStore` — metadados cursor
- `useBudgetStore` — orçamentos
- `useUIStore` — modais, toasts, tema

---

## 10. ÉPICOS E SPRINTS (TAREFAS COMPLETAS)

### Épico 0 — Fundação (2 semanas)

```
[ ] Monorepo pnpm + Turborepo
[ ] ESLint + Prettier + TypeScript strict + .nvmrc Node 20
[ ] Docker Compose (Postgres + Redis) + docker-compose.test.yml
[ ] Supabase + Prisma schema + 1ª migration
[ ] Doppler + ambientes Dev/Staging/Prod
[ ] GitHub Actions (lint, type-check, test)
[ ] TLS 1.3, CORS Fastify
[ ] CHANGELOG + README
```

### Épico 1 — Auth (2 semanas)

**Backend:** Supabase Auth, POST register/login/logout/refresh, JWT middleware, rate limit, CSRF, CSP, tb_users pós-registro, seed categorias.

**Frontend:** login, cadastro, reset senha, rotas protegidas, useAuthStore, refresh interceptor, Error Boundary.

**Testes:** Zod unit, E2E login → dashboard.

### Épico 2 — Bancos (4 semanas)

**Backend:** institutions seed, BankAdapter, Nubank/Itau, crypto AES, OAuth initiate/callback, connections CRUD, consents OFB, mTLS.

**Workers:** SyncBankJob, RefreshTokenJob, RotateKeysJob, RefreshConsentJob, backoff, circuit breaker, tb_sync_log.

**Webhooks:** POST /webhooks/:institution_id, HMAC, idempotência, async.

**Frontend:** grid instituições, OAuth, gestão conexões, progresso sync.

**Testes:** fixtures JSON, unit adapters, retry, circuit breaker.

### Épico 3 — Transações (4 semanas)

**Backend:** GET cursor, filtros, FTS, PATCH single/bulk, summary, estornos.

**Frontend:** lista virtualizada, skeletons, filtros URL, debounce 300ms, optimistic UI, bulk select.

**Testes:** currency utils, E2E filtros, perf 10k.

### Épico 4 — Dashboard (4 semanas)

Reports API + cache Redis 5min, KPI cards, ECharts (linha, rosca, waterfall, barras), seletor período.

### Épico 5 — Categorização (2 semanas)

Seed categorias, tb_rules, auto-categorização, CRUD regras, retroatividade, UI gerenciador.

### Épico 6 — Orçamentos (2 semanas)

CRUD budgets, progress, BudgetAlertJob 80%, UI barras progresso.

### Épico 7 — Assinaturas (2 semanas)

DetectRecurringJob, tb_recurring_groups, GET/PATCH subscriptions, UI confirmação.

### Épico 8 — Forecast (2 semanas)

ForecastJob, GET /forecast, snapshots, gráfico projeção tracejada.

### Épico 9 — LGPD (2 semanas)

Export, revoke consent, delete account 30 dias, anonimização, audit log, painel privacidade.

### Épico 10 — Notificações (2 semanas)

tb_notifications, triggers, GET/PATCH notifications, sino + preferências.

### Épico 11 — Qualidade (2 semanas)

Cobertura ≥80%, Playwright E2E, carga 100 syncs, Sentry, APM >200ms, Lighthouse ≥90, bundle split, índices DB.

---

## 11. CONVENÇÕES DE PROJETO

### CHANGELOG (obrigatório)

```markdown
## [Unreleased]
### Added
- Endpoint POST /transactions/bulk
### Performance
- Build Debug: 3.2s → 2.8s
- Cobertura: 78% → 82%
```

### Commits — Conventional Commits

Apenas quando solicitado explicitamente.

### Seeds

```typescript
// services/api/prisma/seed.ts
async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Seeds não são executados em produção.');
    return;
  }
  // Seeds aqui...
}
```

### Fixtures offline (sem sandbox)

```json
// packages/adapters/src/nubank/nubank.fixtures.json
{
  "accounts": [{ "id": "a1b2c3d4", "type": "checking", "balance": 150000 }],
  "transactions": [{ "id": "tx001", "date": "2026-05-15T10:30:00Z", "amount": -5000, "description": "Supermercado ABC" }]
}
```

---

## 12. DEPENDÊNCIAS CRÍTICAS

| Dependência | Para | Deadline |
|-------------|------|----------|
| Conta Supabase | Épico 1 | Épico 0 |
| Conta Doppler | Épico 0 | Épico 0 |
| Sandbox bancos | Épico 2 testes reais | Antes Épico 2 |
| FAPI 2.0 + mTLS | Produção | Antes produção |
| Modelo negócio SaaS/pessoal | Épico 9 LGPD | Antes Épico 9 |

---

## 13. CHECKLIST DE APROVAÇÃO

- [x] Stack: Turborepo + pnpm + Fastify + Prisma + Supabase + Next.js 14 + BullMQ
- [x] Estrutura de pastas completa
- [x] 14 tabelas (13 + webhook_events)
- [x] Segurança: TLS, AES, IV, CSRF, rate limit, CSP
- [x] OFB: consents, mTLS, escopos, 12 meses, SLA 1500ms
- [x] 8 jobs BullMQ
- [x] Algoritmos recorrência e forecast
- [x] Performance Moto G
- [x] 12 épicos, 4 fases, 28/14 semanas
- [x] 6 stores + TanStack Query (gcTime v5)
- [x] ECharts + LGPD Épico 9

---

## Próximo passo

1. Iniciar **Épico 0** após autorização para codar  
2. CI verde antes de features  
3. Commits apenas quando solicitado  

---

**Fim do Plano Consolidado Final — Fonte Completa**  
*Versão 1.0 — Maio 2026*




