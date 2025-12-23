-- Adicionar novos campos à tabela colaborador_private
ALTER TABLE public.colaborador_private
ADD COLUMN IF NOT EXISTS cpf text,
ADD COLUMN IF NOT EXISTS rg text,
ADD COLUMN IF NOT EXISTS endereco text,
ADD COLUMN IF NOT EXISTS contato_emergencia jsonb,
ADD COLUMN IF NOT EXISTS foto_url text;

-- Renomear coluna whatsapp para telefone_pessoal
ALTER TABLE public.colaborador_private
RENAME COLUMN whatsapp TO telefone_pessoal;

-- Adicionar coluna foto_url na tabela colaborador
ALTER TABLE public.colaborador
ADD COLUMN IF NOT EXISTS foto_url text;

-- Adicionar coluna colab_desligado na tabela colaborador
ALTER TABLE public.colaborador
ADD COLUMN IF NOT EXISTS colab_desligado boolean DEFAULT false;

-- Adicionar coluna data_desligamento na tabela colaborador
ALTER TABLE public.colaborador
ADD COLUMN IF NOT EXISTS data_desligamento timestamp with time zone;