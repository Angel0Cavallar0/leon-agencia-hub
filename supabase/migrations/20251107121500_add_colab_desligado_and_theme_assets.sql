-- Adiciona a coluna de status "desligado" para colaboradores e amplia as configurações de identidade visual
ALTER TABLE public.colaborador
ADD COLUMN IF NOT EXISTS colab_desligado boolean DEFAULT false;

UPDATE public.colaborador
SET colab_desligado = false
WHERE colab_desligado IS NULL;

ALTER TABLE public.colaborador
ALTER COLUMN colab_desligado SET NOT NULL;

INSERT INTO public.global_settings (key, value)
VALUES (
  'theme_colors',
  jsonb_build_object(
    'primary', '166 100% 21%',
    'secondary', '166 98% 34%',
    'logoUrl', 'https://camaleon.com.br/wp-content/uploads/2025/01/Logo-Branco-Fundo-Preto-Horizontal-e1762565908356.png',
    'secondaryLogoUrl', 'https://camaleon.com.br/wp-content/uploads/2025/11/Logo-Branco-Fundo-Preto-Horizontal-e1762565908356-Editado.png',
    'faviconUrl', 'https://camaleon.com.br/wp-content/uploads/2025/02/cropped-Simbolo-color-Green-Gradient-Copia.png'
  )
)
ON CONFLICT (key) DO NOTHING;

UPDATE public.global_settings
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(value, '{}'::jsonb),
      '{logoUrl}',
      to_jsonb(COALESCE(value->>'logoUrl', 'https://camaleon.com.br/wp-content/uploads/2025/01/Logo-Branco-Fundo-Preto-Horizontal-e1762565908356.png')),
      true
    ),
    '{secondaryLogoUrl}',
    to_jsonb(COALESCE(value->>'secondaryLogoUrl', 'https://camaleon.com.br/wp-content/uploads/2025/11/Logo-Branco-Fundo-Preto-Horizontal-e1762565908356-Editado.png')),
    true
  ),
  '{faviconUrl}',
  to_jsonb(COALESCE(value->>'faviconUrl', 'https://camaleon.com.br/wp-content/uploads/2025/02/cropped-Simbolo-color-Green-Gradient-Copia.png')),
  true
)
WHERE key = 'theme_colors';
