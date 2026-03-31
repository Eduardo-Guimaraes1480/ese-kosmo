-- Criar a tabela 'profiles' (Usuários)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  vocation text,
  level integer DEFAULT 1,
  xp integer DEFAULT 0,
  hp integer DEFAULT 100,
  ese_balance integer DEFAULT 0,
  avatar_url text,
  created_at timestamp with time zone DEFAULT now()
);

-- Criar a tabela 'actions' (Tarefas e Bosses)
CREATE TABLE public.actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text,
  xp_reward integer,
  ese_reward integer,
  status text DEFAULT 'pendente',
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar a segurança em nível de linha (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------------------
-- Políticas (RLS) para 'profiles'
-- -----------------------------------------------------------------------------------------

-- Permitir leitura de seus próprios dados
CREATE POLICY "Usuários podem vizualizar seus próprios perfis" 
  ON public.profiles FOR SELECT TO authenticated 
  USING (auth.uid() = id);

-- Permitir inserção de seus próprios dados
CREATE POLICY "Usuários podem criar seus próprios perfis" 
  ON public.profiles FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Permitir atualização de seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
  ON public.profiles FOR UPDATE TO authenticated 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Permitir deleção de seus próprios dados
CREATE POLICY "Usuários podem deletar seus próprios perfis" 
  ON public.profiles FOR DELETE TO authenticated 
  USING (auth.uid() = id);

-- -----------------------------------------------------------------------------------------
-- Políticas (RLS) para 'actions'
-- -----------------------------------------------------------------------------------------

-- Permitir leitura de suas próprias ações
CREATE POLICY "Usuários podem vizualizar suas próprias actions" 
  ON public.actions FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- Permitir inserção de suas próprias ações
CREATE POLICY "Usuários podem criar suas próprias actions" 
  ON public.actions FOR INSERT TO authenticated 
  WITH CHECK (auth.uid() = user_id);

-- Permitir atualização de suas próprias ações
CREATE POLICY "Usuários podem atualizar suas próprias actions" 
  ON public.actions FOR UPDATE TO authenticated 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

-- Permitir deleção de suas próprias ações
CREATE POLICY "Usuários podem deletar suas próprias actions" 
  ON public.actions FOR DELETE TO authenticated 
  USING (auth.uid() = user_id);
