# Auditoria de Oportunidades Técnicas — Rota sem Barreiras

> **Escopo**: análise de arquitetura, oportunidades de refatoração, dívida técnica e caminhos de evolução. Nenhum arquivo foi modificado.
> **Data**: 2026-07-27

---

## Resumo Executivo

A arquitetura técnica está madura para o estágio do produto. A separação de responsabilidades (Edge Function para segredos, RLS para dados, serviços para lógica de negócio, componentes para UI) é clara. As principais oportunidades técnicas são de polimento e escala, não de reescrita — o código existente tem uma boa base.

---

## Oportunidade T-1 — `page.tsx` como orquestrador: acoplamento crescente

**Localização**: `src/app/page.tsx` (495 linhas)

**Descrição**: O `page.tsx` concentra estado de UI, lógica de negócio, event handlers e rendering de todas as abas. Com ~495 linhas, já está no limite do manejável. A lista de responsabilidades inclui: autenticação, geolocalização, filtros de categoria, histórico de buscas, estado de scanning, estado de trilhas, estado de detalhes, estado de acessibilidade (5 variáveis), e orquestração de todas as tabs.

**Problema real**: O estado de acessibilidade (`isHighContrast`, `fontScale`, `vLibrasActive`, `voiceActive`, `reduceMotion`) está duplicado em `page.tsx` e sincronizado manualmente com `preferences` do `AuthContext`. Essa duplicação é a causa de potenciais "flashes" de tema e de futuras inconsistências se um novo toggle de acessibilidade for adicionado sem atualizar os dois lugares.

**Oportunidade**: Extrair o estado e os handlers de acessibilidade para um custom hook (`useAccessibilityState`) que encapsule a sincronização com Supabase. Reduz `page.tsx` em ~70 linhas e torna a lógica de acessibilidade testável isoladamente.

**Impacto estimado**: Médio esforço, alta manutenibilidade futura.

---

## Oportunidade T-2 — Rate-limit da Edge Function: sem limpeza automática de linhas antigas

**Localização**: `supabase/migrations_voice.sql` linhas 31-33

```sql
-- Housekeeping: old rows are cheap to keep (tiny table), but if this ever
-- grows large, periodically run:
-- delete from public.voice_assistant_requests where requested_at < now() - interval '1 day';
```

**Descrição**: A tabela `voice_assistant_requests` cresce indefinidamente — cada sessão de voz adiciona uma linha. O comentário documenta que uma limpeza manual periódica seria necessária.

**Problema em escala**: Com 100 usuários ativos fazendo 5 sessões de voz por dia, a tabela acumula ~500 linhas/dia, ~15.000/mês. Não é crítico hoje, mas em escala moderada pode começar a afetar a performance da query de rate-limit (que faz `COUNT WHERE user_id AND requested_at > 1 min ago`).

**Oportunidade**: Adicionar uma função PostgreSQL agendada (pg_cron, disponível no Supabase) que rode diariamente limpando registros com mais de 24 horas. Uma linha de SQL, zero manutenção manual.

```sql
select cron.schedule('cleanup-voice-requests', '0 3 * * *',
  $$delete from voice_assistant_requests where requested_at < now() - interval '1 day'$$);
```

**Impacto estimado**: Baixo esforço, previne problema de escala.

---

## Oportunidade T-3 — Sem cache de pontos no cliente: fetch redundante a cada montagem

**Localização**: `src/app/page.tsx` e `src/services/pointsService.ts`

**Descrição**: `fetchTouristPoints()` é chamado no `useEffect` de `page.tsx` toda vez que o componente monta (ou seja, a cada login). Os pontos raramente mudam (são cadastrados manualmente pelo admin via Table Editor). Não há nenhuma camada de cache.

**Impacto atual**: Com poucos pontos (5-20), a query é rápida e o impacto é imperceptível. Com dezenas ou centenas de pontos em futuras cidades, cada usuário faz o mesmo fetch ao Supabase toda sessão.

