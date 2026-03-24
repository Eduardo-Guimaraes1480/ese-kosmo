---
trigger: always_on
---

# ESE KOSMO — Agente de Mecânicas de Gamificação

## Activation Mode
Always On — Aplicado sempre que implementar lógica de XP, E$E, HE, HP, níveis, penalidades, recompensas ou qualquer mecânica de jogo.

---

## Visão Geral das Mecânicas

O ESE Kosmo usa **RPG de vida real**. O usuário não apenas organiza tarefas — ele evolui uma persona, acumula moedas e enfrenta penalidades reais por inação.

---

## 1. Sistema de Níveis — Ferramenta Privada

| Nível | XP para próximo nível | XP total acumulado |
|---|---|---|
| 1 | 100 xp | 100 xp |
| 2 | 200 xp | 300 xp |
| 3 | 400 xp | 700 xp |
| 4 | 800 xp | 1.500 xp |
| 5 | 1.600 xp | 3.100 xp |
| 6 | 3.200 xp | 6.300 xp |
| 7 | 6.400 xp | 12.700 xp |
| 8 | 12.800 xp | 25.500 xp |
| 9 | 25.600 xp | 51.100 xp |
| 10 | 51.200 xp | 102.300 xp |
| 11 | 102.400 xp | 204.700 xp |
| **12+** | **+100.000 xp/nível (linear, infinito)** | — |

**Regra:** Níveis 1–11 dobram. A partir do 12, incremento fixo de 100.000 xp.

---

## 2. Sistema de Níveis — Rede Social

| Faixa | XP para próximo nível |
|---|---|
| Nível 1–15 | Dobra como a Ferramenta (100, 200… 1.638.400) |
| Nível 16–49 | +1.000.000 xp/nível |
| Nível 50–99 | +5.000.000 xp/nível |
| Nível 100+ | +10.000.000 xp/nível (infinito) |

**Diferença-chave:** Na Rede Social, XP e E$E são concedidos pelos outros usuários via Incentivo/Desincentivo, não pelo próprio usuário.

---

## 3. Recompensas por Tipo de Ação

| Tipo de Ação | XP (mín/máx) | E$E (mín/máx) | Impacto no Pilar |
|---|---|---|---|
| Diária (Task) | 1 / 10 xp | 0 / 5 E$E | Mantém streak (Ofensiva) |
| Fazer (Requisito) | 1 / 25 xp | 0 / 10 E$E | +0,1% a +1% no pilar |
| Meta (Missão) | 10 / 250 xp | 10 / 100 E$E | +10% a +25% direto no pilar |
| Conquista | 1 / 1.000 xp | 0 / 500 E$E | Bônus significativo |
| Objetivo Boss | 200 / 2.500 xp | 50 / 1.000 E$E | Salto de 1–3 níveis no pilar |
| Problemas | XP via conclusão | E$E via conclusão | Penalidade se falhar |

---

## 4. Impacto no Pilar — Graus

```
Pequeno  → +0,1% no pilar selecionado
Moderado → +0,5% no pilar selecionado
Alto     → +1,0% no pilar selecionado
```

Cada pilar evolui de 0% a 100% para subir de nível. Nível do pilar sobe infinitamente (100% a cada nível).

---

## 5. Gráfico de Sacrifícios (Radar)

5 prioridades **fixas e imutáveis**: `Saúde`, `Família`, `Social (Amigos)`, `Trabalho`, `Estudos`

**Regra de decaimento:**
```
A cada 7 dias: todas as prioridades reduzem -5% (mínimo 0%)
O usuário DEVE criar ações associadas a cada prioridade para evitar o decaimento
```

**Visualização:** Gráfico radar — itens urgentes ficam altos, itens negligenciados ficam baixos. É o "gráfico de sacrifícios" — você dificilmente vai ter tudo 100%.

---

## 6. Pontos de Vida (HP)

- Persona tem **100 HP** totais
- **Boss com penalidade:** perde **-20 HP** se não concluir no prazo
- **Problema com penalidade:** perde **-5 HP** se não concluir no prazo
- **HP zerado:** Consequências severas:
  - Todos os pilares de "Minha Vida" reduzem **1 nível**
  - Gráfico de Sacrifícios **zera completamente**
  - Debita **100 E$E** (pode deixar saldo negativo: ex: -100 E$E)

