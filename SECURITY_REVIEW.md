# Revisão de Segurança

## Escopo e metodologia
- Varredura manual do código-fonte do frontend Vite/React em `src/`.
- Procura por chaves, tokens e URLs assinadas expostas no código.
- Verificação do fluxo de autenticação para garantir que a validação de senha ocorra no servidor.

## Achados principais
- **Exposição de URL assinada**: a página de login incluía uma URL de imagem com token de assinatura `storage/v1/object/sign/...`. Tokens assinados são sensíveis e permitem acesso temporário ao objeto. Substituímos a referência pela URL configurável do tema (armazenada no contexto), removendo o token do repositório.
- **Variáveis de ambiente**: o cliente Supabase utiliza apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`/`VITE_SUPABASE_PUBLISHABLE_KEY`, carregadas via variáveis de ambiente. Não há chaves de serviço hard-coded detectadas.
- **Autenticação**: o login usa `supabase.auth.signInWithPassword`, o que delega a verificação de senha ao backend Supabase. Não há comparação de senha no cliente além do envio das credenciais.

## Recomendações
- Evite inserir URLs assinadas ou tokens diretamente no código-fonte. Prefira armazená-las em variáveis de ambiente ou usar ativos públicos.
- Rotacione qualquer token previamente exposto e regenere a URL assinada, se necessário.
- Mantenha `VITE_SUPABASE_*` definidos apenas em ambientes seguros e nunca versione arquivos `.env` com segredos.
