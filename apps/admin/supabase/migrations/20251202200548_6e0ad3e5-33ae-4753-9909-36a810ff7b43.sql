-- Verificar e atualizar todos os registros com valores antigos do enum
-- Primeiro vamos ver os valores atuais (usando cast para text para evitar erro de enum)
-- e depois atualizar os valores antigos

-- Atualizar 'gerente' para 'manager'
UPDATE public.user_roles 
SET role = 'manager'::app_role 
WHERE role::text = 'gerente';

-- Atualizar 'assistente' para 'assistent'
UPDATE public.user_roles 
SET role = 'assistent'::app_role 
WHERE role::text = 'assistente';

-- Atualizar 'geral' para 'basic'
UPDATE public.user_roles 
SET role = 'basic'::app_role 
WHERE role::text = 'geral';