**Oportunidade**: 
1. **Curto prazo**: Usar `localStorage` com TTL de 1 hora para cachear os pontos. Se o cache é válido, não vai ao Supabase.
2. **Médio prazo**: O Supabase suporta `Cache-Control` headers em chamadas REST — ativar cache em CDN para a query pública de pontos.
3. **Longo prazo**: Next.js Fetch Cache com `revalidate` (mas como é Client Component, isso não se aplica diretamente — precisaria de um Route Handler ou Server Component intermediário).

**Impacto estimado**: Baixo esforço (localStorage), alta melhoria de performance percebida.

---

## Oportunidade T-4 — Geocoding Photon sem rate-limiting no cliente

**Localização**: `src/services/geocodingService.ts` e `src/components/SearchBar.tsx`

**Descrição**: O serviço de geocoding usa a instância pública do Photon (komoot.io), que é gratuita mas tem termos de uso que proíbem alto volume. O serviço documenta: *"Caller (SearchBar) must debounce keystrokes — this service itself adds no debounce."*

**Análise**: O SearchBar provavelmente tem debounce implementado (não verificado na auditoria — arquivo não lido), mas a responsabilidade está dividida de forma frágil. Se alguém criar outro consumidor de `searchAddresses()` sem debounce, vai violar os termos do Photon.

**Oportunidade**: Mover o debounce para dentro do `geocodingService.ts` como comportamento padrão, com `AbortController` para cancelar requisições supersedidas. Torna a API do serviço à prova de uso incorreto.

**Impacto estimado**: Baixo esforço, melhoria de robustez.

---

## Oportunidade T-5 — `VoiceView.tsx` sem proteção contra múltiplos cliques durante `connecting`

**Localização**: `src/components/VoiceView.tsx`

**Descrição**: O botão de iniciar sessão passa a ser `<Square>` (parar) assim que o estado vai para `connecting`. Isso parece correto. Mas se o usuário conseguir acionar dois cliques muito rápidos antes da re-renderização, dois `startSession()` podem ser chamados simultâneos — cada um cria seu próprio `GeminiLiveClient`, seu próprio `MicCapture`, e consome um slot de rate-limit.

**Probabilidade**: Baixa em uso normal, mas em redes lentas onde a UI demora para atualizar, é possível.

**Oportunidade**: Adicionar um `startingRef = useRef(false)` como guard no início de `startSession()`, similar ao padrão já usado com `autoStartedRef` (que foi removido mas demonstra que a equipe conhece o padrão).

**Impacto estimado**: Muito baixo esforço, elimina race condition raro.

---

## Oportunidade T-6 — Trilhas: progresso calculado sempre no cliente, sem cache de session

**Localização**: `src/services/trailsService.ts` — `fetchTrails()`

**Descrição**: `fetchTrails()` faz 4 queries paralelas (`trilhas`, `trilha_pontos`, `user_scans`, `user_trail_badges`) a cada chamada. É chamada: (1) ao montar `TrailsView`; (2) ao receber `refreshKey` incrementado após um scan; (3) via `get_unlocked_badges` do assistente de voz.

**Análise**: A query é bem estruturada e as 4 queries em `Promise.all()` são eficientes. O problema é quando o assistente de voz chama `get_unlocked_badges` múltiplas vezes em uma conversa — cada chamada faz 4 novas queries ao Supabase.

**Oportunidade**: Adicionar memoização simples no `voiceActionExecutor.ts` para `get_unlocked_badges` e `get_total_xp` — cachear o resultado por 30 segundos dentro de uma sessão de voz ativa.

**Impacto estimado**: Baixo esforço, reduz carga no Supabase durante conversas longas.

---

## Oportunidade T-7 — `grantBadgeIfComplete()` é chamado no cliente — sem validação server-side

**Localização**: `src/services/trailsService.ts` linhas 114-128

**Descrição**: A concessão de badge é feita pelo cliente com `upsert` direto na tabela `user_trail_badges`. A RLS permite que o próprio usuário faça `insert` (policy `user_trail_badges_insert_own`). Isso significa que um usuário poderia, em teoria, fazer um `INSERT` direto na tabela com qualquer `trilha_id`, concedendo a si mesmo badges de trilhas que nunca completou.