**Visualização de derrota (CSS):**
```css
/* Boss derrotado (perda) */
.avatar-atual { filter: saturate(2) sepia(1) hue-rotate(-20deg); opacity: calc(1 - 0.20); }
.avatar-futuro { opacity: calc(1 - 0.20); }

/* Problema derrotado (perda) */
.avatar-atual { filter: saturate(1.5) sepia(0.5); opacity: calc(1 - 0.05); }
.avatar-futuro { opacity: calc(1 - 0.05); }
```

---

## 7. Mecânica de Incentivo/Desincentivo na Rede Social

### XP por Incentivo (escalonado por usuários únicos)
| Faixa de usuários | XP por incentivo |
|---|---|
| 1–10 | +1 xp |
| 11–100 | +2 xp |
| 101–1.000 | +3 xp |
| 1.001–10.000 | +2 xp |
| 10.001–100.000 | +1 xp |
| 100.001–1.000.000 | +0,5 xp |
| 1.000.001–10.000.000 | +0,5 xp |
| 10.000.001+ | +0,1 xp |

**Desincentivo:** -1 xp por desincentivo. Saldo mínimo = 0 (nunca negativo em XP).

### E$E por Incentivo
| Faixa | Condição | Ganho |
|---|---|---|
| Primeiros 10 | — | 0 E$E (nada) |
| 11–100 | por incentivo | +1 E$E |
| 101–1.000 | a cada 10 | +1 E$E |
| 1.001–10.000 | a cada 10 | +1 E$E |
| 10.001–1.000.000 | a cada 100 | +1 E$E |
| 1.000.001–10.000.000 | a cada 10 | +1 E$E |

**Desincentivo:** a partir de 10 desincentivos no post → -1 E$E. **Pode ficar negativo.**

### HE (Habilidades para Evoluir) por Incentivo
| Faixa | Condição | Ganho HE |
|---|---|---|
| 1–10 | a cada 10 incentivos | +1% HE |
| 11–100 | por incentivo | +1% HE |
| 101–1.000 | a cada 1 | +1% HE |
| 1.001–10.000 | — | 0% HE |
| 10.001–100.000 | a cada 100 | +1% HE |
| 100.001–1.000.000 |  — | 0% HE |
| 1.000.001–10.000.000 | a cada 1.000 | +1% HE |
| 10.000.001+ | a cada 10.000 | +1% HE |

**100% HE = +1 Nível na habilidade.**

**Desincentivo HE:** -1% a cada 10 desincentivos. Pode resultar em perda de níveis.

---

## 8. Mecânica de Republicar

Ao republicar um post, o conteúdo vai para os to-dos do republicador. Botões de Incentivo/Desincentivo ficam **bloqueados até o republicador concluir a ação**.

**Ganhos para o autor original:**
| Faixa de republicações | XP | E$E | HE |
|---|---|---|---|
| 1–1.000 | 100 xp | 5 E$E | +1–2% |
| 1.001–100.000 | 1.000 xp | 10 E$E | +3% |
| 100.001–1.000.000 | 10.000 xp | 1.000 E$E | +10% |
| 1.000.001–10.000.000 | 10.000.000 xp | 100.000 E$E | +10% |

---

## 9. Loja de Recompensas — Mecânica de Sorteio

```
Chance inicial: 50% de ganhar
Se NÃO ganhar: chance aumenta +15% (acumulativo) → 65% → 80% → 95% → 100%
Se GANHAR: chance volta para 50%
Custo: E$E acumulado do usuário
```

---

## 10. Regras de Implementação

- **Nunca** calcular XP/E$E no cliente — sempre server-side (Supabase Edge Functions)
- **Nunca** permitir XP negativo — usar `GREATEST(0, xp - valor)`
- **Sempre** aplicar penalidades automaticamente via cron/trigger quando prazo vence
- **Sempre** exibir feedback visual de ganho/perda de XP, E$E e HP após cada ação
- **Pop-up obrigatório** antes de deletar pilar com nível ≥ 5 (oferecer registrar em Conquistas)