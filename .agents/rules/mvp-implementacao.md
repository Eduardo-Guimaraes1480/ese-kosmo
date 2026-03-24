---
trigger: always_on
---

# ESE KOSMO — Agente de Implementação MVP v1.0

## Activation Mode
Always On — Aplicado sempre que implementar, planejar ou revisar funcionalidades do MVP. Mantém o foco no escopo correto e evita over-engineering.

---

## Escopo do MVP v1.0

**Objetivo:** Ferramenta privada funcional + Rede Social em protótipo navegável com dados mockados.
**Meta:** Primeiros 20 usuários Pro pagos = R$400/mês.

### ✅ O que DEVE estar no MVP
- [ ] Autenticação (Supabase Auth) — cadastro, login, logout, recuperação de senha
- [ ] Perfil do usuário — CRUD completo
- [ ] Dashboard com: Persona/Avatar, Estatísticas (nível/XP/E$E/HP), Pilares, Carrossel de Status, Gráfico de Sacrifícios (radar), Próximas Ações
- [ ] CRUD de Ações — Diárias, Fazer, Metas, Boss, Problemas, Conquistas (com limites do plano Free)
- [ ] Tela de Detalhes da Ação — Pomodoro, Humor, Boost, Pilar, Grau de Impacto, Concluir/Editar/Deletar/Compartilhar
- [ ] Loja de Recompensas (básica) — criar (max 10), mecanica de sorteio 50%, resgatar com E$E
- [ ] Minha Equipe (básico) — participar/criar equipe
- [ ] Configurações — tema dark/light, idioma, trocar conta
- [ ] Botão "Ir para Rede Social" na Ferramenta
- [ ] Rede Social: protótipo navegável com dados mockados (Home, Ações, Perfil, Pesquisa, Sidebar)
- [ ] Stripe — checkout para plano Pro R$19,99 e Ultra R$39,99
- [ ] Página "Sobre" / Contexto + Termos de Uso + Política de Privacidade

### ❌ O que NÃO entra no MVP (deixar para v2.0+)
- Backend real da Rede Social (feed, incentivo, desincentivo — apenas mockado)
- Notificações (19 tipos — v3.0)
- IA integrada (Ultra — v3.0)
- Anúncios/propaganda no feed (v3.0)
- Pesquisa real por usuários/hashtags (v3.0)
- Modo colaborativo (v4.0)
- App nativo iOS/Android (v5.0)

---

## Estrutura de Pastas (Next.js App Router)

```
ese-kosmo/
├── .agents/
│   └── rules/
│       ├── ese-kosmo-context.md       ← contexto geral sempre ativo
│       ├── supabase-schema.md         ← schema do banco
│       ├── gamificacao-mecanicas.md   ← regras de XP, E$E, HP, níveis
│       ├── ui-components.md           ← componentes e design system
│       └── mvp-implementacao.md       ← este arquivo
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── cadastro/page.tsx
│   │   │   └── recuperar-senha/page.tsx
│   │   ├── (ferramenta)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── acoes/
│   │   │   │   ├── page.tsx          ← lista de ações com filtros por tipo
│   │   │   │   └── [id]/page.tsx     ← detalhes da ação
│   │   │   ├── loja/page.tsx
│   │   │   ├── equipe/page.tsx
│   │   │   ├── configuracoes/page.tsx
│   │   │   └── layout.tsx            ← bottom nav + dark mode
│   │   ├── (rede-social)/
│   │   │   ├── home/page.tsx         ← feed mockado
│   │   │   ├── pesquisa/page.tsx     ← mockado
│   │   │   ├── perfil/page.tsx       ← CRUD real
│   │   │   ├── rank/page.tsx         ← mockado
│   │   │   └── layout.tsx            ← bottom nav + light mode
│   │   ├── sobre/page.tsx
│   │   ├── termos/page.tsx
│   │   └── privacidade/page.tsx
│   ├── components/
│   │   ├── ferramenta/
│   │   │   ├── PersonaCard.tsx
│   │   │   ├── PilaresGrid.tsx
│   │   │   ├── StatusCarousel.tsx
│   │   │   ├── GraficoSacrificios.tsx
│   │   │   ├── AcaoCard.tsx
│   │   │   └── DetalhesAcao.tsx
│   │   ├── rede-social/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PerfilPublico.tsx
│   │   │   └── RankCard.tsx
│   │   └── ui/
│   │       ├── BottomNav.tsx
│   │       ├── Sidebar.tsx
│   │       ├── ToastXP.tsx           ← animação de +XP/+E$E
│   │       └── PilarTag.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts             ← createBrowserClient
│   │   │   ├── server.ts             ← createServerClient
│   │   │   └── middleware.ts
│   │   ├── gamification/
│   │   │   ├── calcularNivel.ts      ← lógica de XP → nível
│   │   │   ├── aplicarRecompensa.ts  ← server action: conceder XP/E$E
│   │   │   └── aplicarPenalidade.ts  ← server action: aplicar penalidade
│   │   └── stripe/
│   │       └── checkout.ts
│   └── types/
│       └── ese-kosmo.ts              ← tipos TypeScript do schema
└── supabase/
    ├── migrations/                   ← SQL migrations versionadas
    └── functions/                    ← Edge Functions
        ├── decaimento-grafico/       ← cron semanal -5%
        └── verificar-prazos/         ← cron diário para penalidades
```

