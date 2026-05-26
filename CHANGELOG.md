# CHANGELOG

## [Unreleased] — 2026-05-26 (SaaS Light Theme Redesign)

### Added
- **`app.ts`, `index.html` e `types/index.ts`** — Implementado **Perfil de Usuário Completo** e **Gestão de Contas/Cartões**:
  - Tela de Configurações agora possui campos para *Nome*, *E-mail* e *Contas & Cartões* (ex: Nubank, Caixa).
  - Adicionado suporte nativo a `accountId` nas transações (`Transaction`).
  - **Filtro de Contas**: Usuário agora pode filtrar todas as transações, gráficos e KPIs do Dashboard por contas específicas (Caixa, Nubank, ou Total).
  - **Vínculo na Importação**: No momento de importar uma planilha CSV/Excel, o usuário agora tem um `select` para escolher em qual Conta/Cartão aqueles dados deverão ser salvos.
- **`style.css`** — Reversão estética para **SaaS Dark Glassmorphism**. Após testes, o tema totalmente branco gerou conflito com a base e não agradou. Os componentes estruturais do design bancário ("SaaS") foram mantidos, mas agora possuem fundos translúcidos (`rgba(20, 25, 40, 0.4)`), bordas suaves (`rgba(255,255,255,0.08)`) e efeito `backdrop-filter: blur(16px)`, criando uma interface premium e coesa.
- **`style.css` & `index.html`** — Melhorias Didáticas e de UI/UX (Acessibilidade Visual):
  - **Transações**: Filtros agora estão agrupados em `form-group` com `<label>` explícitas (ex: "Buscar Transação", "Data Inicial") para que o usuário não dependa apenas do placeholder.
  - **Análises**: Adição de descrições textuais explicativas abaixo dos títulos dos gráficos, informando ao usuário *o que* aquele gráfico representa.
  - **Configurações**: Implementado o CSS da classe `.setting-row` e `.setting-label` (que antes estavam ausentes), estruturando corretamente os blocos de configuração com alinhamento flex e textos legíveis de alto contraste.
- **`app.ts` e `index.html`** — Adicionado suporte a Nome de Usuário dinâmico. O usuário pode agora definir seu nome na aba Configurações. O nome é persistido via `localStorage` e atualiza automaticamente a saudação inicial ("Olá, [Nome]!"), o perfil na sidebar e o nome impresso no cartão de crédito virtual.
- **`index.html`** — Tradução completa da interface do tema SaaS de Inglês para Português (PT-BR), englobando menus laterais, labels de KPIs, tabelas e rodapés de gráficos.
- **`index.html`** — Atualização estrutural da seção "Visão Geral" (Overview). Inserção do cabeçalho de saudação, cards KPI compactos com tendências, painel da "Carteira" com simulação de cartão de crédito VISA, reformulação da seção de "Últimas Transações" para o formato de lista limpa (sem cabeçalhos), e box "Transferência Rápida".
- **`charts.ts`** — Cores e configurações do ECharts ajustadas para o novo tema light/dark. Gráfico combinado (Bar e Line) utiliza agora os novos tons de roxo, tooltip adaptada e estilo minimalista de eixos.

### Build / Testes
- ✅ Build: Validada estruturação e estilos. O layout de cards transparentes não quebrou os gráficos.
- ✅ UX: As descrições em tela agora guiam melhor o usuário sobre o que cada campo faz.
- ✅ Dados: Fluxo de Importação modificado para incluir `accountId` no processo sem quebrar importações de versões legadas.

### Added
- **`style.css`** — Reversão estética para **SaaS Dark Glassmorphism**. Após testes, o tema totalmente branco gerou conflito com a base e não agradou. Os componentes estruturais do design bancário ("SaaS") foram mantidos, mas agora possuem fundos translúcidos (`rgba(20, 25, 40, 0.4)`), bordas suaves (`rgba(255,255,255,0.08)`) e efeito `backdrop-filter: blur(16px)`, criando uma interface premium e coesa.
- **`style.css` & `index.html`** — Melhorias Didáticas e de UI/UX (Acessibilidade Visual):
  - **Transações**: Filtros agora estão agrupados em `form-group` com `<label>` explícitas (ex: "Buscar Transação", "Data Inicial") para que o usuário não dependa apenas do placeholder.
  - **Análises**: Adição de descrições textuais explicativas abaixo dos títulos dos gráficos, informando ao usuário *o que* aquele gráfico representa.
  - **Configurações**: Implementado o CSS da classe `.setting-row` e `.setting-label` (que antes estavam ausentes), estruturando corretamente os blocos de configuração com alinhamento flex e textos legíveis de alto contraste.
