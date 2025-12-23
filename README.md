# leon-agencia-hub monorepo

Este repositório agora está organizado como um monorepo para acomodar múltiplas aplicações (admin e futuramente client) e código compartilhado.

## Estrutura

```
.
├── apps/
│   ├── admin/   # aplicação atual existente (Vite + React)
│   └── client/  # esqueleto para futura aplicação client
├── shared/      # espaço para tipos, utilitários e cliente de API compartilhados
└── package.json # configuração de workspaces e scripts de orquestração
```

## Configuração

1. Instale as dependências de todos os workspaces (usa `package-lock` do admin existente):
   ```bash
   npm run install:all
   ```

2. Para continuar desenvolvendo a aplicação admin como antes:
   ```bash
   # opção 1: dentro do workspace
   cd apps/admin
   npm run dev

   # opção 2: a partir da raiz do monorepo
   npm run dev:admin
   ```

3. Builds:
   ```bash
   npm run build:admin
   ```

## Apps

### Admin (`apps/admin`)
Todo o código anterior foi movido para esta pasta sem alterações funcionais. Configurações de Vite, Tailwind, Supabase e ESLint continuam lado a lado do código fonte.

### Client (`apps/client`)
Workspace reservado para a futura aplicação pública. Os scripts atuais apenas informam que a aplicação ainda não foi implementada.

## Shared (`shared`)
Pacote interno para código comum entre aplicações. Inclui:
- `types/index.ts`: tipos básicos (`Client`, `SocialMetrics`, `ContentApproval`).
- `utils/index.ts`: helpers utilitários simples.
- `api/index.ts`: helpers para configurar chamadas HTTP reutilizáveis.

Implemente e consuma módulos deste pacote usando a dependência `@leon/shared` declarada nos workspaces.