---

## Ordem de Implementação Recomendada

### Sprint 1 — Base (dias 1–3)
1. Setup Next.js + Tailwind + Supabase
2. Autenticação completa (login/cadastro/logout)
3. Schema do banco (migrations)
4. Middleware de proteção de rotas

### Sprint 2 — Dashboard (dias 4–7)
5. Perfil do usuário (CRUD)
6. Pilares de Minha Vida (CRUD)
7. Dashboard — PersonaCard + Estatísticas
8. Dashboard — PilaresGrid + StatusCarousel
9. Gráfico de Sacrifícios (RadarChart com Recharts)

### Sprint 3 — Ações (dias 8–14)
10. CRUD de Diárias com limites do plano Free
11. CRUD de Fazer/Requisitos
12. CRUD de Metas (com mini to-dos internos)
13. CRUD de Objetivo Boss (com penalidade opcional)
14. CRUD de Problemas (com penalidade obrigatória)
15. CRUD de Conquistas (automáticas + manual a partir nível 6)
16. Tela de Detalhes da Ação (Pomodoro, Humor, Boost, Pilares, Grau de Impacto)

### Sprint 4 — Integração e Planos (dias 15–18)
17. Lógica server-side de XP → Nível (Edge Function ou Server Action)
18. Cron de decaimento do Gráfico (-5% a cada 7 dias)
19. Cron de verificação de prazos + penalidades
20. Loja de Recompensas (criar, sorteio 50%, resgatar E$E)
21. Stripe — checkout Pro e Ultra
22. Controle de limites por plano (middleware)

### Sprint 5 — Rede Social (Mock) e Deploy (dias 19–21)
23. Rede Social — layout, bottom nav, light mode
24. Home/Feed com dados mockados
25. Pesquisa com dados mockados
26. Perfil Público (CRUD real)
27. Botão "Compartilhar na Rede Social" (só salva post, sem feed real ainda)
28. Página Sobre + Termos + Privacidade
29. Deploy na Vercel + testes de segurança (TestSprite)
30. Onboarding para novos usuários

---

## Variáveis de Ambiente Obrigatórias

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # NUNCA expor no client

STRIPE_SECRET_KEY=sk_live_...       # NUNCA expor no client
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

ANTHROPIC_API_KEY=sk-ant-...        # NUNCA expor no client (v3.0+)
```

---

## Checklist de Segurança (Pré-deploy)

- [ ] Nenhuma API Key no código client-side
- [ ] RLS ativo em todas as tabelas Supabase
- [ ] TestSprite rodado e aprovado (0 vulnerabilidades críticas)
- [ ] `.env.local` no `.gitignore`
- [ ] LGPD: rota de exportação de dados funcionando
- [ ] LGPD: rota de exclusão de conta funcionando
- [ ] Rate limiting no Stripe webhook
- [ ] Senhas com bcrypt via Supabase Auth (padrão)

---

## Padrões de Código

```tsx
// Server Actions para operações de banco (NUNCA client-side)
'use server'
export async function concluirAcao(acaoId: string) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  // ... lógica de recompensa
}

// Commits semânticos obrigatórios
// feat: adiciona tela de detalhes da ação
// fix: corrige cálculo de nível no gráfico de sacrifícios
// chore: atualiza dependências do Supabase
// refactor: extrai lógica de XP para lib/gamification
```