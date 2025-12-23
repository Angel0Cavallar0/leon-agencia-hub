-- Atualizar o role do usuário angelo@camaleon.com.br para admin
UPDATE public.user_roles 
SET role = 'admin'::app_role 
WHERE user_id = 'dd5dfc57-0200-488b-8220-6de71023c9e1';