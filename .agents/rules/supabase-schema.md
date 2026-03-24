---
trigger: always_on
---

# ESE KOSMO — Agente de Banco de Dados (Supabase)

## Activation Mode
Always On — Aplicado sempre que criar, editar ou consultar tabelas, funções, RLS policies ou queries no Supabase.

---

## Contexto do Banco de Dados

Este projeto usa **Supabase (PostgreSQL)** como BaaS. Toda lógica de dados deve respeitar:
- **Row Level Security (RLS) ativo em 100% das tabelas**
- **Autenticação via `auth.uid()`** — nunca confiar em dados do client
- **Supabase Realtime** para notificações e feed ao vivo
- **Supabase Edge Functions** para lógica server-side (penalidades automáticas, cronometro de boss, etc.)

---

## Schema Principal — Tabelas Essenciais

### `profiles` — Perfil do Usuário
```sql
id              uuid references auth.users primary key
username        text unique not null
vocacao         text                          -- Ex: "Desenvolvedor", "Atleta"
nivel_geral     integer default 1
xp_total        integer default 0
ese_total       integer default 0
hp              integer default 100           -- Pontos de vida (max 100)
nivel_azul      boolean default false
plano           text default 'free'           -- 'free' | 'pro' | 'ultra'
avatar_atual_url text
avatar_futuro_url text
tema            text default 'dark'           -- 'dark' | 'light'
idioma          text default 'pt-BR'
privacidade_todos boolean default true
privacidade_msgs  boolean default true
criado_em       timestamptz default now()
```

### `pilares` — Pilares de Minha Vida
```sql
id          uuid default gen_random_uuid() primary key
user_id     uuid references profiles(id) on delete cascade
nome        text not null                     -- Ex: "Saúde", "Carreira"
nivel       integer default 1
progresso   numeric(5,2) default 0.00        -- 0.00 a 100.00 (%)
criado_em   timestamptz default now()
-- RLS: user_id = auth.uid()
```

### `acoes` — Todas as Ações (Diárias, Fazer, Metas, Boss, Problemas, Conquistas)
```sql
id              uuid default gen_random_uuid() primary key
user_id         uuid references profiles(id) on delete cascade
tipo            text not null   -- 'diaria' | 'fazer' | 'meta' | 'boss' | 'problema' | 'conquista'
titulo          text not null
descricao       text
status          text default 'pendente'  -- 'pendente' | 'em_andamento' | 'concluido' | 'falha'
xp_recompensa   integer default 1        -- min 1, max depende do tipo
ese_recompensa  integer default 0
pilar_id        uuid references pilares(id)
impacto_pilar   text default 'pequeno'   -- 'pequeno' | 'moderado' | 'alto'
frequencia      text                     -- 'diaria' | 'semanal' | 'mensal' (para diárias)
horario         time
prazo           timestamptz
penalidade_ativa boolean default false
penalidade_descricao jsonb               -- {tipo, valor, pilar_id}
compartilhado   boolean default false
visibilidade    text default 'publico'   -- 'publico' | 'amigos' | 'equipe' | 'privado'
criado_em       timestamptz default now()
concluido_em    timestamptz
-- RLS: user_id = auth.uid()
```

### `grafico_sacrificios` — Prioridades do Radar
```sql
id          uuid default gen_random_uuid() primary key
user_id     uuid references profiles(id) on delete cascade
prioridade  text not null   -- 'saude' | 'familia' | 'social' | 'trabalho' | 'estudos'
valor       numeric(5,2) default 50.00   -- 0.00 a 100.00 (%)
atualizado  timestamptz default now()
-- Cron job: reduz -5% a cada 7 dias automaticamente
-- RLS: user_id = auth.uid()
```

### `recompensas` — Loja de Recompensas
```sql
id              uuid default gen_random_uuid() primary key
user_id         uuid references profiles(id) on delete cascade
titulo          text not null
custo_ese       integer default 0
chance_atual    numeric(5,2) default 50.00   -- começa em 50%, aumenta +15% se não ganhar
origem          text default 'pessoal'       -- 'pessoal' | 'comunidade' | 'equipe'
criado_em       timestamptz default now()
-- RLS: user_id = auth.uid()
```

