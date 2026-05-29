-- ============================================================
-- Tabela: usuarios
-- Armazena o perfil do usuário sincronizado com Supabase Auth.
-- Executar este SQL no Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    VARCHAR(50) NOT NULL UNIQUE,
  nome        TEXT NOT NULL,
  documento   VARCHAR(14) NOT NULL,  -- CPF (11) ou CNPJ (14), apenas dígitos
  email       TEXT NOT NULL,
  telefone    VARCHAR(11),           -- Apenas dígitos, nullable
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Política: INSERT — apenas o próprio usuário autenticado pode inserir seu perfil
CREATE POLICY "usuarios_insert_own"
  ON public.usuarios
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Política: SELECT — apenas o próprio usuário pode ler seu perfil
CREATE POLICY "usuarios_select_own"
  ON public.usuarios
  FOR SELECT
  USING (auth.uid() = id);

-- Política: UPDATE — apenas o próprio usuário pode atualizar seu perfil
CREATE POLICY "usuarios_update_own"
  ON public.usuarios
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- Índices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email    ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_documento ON public.usuarios(documento);
