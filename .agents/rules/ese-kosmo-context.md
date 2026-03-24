---
trigger: always_on
---

# ESE KOSMO — Agente de Contexto Mestre
 
## Activation Mode
Always On — Este arquivo sempre será aplicado em todo o projeto ese-kosmo.
 
---
 
## Identidade do Produto
 
Você está trabalhando no **ESE Kosmo**, o 6º e principal produto do ecossistema **RIZO+MA.P**, criado pela **ESE Productions (Eduardo / Dudheloco)**.
 
O ESE Kosmo é uma **plataforma dual**:
- **Ferramenta Privada** — dashboard de produtividade gamificada (personal, privado, autenticado)
- **Rede Social Pública** — feed de ações compartilhadas, ranking, perfis, comunidades
 
**Frase-chave do produto:**
> "Aqui você não coleciona pontos — você torna visível o que seu cérebro não enxerga, mas gosta de enxergar."
 
---
 
## Stack Tecnológica Obrigatória
 
| Camada | Tecnologia |
|---|---|
| Front-end | Next.js (React) + Tailwind CSS |
| Back-end / BaaS | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Autenticação | Supabase Auth — email/senha + OAuth Google/GitHub |
| Pagamentos | Stripe — Pro R$19,99/mês · Ultra R$39,99/mês |
| IA (v3.0+) | Anthropic Claude API (plano Ultra) |
| Deploy | Vercel (CI/CD automático via GitHub) |
| Segurança | TestSprite + RLS Supabase + LGPD compliance |
 
---
 
## Design System — NUNCA VIOLAR
 
### Paleta Principal
- **Azul Escuro Espacial:** `#01055B` ou `#0008AE`
- **Roxo Escuro:** `#1E0A40`
- **Preto:** `#0B0F10`
- **Branco:** `#FEFEFE`
 
### Paleta de Acento
- **Azul Mais Escuro:** `#01022A`
- **Azul Clarinho:** `#98A9FF`
- **Azul:** `#4850FF`
- **Cinza:** `#2b3132`
 
### Tipografia
- **Primária:** Inter (SF Pro) — interfaces e corpo de texto
- **Secundária:** Montserrat ou Poppins — títulos e destaques
 
### Estilo Visual
- Layout: **Minimalista · Gradient · Glassmorphism · Flat Illustration**
- Ícones: **Flat Minimalist Icons / Modern Glyph Icons** — sem sombras
- Ícones específicos: WhatsApp → flat colorido | GitHub → Octicons (line) | Threads → glyph filled
- Modo padrão: **Ferramenta = Dark Mode | Rede Social = Light Mode**
 
### Layouts Recomendados
- Hero Banner (anúncio principal)
- Grid de Cards (funcionalidades)
- Vertical List (sidebar / configurações)
- Dashboard com Bottom Nav (perfis e ferramenta)
 
---
 
## Moedas e Métricas do Ecossistema
 
| Símbolo | Nome | Descrição |
|---|---|---|
| **XP** | Pontos de Experiência | Determinam o Nível Geral da Persona |
| **E$E** | Moeda do Ecossistema | Usada na Loja de Recompensas |
| **HE** | Habilidades para Evoluir | % de progresso em habilidades específicas |
| **HP** | Pontos de Vida | 100 HP totais — zerar tem penalidades severas |
 
---
 
## Planos e Limites
 
| Plano | Preço | Limites |
|---|---|---|
| **FREE** | Grátis | 20 diárias · 10 fazer/dia · 5 metas/mês · 1 boss/mês · 10 problemas/dia · 10 recompensas · histórico 15 ações |
| **PRO** | R$19,99/mês | Remove todos os limites · Banco completo · Pomodoro/Multiplicador desbloqueados |
| **ULTRA** | R$39,99/mês | Tudo do Pro + IA integrada no Dashboard |
 
---
 
## Regras de Desenvolvimento
 
1. **Toda tela deve ser mobile-first** — responsiva em 320px, 768px e 1440px
2. **Nenhuma API Key no front-end** — sempre usar variáveis de ambiente server-side
3. **Row Level Security (RLS) ativo** em todas as tabelas Supabase
4. **Auto-save** em todos os formulários de criação de ação
5. **Tempo de carregamento < 3s** em conexão 4G
6. **Commits semânticos** no GitHub: `feat:`, `fix:`, `chore:`, `refactor:`
7. **LGPD compliant** — usuário pode exportar e deletar todos os dados
8. **Dark Mode padrão na Ferramenta, Light Mode padrão na Rede Social**
 
---
 
## Metas por Versão
 
| Versão | Meta de Receita | Milestone |
|---|---|---|
| v1.0 MVP | R$400/mês | 20 usuários Pro pagos |
| v2.0 Funcional | R$3.500/mês | 100 Pro + 50 Ultra |
| v3.0 Profissional | R$12.000–R$18.000/mês | 500 Pro + 100 Ultra + anúncios |
| v4.0 Expansão | R$18.000+/mês | Sync PARADOCX + colaborativo |
| v5.0 Máx. Potencial | — | App nativo iOS/Android + API pública |