**Raciocínio**: A RLS permite a inserção, mas o progresso real é computado de `user_scans` — o badge "falso" existiria no banco mas a trilha continuaria mostrando progresso real (0%). A inconsistência é apenas visual no troféu, não afeta o fluxo de XP (que vem de `user_scans`, não de badges).

**Impacto real**: Em um contexto de turismo acessível social, badges de gamificação não têm valor monetário ou de reputação significativo. O risco de abuso é baixo.

**Oportunidade futura** (para quando houver competição/ranking): Mover `grantBadgeIfComplete` para uma Edge Function que valide o progresso server-side antes de conceder o badge. Isso tornaria o sistema à prova de manipulação.

**Severidade técnica**: 🟢 Baixa (sem impacto real no produto atual)

---

## Oportunidade T-8 — `supabase/functions/voice-assistant/` diretório vazio deve ser removido

**Localização**: `supabase/functions/voice-assistant/` (diretório vazio)

**Descrição**: Ao executar `supabase functions deploy --all`, um diretório de função vazio pode causar erros ou ser deployado como função vazia. Deve ser removido para evitar confusão e possíveis erros de CI/CD.

**Impacto estimado**: Muito baixo esforço, higiene de codebase.

---

## Oportunidade T-9 — `next.config.ts` está mínimo, sem otimizações de imagem

**Localização**: `next.config.ts`

**Descrição**: (Arquivo não lido diretamente, mas inferido pelo tamanho de 133 bytes). A configuração do Next.js parece mínima. Imagens de pontos turísticos servidas via Supabase Storage poderiam se beneficiar de:
- `images.domains` ou `images.remotePatterns` configurados para o domínio Supabase
- Uso do componente `<Image>` do Next.js em vez de `<img>` nativo (se não estiver sendo usado)

**Impacto**: Otimização automática de formato (WebP/AVIF), lazy loading, e performance de Core Web Vitals.

**Impacto estimado**: Médio esforço, alta melhoria de performance em dispositivos com conexão lenta (público que inclui idosos em áreas com sinal ruim).

---

## Oportunidade T-10 — Sem testes automatizados

**Localização**: Todo o projeto

**Descrição**: Não há arquivos de teste (`*.test.ts`, `*.spec.ts`, `__tests__/`) no projeto. Funções puras críticas como `distanceKm()` (cálculo Haversine), `calculateTrailProgress()`, `normalize()`, e a lógica de `grantBadgeIfComplete()` seriam candidatas óbvias a unit tests.

**Impacto atual**: Nenhum — o projeto está em estágio de protótipo rápido. Mudanças breaking em funções críticas seriam detectadas apenas manualmente.

**Oportunidade**: Adicionar testes para as funções puras do `voiceActionExecutor.ts` e `trailsService.ts` com Vitest (zero configuração em projetos Next.js com Turbopack). Não precisa de mocking de Supabase para funções puras.

**Impacto estimado**: Médio esforço, alta redução de risco de regressões futuras.

---

## Sumário de Oportunidades Técnicas

| # | Oportunidade | Esforço | Impacto |
|---|-------------|---------|---------|
| T-1 | Extrair `useAccessibilityState` hook de `page.tsx` | Médio | Alta manutenibilidade |
| T-2 | pg_cron para limpeza de `voice_assistant_requests` | Baixo | Previne problema de escala |
| T-3 | Cache de pontos no cliente (localStorage + TTL) | Baixo | Alta performance percebida |
| T-4 | Mover debounce para dentro de `geocodingService.ts` | Baixo | Robustez |
| T-5 | Guard contra duplo clique no `startSession()` | Muito baixo | Elimina race condition raro |
| T-6 | Memoizar resultados de `get_unlocked_badges` no assistente | Baixo | Reduz carga Supabase |
| T-7 | Mover `grantBadgeIfComplete` para Edge Function (futuro) | Alto | Só relevante com ranking/competição |
| T-8 | Remover `supabase/functions/voice-assistant/` vazio | Muito baixo | Higiene |
| T-9 | Configurar `next.config.ts` com `remotePatterns` para Storage | Médio | Performance de imagens |
| T-10 | Adicionar unit tests para funções puras críticas | Médio | Redução de risco de regressão |
