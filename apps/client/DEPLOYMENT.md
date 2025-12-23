# 🚀 Deployment Guide - Client App

## Vercel Deployment

### Pré-requisitos

1. Conta no [Vercel](https://vercel.com)
2. Projeto Supabase configurado
3. Repositório GitHub conectado ao Vercel

### Configuração Passo a Passo

#### 1️⃣ Configurar Environment Variables no Vercel

Acesse o dashboard do seu projeto no Vercel e vá em **Settings → Environment Variables**.

Adicione as seguintes variáveis:

| Nome | Valor | Onde encontrar |
|------|-------|----------------|
| `VITE_SUPABASE_URL` | `https://seu-project-id.supabase.co` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGci...` | Supabase Dashboard → Project Settings → API → Project API keys → `anon` `public` |

> **⚠️ Importante:** Certifique-se de adicionar essas variáveis para **todos os ambientes** (Production, Preview, Development) se necessário.

#### 2️⃣ Configurar Build Settings

No Vercel, configure:

- **Framework Preset**: `Vite`
- **Root Directory**: `apps/client`
- **Build Command**: `npm run build` (ou deixe em branco para auto-detect)
- **Output Directory**: `dist` (já configurado no vercel.json)

#### 3️⃣ Deploy

Após adicionar as variáveis de ambiente:

1. Faça **Redeploy** do último deployment, OU
2. Faça push de um novo commit para o branch configurado

O Vercel irá:
- ✅ Instalar dependências
- ✅ Rodar o build do Vite
- ✅ Injetar as variáveis de ambiente
- ✅ Deployar a pasta `dist/`

### 🔧 Troubleshooting

#### Tela branca após deploy

**Causa**: Variáveis de ambiente não configuradas.

**Solução**:
1. Verifique se as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão configuradas corretamente no Vercel
2. Faça redeploy após adicionar as variáveis
3. Abra o console do navegador (F12) para ver erros específicos

#### Erro: "No Output Directory named 'public' found"

**Causa**: Configuração incorreta do output directory.

**Solução**: Já corrigido no `vercel.json` - `outputDirectory` está definido como `"dist"`.

#### Problemas de roteamento (404 em rotas)

**Causa**: SPA routing não configurado.

**Solução**: Já corrigido no `vercel.json` - as `rewrites` estão configuradas para redirecionar todas as rotas para `/index.html`.

### 📱 Testando localmente antes do deploy

```bash
# Na raiz do monorepo
npm run build:client

# Preview da build
cd apps/client
npm run preview
```

Acesse `http://localhost:4173` para testar a build de produção localmente.

### 🔐 Segurança

- ✅ As chaves `VITE_SUPABASE_PUBLISHABLE_KEY` e `VITE_SUPABASE_URL` são **públicas** e seguras para expor no frontend
- ❌ **NUNCA** adicione service keys ou chaves secretas como variáveis VITE_*
- ✅ Use Row Level Security (RLS) no Supabase para proteger seus dados

### 📝 Checklist de Deploy

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Root directory: `apps/client`
- [ ] Framework preset: Vite
- [ ] Output directory: `dist` (no vercel.json)
- [ ] Supabase RLS policies configuradas
- [ ] Testada autenticação no ambiente de produção
- [ ] Testadas as rotas principais: `/`, `/login`, `/dashboard`

---

## Desenvolvimento Local

Para rodar localmente:

```bash
# Na raiz do monorepo
npm install

# Copie as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# Rode o dev server
npm run dev:client
```

Acesse `http://localhost:8080`
