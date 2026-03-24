---
trigger: always_on
---

# ESE KOSMO — Agente de Componentes UI e Telas

## Activation Mode
Always On — Aplicado sempre que criar, editar ou revisar componentes React, telas, layouts ou qualquer elemento visual do projeto.

---

## Referência Visual

Os protótipos oficiais do ESE Kosmo foram criados no Figma e estão disponíveis em:
- `./docs/reference/Prototipo-ESE-Kosmo-FERRAMENTA.pdf` — Ferramenta Privada
- `./docs/reference/Prototipo-ESE-Kosmo-REDE-SOCIAL.pdf` — Rede Social Pública

Capturas de tela da implementação real:
- Tela "Detalhes da Missão" com campos de Recompensas (XP/E$E), Pilar Kosmo e botões de ação. `./docs/reference/CRUD-Actions-1`
- Tela com Pomodoro, Humor, Boost x1.5, Grau de Impacto e botões Concluir/Editar/Deletar/Compartilhar `./docs/reference/CRUD-Actions-2`

---

## Estrutura de Navegação

### Ferramenta Privada (Dark Mode Padrão)
```
Bottom Nav (4 ícones):
  🏠 Home/Dashboard
  🔥 Ações
  🏦 Loja de Recompensas
  👥 Minha Equipe

Sidebar (hamburger):
  Home
  Ações
  Loja de Recompensas
  Minha Equipe
  Comunidade
  Configurações
  → Ir para Rede Social
  ─────────────────────
  Termos de Uso
  Privacidade
  ESE Productions 2026
```

### Rede Social (Light Mode Padrão)
```
Header:
  [RANK #25BR] [🏦 Loja] [🔔] [•••]

Bottom Nav (5 ícones):
  🏠 Home
  🔍 Pesquisa
  🔥 Criar Ação (botão central destacado)
  📄 Docs/Lista
  👤 Perfil

Sidebar:
  Home
  Criar novas Ações
  Loja de Recompensas
  Minha Equipe
  Comunidades
  Configurações
  RANK Regional e Global
  DOCS (Artigos)
  + Mais Opções
  → Ir para Ferramenta (PRIVADA)
  ─────────────────────────────
  Termos de Uso · Privacidade
  ESE Productions 2026
```

---

## Componentes Obrigatórios — Ferramenta

### 1. Card de Persona (Dashboard)
```tsx
<PersonaCard>
  <AvatarAtual src={user.avatar_atual} />
  <AvatarFuturo src={user.avatar_futuro} opacity={hpOpacity} filter={hpFilter} />
  <Stats>
    <Vocacao>{user.vocacao}</Vocacao>
    <Nivel>NVL {user.nivel_geral}</Nivel>
    <XP>{user.xp_total} XP</XP>
    <HP>{user.hp}/100 HP</HP>
    <ESE>{user.ese_total} E$E</ESE>
  </Stats>
</PersonaCard>
```

### 2. Pilares de Minha Vida (6–7 pilares)
```tsx
<PilaresGrid>
  {pilares.map(p => (
    <PilarItem key={p.id}>
      <ProgressBar value={p.progresso} color={getPilarColor(p.nome)} />
      <span>{p.progresso}%</span>
      <label>{p.nome}</label>
      <badge>NVL{p.nivel}</badge>
    </PilarItem>
  ))}
</PilaresGrid>
```

### 3. Carrossel de Status
```tsx
// 4 cards em carrossel horizontal
<StatusCarousel>
  <StatusCard icon="🔥" label="OFENSIVA" value={`${streakDias} dias`} variant="ofensiva" />
  <StatusCard icon="✅" label="FAZER" value={`${fazerPendentes} pendentes`} />
  <StatusCard icon="🎯" label="METAS" value={`${metasPendentes} pendentes`} />
  <StatusCard icon="⚠️" label="INIMIGOS" value={`${problemasPendentes} ativos`} variant="danger" />
</StatusCarousel>
```

### 4. Gráfico de Sacrifícios (Radar)
```tsx
// Usar recharts RadarChart
<RadarChart data={graficoData}>
  <PolarGrid />
  <PolarAngleAxis dataKey="prioridade" />
  <Radar dataKey="valor" fill="#4850FF" fillOpacity={0.3} stroke="#4850FF" />
</RadarChart>
// 5 eixos fixos: SAÚDE, FAMÍLIA, SOCIAL, TRABALHO, ESTUDOS
```

### 5. Card de Ação na Lista
```tsx
<AcaoCard tipo={acao.tipo} status={acao.status}>
  <Checkbox checked={acao.status === 'concluido'} />
  <Info>
    <Title>{acao.titulo}</Title>
    <Meta>XP: {acao.xp_recompensa}xp · RECOMPENSA: {acao.ese_recompensa} E$E · PILAR #{pilarIndex}: {acao.impacto}%</Meta>
  </Info>
</AcaoCard>
// Cores por tipo: diaria=branco, fazer=branco, meta=roxo, boss=laranja, problema=vermelho
```

