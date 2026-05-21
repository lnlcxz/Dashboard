# FinDash — Vue 3 + TypeScript + Tailwind

Versão Vue 3 do dashboard financeiro FinDash, migrada do protótipo HTML/JS vanilla original em [../prototype](../prototype).

## Stack

- **Vue 3** com `<script setup>` (Composition API)
- **TypeScript** com `strict: true`
- **Tailwind CSS 3** (design tokens replicados do CSS original)
- **Vite** como bundler/dev server
- **Vue Router 4** (hash mode)
- **Pinia** para gerenciamento de estado
- **ECharts 5** para gráficos
- **jsPDF** para exportação de relatórios
- **lucide-vue-next** para ícones

## Instalação

```bash
cd apps/vue-app
npm install
npm run dev
```

A aplicação abrirá em `http://localhost:5173`.

## Build de produção

```bash
npm run build
npm run preview
```

## Estrutura

```
src/
├── main.ts                  # Bootstrap (Pinia + Router)
├── App.vue                  # Raiz
├── style.css                # Tailwind + componentes/utilities customizados
├── router/                  # Rotas (hash)
├── stores/finance.ts        # Pinia store central
├── types/index.ts           # Types compartilhados
├── services/                # Lógica de domínio (port direto do JS)
│   ├── csv-parser.ts        # Parser BR-aware (DD/MM/YYYY, R$, ;,)
│   ├── storage.ts           # IndexedDB (transactions, imports)
│   ├── categorizer.ts       # Regex rules + cores
│   ├── filters.ts           # Filtros + paginação + stats
│   ├── recurring.ts         # Detecção de assinaturas
│   ├── forecast.ts          # Projeção 30 dias (média móvel ponderada)
│   ├── export.ts            # CSV + PDF
│   └── sample-data.ts       # Gerador de planilha demo
├── composables/
│   ├── useToast.ts          # Sistema global de toasts
│   └── useEChart.ts         # Wrapper reativo do ECharts
├── components/
│   ├── layout/              # AppLayout, Sidebar, PageHeader
│   ├── ui/                  # Card, KpiCard, Toast, Pagination, EmptyState
│   ├── upload/              # UploadZone (drag&drop)
│   ├── tables/              # TransactionTable
│   ├── charts/              # LineChart, BarChart, DoughnutChart, ForecastChart
│   ├── filters/             # FilterBar
│   └── recurring/           # RecurringCard
└── views/                   # Páginas (uma por rota)
    ├── OverviewView.vue
    ├── ImportView.vue
    ├── TransactionsView.vue
    ├── AnalyticsView.vue
    ├── RecurringView.vue
    └── SettingsView.vue
```

## Decisões de design

- **Tailwind config estende** o tema com as variáveis CSS originais (`bg.primary`, `accent`, `success`, etc.) — toda a paleta dark/glass do protótipo foi mapeada para classes.
- **Componentes utilitários** em `style.css` via `@layer components` (`.btn`, `.input`, `.card`, `.badge`, …) preservam o visual do protótipo sem repetir classes Tailwind em todo lugar.
- **Estado reativo via Pinia computed**: `stats`, `recurring`, `forecast` e `filteredTransactions` são derivações automáticas das transações no store — não há mais "updateXxx()" imperativos.
- **ECharts** instanciado via `useEChart` composable: cleanup automático no unmount, re-render em `watch`, resize no `resize` da janela.
- **IndexedDB** intacto — mesmo schema (`findash_db` v1) do protótipo, dados existentes continuam funcionando.