### `equipes` — Times
```sql
id          uuid default gen_random_uuid() primary key
nome        text not null
bio         text
lider_id    uuid references profiles(id)
criado_em   timestamptz default now()
-- Acesso: lider paga 300 E$E e precisa ser nível 10
```

### `posts_rede_social` — Feed Público
```sql
id              uuid default gen_random_uuid() primary key
user_id         uuid references profiles(id) on delete cascade
acao_id         uuid references acoes(id)
tipo_post       text    -- 'realizada' | 'ao_vivo' | 'agendada'
habilidade_he   text    -- categoria obrigatória ao compartilhar
grande_recompensa text  -- obrigatório para metas/boss
titulo          text not null
descricao       text
midia_url       text
incentivos      integer default 0
desincentivos   integer default 0
republicacoes   integer default 0
visibilidade    text default 'publico'
criado_em       timestamptz default now()
-- RLS: visibilidade = 'publico' OR user_id = auth.uid()
```

### `notificacoes` — 19 tipos
```sql
id          uuid default gen_random_uuid() primary key
user_id     uuid references profiles(id) on delete cascade   -- destinatário
tipo        text not null   -- ver lista dos 19 tipos abaixo
origem_id   uuid            -- id do usuário que gerou a notificação
ref_id      uuid            -- id do post/ação/conquista relacionado
lida        boolean default false
criado_em   timestamptz default now()
```

**19 tipos de notificação:**
`seguiu`, `conexao_solicitada`, `incentivou_post`, `desincentivou_post`, `ajuda_azul`, `comentou_post`, `comentou_docs`, `incentivou_comentario`, `desincentivou_comentario`, `respondeu_comentario`, `entrou_equipe`, `saiu_equipe`, `membro_atingiu_ofensiva`, `membro_perdeu_ofensiva`, `equipe_atingiu_ofensiva`, `equipe_perdeu_ofensiva`, `marco_seguidores`, `marco_incentivos`, `republicou_post`

---

## Mecânicas Automáticas via Edge Functions / Cron

### 1. Decaimento do Gráfico de Sacrifícios
```
Cron: a cada 7 dias
Ação: UPDATE grafico_sacrificios SET valor = GREATEST(0, valor - 5)
```

### 2. Penalidade de Boss/Problema vencido
```
Trigger: quando timestamptz do prazo é atingido e status != 'concluido'
Ação: aplicar penalidade_descricao + -20 HP (boss) ou -5 HP (problema)
```

### 3. XP Geral → Cálculo de Nível
```
Ferramenta: Nível 1-11 dobra XP (100, 200, 400... 102400). Nível 12+ = +100.000 por nível
Rede Social: Nível 1-15 dobra. Nível 16-49 = +1.000.000. Nível 50-99 = +5.000.000. Nível 100+ = +10.000.000
```

### 4. Mecânica HP Zerado
```
Trigger: HP = 0
Ação: -1 nível em todos os pilares + zera grafico_sacrificios + debita 100 E$E (pode ficar negativo)
```

---

## Políticas RLS Padrão

```sql
-- Usuário só vê seus próprios dados (privados)
CREATE POLICY "own_data" ON acoes FOR ALL USING (user_id = auth.uid());

-- Posts públicos visíveis para todos autenticados
CREATE POLICY "public_posts" ON posts_rede_social FOR SELECT
  USING (visibilidade = 'publico' OR user_id = auth.uid());

-- Perfis públicos visíveis para todos
CREATE POLICY "public_profiles" ON profiles FOR SELECT USING (true);
```

---

## Regras Obrigatórias

- **Nunca** armazenar senha — deixar para `auth.users` do Supabase
- **Sempre** usar `gen_random_uuid()` para PKs
- **Sempre** adicionar `created_at timestamptz default now()`
- **Nunca** expor service_role key no client — usar anon key + RLS
- Ao deletar conta: cascade em todas as tabelas com `on delete cascade`