### 6. Tela de Detalhes da Ação (baseado nas screenshots)
```tsx
<DetalhesMissao>
  <Header>
    <BackButton />
    <Title>DETALHES DA MISSÃO</Title>
    <ShareButton />
    <Avatar />
  </Header>

  <Badge variant="acao-ativa">AÇÃO ATIVA</Badge>
  <ID>ID: KSM-{acao.id.slice(-3)}</ID>
  <TituloGrande>{acao.titulo}</TituloGrande>

  <Grid cols={2}>
    <DescricaoBox>
      <Label>DESCRIÇÃO DETALHADA</Label>
      <TextArea value={acao.descricao} scrollable />
    </DescricaoBox>

    <RecompensasBox>
      <Label>RECOMPENSAS</Label>
      <SliderRow label="POTENCIAL DE XP" value={acao.xp_recompensa} max={2500} color="#4850FF" />
      <SliderRow label="CRÉDITOS E$E" value={acao.ese_recompensa} max={1000} color="#4850FF" />
    </RecompensasBox>
  </Grid>

  <FerramentasRow>
    <FerramentaBtn icon="⏱" label="POMODORO" />
    <FerramentaBtn icon="😊" label="HUMOR" />
    <FerramentaBtn icon="🚀" label="BOOST x1.5" />
  </FerramentasRow>

  <PilarKosmoBox>
    <Label>PILAR KOSMO</Label>
    <TagsRow>
      {pilaresSelecionados.map(p => <PilarTag key={p} active={p === pilarAtivo}>{p}</PilarTag>)}
    </TagsRow>
    <GrauImpacto>
      <GrauBtn value="pequeno">PEQUENO</GrauBtn>
      <GrauBtn value="moderado" active>MODERADO</GrauBtn>
      <GrauBtn value="alto">ALTO</GrauBtn>
    </GrauImpacto>
  </PilarKosmoBox>

  <ActionRow>
    <BtnPrimary onClick={concluir}>CONCLUIR MISSÃO</BtnPrimary>
    <BtnSecondary onClick={editar}>EDITAR</BtnSecondary>
    <BtnDanger onClick={deletar}><TrashIcon /></BtnDanger>
  </ActionRow>

  <ShareDashed onClick={compartilharRedeScial}>
    <ShareIcon /> COMPARTILHAR NA REDE SOCIAL
  </ShareDashed>
</DetalhesMissao>
```

---

## Componentes Obrigatórios — Rede Social

### 7. Card de Post no Feed
```tsx
<PostCard>
  <Header>
    <Avatar src={user.avatar} />
    <UserInfo>
      <Nickname>{user.nickname}</Nickname>
      <Vocacao>{user.vocacao}</Vocacao>
      <Localizacao>{user.localizacao}</Localizacao>
      <Badge variant={user.nivel_azul ? 'azul' : 'default'} />
    </UserInfo>
    <Timestamp>{timeAgo}</Timestamp>
    <Counter>{postIndex}/{totalPosts}</Counter>
    <MoreMenu />
  </Header>

  <MissaoTitle>⭐ MISSÃO: {post.titulo}</MissaoTitle>

  <ChecklistMiniTodos>
    {post.todos.map(t => <CheckItem key={t.id} done={t.done}>{t.titulo}</CheckItem>)}
  </ChecklistMiniTodos>

  {post.midia && <PostMedia src={post.midia} />}

  <ActionBar>
    <IncentivoBtns>
      <BtnIncentivo count={post.incentivos} />
      <BtnDesincentivo count={post.desincentivos} />
    </IncentivoBtns>
    <BtnRepublicar count={post.republicacoes} />
    <BtnComentar count={post.comentarios} />
    <BtnCompartilhar />
  </ActionBar>
</PostCard>
```

### 8. Card de Perfil Público
```tsx
<PerfilPublico>
  <Cover />
  <AvatarCircle src={user.avatar} nivelAzul={user.nivel_azul} />
  <Nickname>{user.nickname}</Nickname>
  <Vocacao>{user.vocacao}</Vocacao>
  <Localizacao editable>{user.localizacao}</Localizacao>
  {user.nivel_azul && <BtnTornarAzul />}

  <StatsRow>
    <Stat label="Conexões" value={user.conexoes} />
    <Stat label="To-Dos" value={user.todos_count} />
    <Stat label="Seguidores" value={user.seguidores} />
  </StatsRow>

  <ActionArea>
    <BtnEditarPerfil />
    <BtnAdicionarTodo />
    <BtnConfiguracoes />
  </ActionArea>

  <Privacidade>
    <Toggle label="Quem pode ver meus to-dos" value={priv.todos} />
    <Toggle label="Quem pode me enviar mensagens" value={priv.msgs} />
    <Toggle label="Quem pode ver minhas informações" value={priv.info} />
  </Privacidade>

  <TodoList posts={user.posts_publicos} />
</PerfilPublico>
```

---

## Tokens de Design (Tailwind Config)

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      'ese-dark':    '#01055B',
      'ese-blue':    '#0008AE',
      'ese-purple':  '#1E0A40',
      'ese-black':   '#0B0F10',
      'ese-white':   '#FEFEFE',
      'ese-accent':  '#4850FF',
      'ese-light':   '#98A9FF',
      'ese-gray':    '#2b3132',
      'ese-darker':  '#01022A',
    },
    fontFamily: {
      'inter':       ['Inter', 'sans-serif'],
      'montserrat':  ['Montserrat', 'sans-serif'],
    }
  }
}
```

---

## Regras de UI

1. **Ferramenta:** sempre fundo `#0B0F10` ou `#01022A` em dark mode
2. **Rede Social:** fundo `#F5F5FA` em light mode
3. **Botão primário:** `bg-ese-accent text-white rounded-full` — nunca quadrado
4. **Botão destrutivo (deletar):** `bg-red-700/20 text-red-400` com ícone de lixeira
5. **Badges de tipo de ação:** pill colorido — Diária=cinza, Meta=roxo, Boss=laranja, Problema=vermelho
6. **Sliders de XP/E$E:** cor `#4850FF` com thumb circular
7. **Borda dashed** no botão "Compartilhar na Rede Social" (como no protótipo)
8. **Animação de feedback:** toast de +XP e +E$E após concluir ação (Framer Motion slide-up)