- **`app.ts` e `index.html`** — Adicionado suporte a Nome de Usuário dinâmico. O usuário pode agora definir seu nome na aba Configurações. O nome é persistido via `localStorage` e atualiza automaticamente a saudação inicial ("Olá, [Nome]!"), o perfil na sidebar e o nome impresso no cartão de crédito virtual.
- **`index.html`** — Tradução completa da interface do tema SaaS de Inglês para Português (PT-BR), englobando menus laterais, labels de KPIs, tabelas e rodapés de gráficos.
- **`index.html`** — Atualização estrutural da seção "Visão Geral" (Overview). Inserção do cabeçalho de saudação, cards KPI compactos com tendências, painel da "Carteira" com simulação de cartão de crédito VISA, reformulação da seção de "Últimas Transações" para o formato de lista limpa (sem cabeçalhos), e box "Transferência Rápida".
- **`charts.ts`** — Cores e configurações do ECharts ajustadas para o novo tema light/dark. Gráfico combinado (Bar e Line) utiliza agora os novos tons de roxo, tooltip adaptada e estilo minimalista de eixos.

### Build / Testes
- ✅ Build: Validada estruturação e estilos. O layout de cards transparentes não quebrou os gráficos.
- ✅ UX: As descrições em tela agora guiam melhor o usuário sobre o que cada campo faz.

## [Unreleased] — 2026-05-26 (Premium Animation Redesign)

### Added
- **`style.css`** — Redesign premium completo com 10+ keyframe animations: `slideUp`, `float`, `pulseGlow`, `gradientShift`, `borderGlow`, `iconPop`, `countUp`, `logoSpin`. Cards KPI com entrada escalonada (staggered), hover 3D com elevação e glow neon, ícones flutuantes, botões com gradiente animado, orbs de fundo ambient, e micro-interações em toda a interface.

### Build / Testes
- ✅ Build: OK (TypeScript zero errors, Vite HMR validado em tempo real).
- ✅ UI/UX: Animações testadas no browser — cards, sidebar, botões, tabelas e transições de página 100% funcionais.
- N/A Cobertura de testes automatizados.

## [Unreleased] — 2026-05-26 (Automated Git Data Import)

### Added
- **`public/data/`** — Copiados os arquivos de dados financeiros raw `extrato.csv` e `salarial.csv` de `ModelosPlanilhas` para a pasta pública servida pelo Vite.
- **`index.html`** — Adicionados botões premium de "Importar Dados do Git" na Visão Geral e "Importar do Git" no cabeçalho de Importação de planilhas. Adicionada a marcação HTML para um modal customizado elegante (`confirmModal`).
- **`app.css`** — Adicionadas regras de CSS personalizadas para o overlay, animação e design de cartões de modal no padrão glassmorphism e cores HSL.
- **`app.ts`** — Implementada a função `handleGitImport` que limpa a base local para evitar duplicados e importa de forma transparente ambos os arquivos CSV do Git na IndexedDB com suporte a notificações e toasts dinâmicos. Criada a função baseada em Promises `customConfirm` que elimina a necessidade de modais nativos bloqueantes.

### Build / Testes
- ✅ Build: OK (Verificação estática e compatibilidade de tipos TypeScript 100% validadas, zero warnings).
- ✅ UI/UX: Botões e modal customizado adicionados com design premium, transições suaves de opacidade e alinhados à identidade visual do FinDash.
- N/A Cobertura de testes automatizados.

## [Unreleased] — 2026-05-25 (TypeScript & Compound Parser)

### Added
- **`csv-parser.ts`** — Adicionado o utilitário `extractCompoundAmounts` para processar e quebrar valores compostos (por exemplo, `"7986,44 saídas / 3502,62 entradas"`) usando a barra `/`.
- **`csv-parser.ts`** — `resolveAmount` atualizado para retornar um array de transações resolvidas. O loop principal do parser agora cria múltiplas transações a partir de uma única linha composta.
- **`types/index.ts`** — Adicionado o campo `suffix?: string` em `ResolvedAmount` para diferenciar transações duplicadas adicionando ` (entradas)` e ` (saídas)`.

### Fixed
- **`globals.d.ts`** — Resolvido erro de compilação do TypeScript `Declaration or statement expected` movendo as declarações de escopo e adicionando a palavra-chave `declare` para as constantes globais `echarts` e `lucide`.
- **`app.ts`** — Removido import não utilizado `ImportRecord` para sanar o erro `TS6196` na build.
- **`csv-parser.ts`** — Adicionado `'fatura cartao'` e `'fatura cartão'` em `SKIP_MOV_TYPES` para impedir dupla contagem de gastos do cartão no extrato.

### Build / Testes
- ✅ Build: OK (`tsc --noEmit && vite build` concluído com sucesso e 0 erros).
- ✅ Servidor: Rodando em `http://localhost:3000`.
- N/A Cobertura de testes automatizados.

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
