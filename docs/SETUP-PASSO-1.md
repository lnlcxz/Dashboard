# Passo 1 — Pré-requisitos (antes do Épico 0)

Checklist para preparar o ambiente local e na nuvem. Marque cada item ao concluir.

**Seu ambiente (verificado em maio/2026):**

| Ferramenta | Status | Ação |
|------------|--------|------|
| Node.js | v24.14.1 instalado | Recomendado: **Node 20 LTS** (ver seção 1) |
| pnpm | Não encontrado | Instalar (seção 2) |
| Docker | Não encontrado | Instalar Docker Desktop (seção 3) |

Execute o script de verificação após cada instalação:

```powershell
cd c:\Projetos\Dashboard
.\scripts\verify-prerequisites.ps1
```

---

## 1. Node.js 20 LTS

O plano define **Node 20 LTS** (arquivo [`.nvmrc`](../.nvmrc) na raiz).

### Opção A — nvm-windows (recomendado)

1. Baixe: https://github.com/coreybutler/nvm-windows/releases
2. Instale o `nvm-setup.exe`
3. Em um terminal **novo** (PowerShell como administrador):

```powershell
nvm install 20
nvm use 20
node --version   # deve exibir v20.x.x
```

### Opção B — Instalador oficial

1. https://nodejs.org/ — baixe a versão **20 LTS**
2. Reinstale se hoje estiver apenas na v24

### Habilitar Corepack (gerencia pnpm)

```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm --version
```

---

## 2. pnpm

Se o Corepack não funcionar:

```powershell
npm install -g pnpm@9
pnpm --version
```

---

## 3. Docker Desktop (Windows)

Necessário para Postgres 15 + Redis 7 locais (Épico 0).

1. Baixe: https://www.docker.com/products/docker-desktop/
2. Instale e **reinicie o PC**
3. Abra Docker Desktop e aguarde status **Running**
4. No PowerShell:

```powershell
docker --version
docker compose version
```

### Teste rápido (após Épico 0)

```powershell
cd c:\Projetos\Dashboard\infra
docker compose up -d
```

---

## 4. Supabase (PostgreSQL + Auth)

### 4.1 Criar projeto

1. Acesse https://supabase.com/dashboard
2. **New project**
3. Nome sugerido: `dashboard-openfinance-dev`
4. Região: **South America (São Paulo)** se disponível
5. Defina senha forte do banco (guarde no gerenciador de senhas)

### 4.2 Copiar credenciais

Em **Project Settings → API**:

| Variável | Onde copiar |
|----------|-------------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role (⚠️ secreta, só backend) |

Em **Project Settings → Database → Connection string**:

| Variável | Formato |
|----------|---------|
| `DATABASE_URL` | URI **Transaction** pooler (porta 6543) para app |
| `DIRECT_URL` | URI **Session** (porta 5432) para migrations Prisma |

Exemplo (substitua `[PASSWORD]` e `[PROJECT_REF]`):

```
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### 4.3 Auth

Em **Authentication → Providers**:

- Habilite **Email**
- (Opcional) Configure URL do site: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/auth/callback`

### 4.4 RLS

As políticas do plano usam `auth.uid()`. O `tb_users.id` deve ser o **mesmo UUID** do usuário em `auth.users` (configurado no Épico 1).

---

## 5. Secrets — Doppler ou `.env` local

### Opção A — Doppler (recomendado pelo plano)

1. https://dashboard.doppler.com/ — criar conta
2. Projeto: `dashboard-openfinance`
3. Configs: `dev`, `staging`, `prd`
4. Importe variáveis do [`.env.example`](../.env.example)
5. CLI (opcional):

```powershell
# https://docs.doppler.com/docs/install-cli
doppler login
doppler setup
```

### Opção B — Arquivo local (dev)

```powershell
cd c:\Projetos\Dashboard
copy .env.example .env
# Edite .env com um editor — NUNCA commite o .env
```

---

## 6. Variáveis geradas localmente (Épico 0)

Gere antes do Épico 2 (criptografia OAuth):

```powershell
# AES-256 — 32 bytes em hex (64 caracteres)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

| Variável | Uso |
|----------|-----|
| `ENCRYPTION_KEY` | AES-256 tokens OAuth |
| `JWT_SECRET` | Se necessário além do Supabase |
| `CSRF_SECRET` | Tokens CSRF na API |

---

## 7. Contas opcionais (deploy futuro)

| Serviço | Quando | URL |
|---------|--------|-----|
| GitHub | CI/CD Épico 0 | https://github.com |
| Vercel | Deploy web | https://vercel.com |
| Railway ou Render | Deploy API/workers | https://railway.app |

Não são obrigatórias para concluir o Passo 1.

---

## 8. Open Finance (adiar para Épico 2)

| Item | Quando |
|------|--------|
| Sandbox bancos | Antes de testes reais no Épico 2 |
| Certificados mTLS (ICP-Brasil) | Antes de produção |
| FAPI 2.0 | Antes de produção |

Até lá: **fixtures JSON** nos adapters (`packages/adapters`).

---

## 9. Modelo de negócio (antes do Épico 9)

Decida se o produto é:

- **SaaS** — multi-tenant, termos de uso, DPA
- **Uso pessoal** — escopo LGPD simplificado

Anote a decisão em um comentário no `.env` ou documento interno.

---

## Checklist final do Passo 1

```
[ ] Node 20 LTS ativo (node --version)
[ ] pnpm instalado (pnpm --version)
[ ] Docker Desktop rodando (docker --version)
[ ] Projeto Supabase criado
[ ] DATABASE_URL e DIRECT_URL no .env
[ ] SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY no .env
[ ] .env criado a partir de .env.example (não commitado)
[ ] ENCRYPTION_KEY gerada
[ ] Script verify-prerequisites.ps1 sem erros críticos
```

---

## Próximo passo

Quando o checklist estiver completo, solicite:

> **"Implemente o Épico 0"**

Isso inicia o monorepo, Docker Compose, Prisma, CI e estrutura de pastas.
