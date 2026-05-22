# CHANGELOG

## [Unreleased] — 2026-05-22 (parser v2)

### Fixed

- **`csv-parser.js`** — Linhas com `VALOR_R$` contendo placeholders de agrupamento (`(incluído acima)`, `(incluído no total)`, `(variável...)`) eram geradas como erro no histórico; agora são **ignoradas silenciosamente** sem contabilizar erro e sem criar transação (evita double-counting)
- **`csv-parser.js`** — Adicionada função `isAmountPlaceholder()` para detecção centralizada de marcadores de agrupamento (padrão: texto entre parênteses que não começa com dígito)
- **`csv-parser.js`** — `resolveAmount()` agora retorna `{ amount, forceType, isPlaceholder }` — contrato explícito para linhas sem valor próprio
- **`csv-parser.js`** — `mapColumns()` corrigido: alias `valor_r$` e `valor_rs` adicionados para reconhecer a coluna `VALOR_R$` corretamente (alias genérico `valor` capturava antes de forma ambígua)
- **`csv-parser.js`** — Bloco RESUMO/RANKING ao final do arquivo detectado via `isSummaryBlockStart()` e interrompe o parsing antes de gerar erros em linhas estruturalmente diferentes
- **`csv-parser.js`** — `TRANSFERENCIA INTERNA` e `INVESTIMENTO PROPRIO` (coluna `TIPO_MOVIMENTACAO`) ignorados silenciosamente via `SKIP_MOV_TYPES`
- **`parser-models.js`** — Alias `valor_r$` adicionado à detecção do modelo genérico

### Build / Testes

- ✅ Build: OK
- ✅ Servidor: `http://localhost:3000` funcional
- ✅ Planilha `extrato_completo_lucas___2025_a_mai_2026.csv`: 12 linhas de placeholder e 20 linhas de resumo tratadas corretamente (sem erros falsos)
- N/A Cobertura de testes automatizados



### Fixed

- **`forecast.js`** — Bug: `recurringDaily` era calculado mas nunca aplicado no loop de projeção (dead code que causaria double-counting se ativado); removido para manter DRY e evitar confusão
- **`forecast.js`** — Bug: cálculo do saldo inicial (`runningBalance`) usava `tx.amount` diretamente, dependendo implicitamente do sinal; corrigido para usar `tx.type + Math.abs()`, consistente com o padrão de todo o codebase
- **`filters.js`** — Dead code: `byDay` era computado em todo ciclo de `computeStats` mas nunca consumido por nenhum gráfico ou função; removido (melhora de performance)
- **`app.js`** — Bug: gráficos renderizados em containers ocultos (`display:none`) iniciavam com dimensão 0 no ECharts; navegação entre abas agora re-renderiza os gráficos da página destino após ela se tornar visível

### Infrastructure

- Servidor HTTP local via `npm run dev` (serve na porta 3000) — resolve bloqueio de módulos ES via `file:///`

### Build / Testes

- ✅ Build: OK (sem erros, sem warnings críticos)
- ✅ Servidor: `http://localhost:3000` funcional
- ✅ KPIs validados: Saldo `R$ 1.884,28` | Receitas `R$ 6.708,84` | Despesas `R$ 4.824,56` | Economia `28.1%`
- ✅ Gráficos: Line, Doughnut, Bar e Forecast renderizando corretamente em todas as abas
- ✅ Console: zero erros JavaScript no browser
- N/A Cobertura de testes automatizados



### Added

- `docs/SETUP-PASSO-1.md` — Guia do Passo 1 (pré-requisitos: Node 20, pnpm, Docker, Supabase, Doppler)
- `.env.example` — Template de variáveis de ambiente
- `scripts/verify-prerequisites.ps1` — Script de verificação do ambiente (Windows)
- `.nvmrc` — Node 20 LTS
- `.gitignore` — Exclusão de secrets e artefatos de build
- Inicialização do repositório Git local e configuração do controle de versão

- `docs/PLANO-CONSOLIDADO-FONTE.md` — Plano-fonte completo v1.0 (texto integral + exemplos de código)
- `docs/PLANO-CONSOLIDADO.md` — Plano Consolidado Final v1.0 (índice resumido)
- `docs/schema/01-tables.sql` — DDL completo (14 tabelas, incl. `tb_webhook_events`)
- `README.md` — índice do repositório e links para documentação

### Build / Testes

- N/A (apenas documentação de planejamento)
