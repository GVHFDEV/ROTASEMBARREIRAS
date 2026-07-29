# Auditoria de Segurança — Rota sem Barreiras

> **Escopo**: análise estática de código, SQL de migrações e configurações. Nenhum arquivo foi modificado.
> **Data**: 2026-07-27

---

## Resumo Executivo

O projeto apresenta uma postura de segurança consistentemente bem pensada para o seu estágio. A chave da API Gemini nunca toca o cliente; a Edge Function faz autenticação e rate-limit antes de qualquer chamada cara; as políticas RLS estão presentes e corretas em todas as tabelas com dados de usuário. Os itens abaixo são achados reais, mas a maior parte é de severidade baixa a média — não há vulnerabilidades críticas identificadas.

---

## Achado 1 — `USING (true)` na policy de leitura de `pontos`

**Localização**: `supabase/migrations.sql` linhas 114-117

```sql
create policy "pontos_select_authenticated" on public.pontos
  for select
  to authenticated
  using (true);
```

**Descrição**: A policy usa `USING (true)` — qualquer usuário autenticado pode ler qualquer linha da tabela sem restrição. Para dados públicos de turismo, isso é intencional e documentado no próprio migration.

**Raciocínio**: Os pontos turísticos são conteúdo público por design. O `using (true)` é idêntico a uma API pública de leitura, correspondendo exatamente ao produto. Não é uma falha — é uma decisão correta. Reportado apenas para que fique documentado que foi revisado.

**Risco residual**: Se dados sensíveis forem inadvertidamente adicionados à tabela `pontos` no futuro, estariam expostos a todos os usuários autenticados.

**Severidade**: 🟢 Baixa (por design documentado)

---

## Achado 2 — `USING (true)` na policy de leitura de `trilhas` e `trilha_pontos`

**Localização**: `supabase/migrations_trilhas.sql` linhas 48-52 e 65-69

**Descrição**: Mesmo padrão de `pontos` acima. Trilhas são conteúdo público de turismo, sem dados pessoais.

**Severidade**: 🟢 Baixa (por design documentado)

---

## Achado 3 — Bucket de Storage é Público

**Localização**: `docs/SUPABASE_PONTOS_SETUP.md` linha 19

```
Public bucket: ligado (imagens precisam ser acessíveis via URL direta no app, sem auth)
```

**Descrição**: O bucket `pontos-imagens` está configurado como público. Qualquer pessoa com a URL pode acessar qualquer arquivo do bucket — fotos, áudios, vídeos em Libras — sem autenticação.

**Raciocínio**: Para imagens e mídia de pontos turísticos públicos, isso é aceitável. O conteúdo não tem caráter privado e não há PII nos arquivos do bucket.

**Risco residual**: Sem políticas que restrinjam MIME types ou tamanho de objeto no Storage, se a conta Supabase fosse comprometida, arquivos arbitrários poderiam ser carregados e servidos publicamente em um subdomínio `supabase.co` da organização.

**Recomendação futura**: Adicionar Storage Policy que restrinja tipos permitidos (apenas `image/*`, `audio/*`, `video/*`) e defina limite de tamanho máximo por arquivo.

**Severidade**: 🟡 Média (aceitável no contexto atual, mas com risco residual documentável)

---

## Achado 4 — CORS com `Access-Control-Allow-Origin: *` na Edge Function de voz

**Localização**: `supabase/functions/voice-token/index.ts` linhas 61-65

```typescript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  ...
};
```

**Descrição**: A Edge Function `voice-token` retorna `Access-Control-Allow-Origin: *`, permitindo que qualquer domínio faça requisições a ela.

**Raciocínio**: A function já exige autenticação via JWT Supabase (linha 283). Um atacante de outra origem ainda precisaria de um token JWT válido. O token Gemini retornado é de uso único (campo `uses: 1`) e expira em 1 minuto para abertura de sessão. A mitigação é substancial.

**Risco residual real**: Se um usuário autenticado for induzido a visitar um site malicioso durante uma sessão ativa, esse site poderia fazer uma requisição fetch à Edge Function usando o token de sessão do usuário (se disponível via cookies SameSite=Lax, dependendo do browser). Isso consumiria uma slot de rate-limit e exporia o `userName` do usuário para o contexto do assistente.

**Recomendação**: Restringir `Allow-Origin` ao domínio de produção (`https://rotasembarreiras.vercel.app` ou configurar via variável de ambiente) quando o domínio definitivo for estabelecido.

**Severidade**: 🟡 Média

---

## Achado 5 — `alert()` nativo em ações de usuário

**Localização**: `src/app/page.tsx` linhas 175 e 180 (geolocalização) e `src/components/LoginPage.tsx` linhas 259, 261, 389, 625 (placeholders)

**Descrição**:
- **`page.tsx`**: O botão de centralizar no mapa usa `alert()` nativo ao falhar geolocalização. Viola diretriz `interface_rules.md § 5` explicitamente.
- **`LoginPage.tsx`**: Quatro chamadas `alert()` para Termos de Uso, Política de Privacidade, "Esqueceu sua senha" e "Reenviar email" — todas marcadas como `"Simulação: ..."`. São placeholders não implementados de funcionalidades reais.

**Por que importa**: `alert()` bloqueia o thread da UI em iOS/Android Safari, prejudica usuários com leitores de tela, e viola as diretrizes do produto que foca em acessibilidade. Para um app voltado a PCDs e idosos, isso é especialmente grave.

**Severidade**: 🟡 Média — os dois de geolocalização em `page.tsx` são violações ativas. Os quatro em `LoginPage.tsx` são funcionalidades não implementadas (recuperação de senha, reenvio de confirmação, termos legais) que precisarão de páginas reais antes do lançamento.

---

## Achado 6 — `wakeWordListener.ts` é código morto

**Localização**: `src/lib/voice/wakeWordListener.ts`

**Descrição**: O arquivo existe, exporta a classe `WakeWordListener` e o singleton `wakeWordListener`, mas nenhuma busca por importações do módulo no frontend retorna resultado — o recurso foi removido de `page.tsx` mas o arquivo permanece.

**Raciocínio**: Não é um risco de segurança ativo. O tree-shaking do Next.js/Turbopack exclui código sem importação do bundle de produção. Mas é código morto que pode confundir mantenedores futuros.

**Severidade**: 🟢 Baixa

---

## Achado 7 — Chaves e Segredos (verificação completa)

| Item | Status |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ Em `.env.local`, ignorado pelo `.gitignore`. Variáveis públicas por design do Supabase. |
| `GEMINI_API_KEY` | ✅ Apenas em comentário no código e lida via `Deno.env.get()`. Nunca hardcoded. |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Apenas lida via `Deno.env.get()` na Edge Function. Não encontrada no frontend. |
| `scripts/.env` (geração de QR) | ✅ Explicitamente incluída no `.gitignore`. |

**Conclusão**: Nenhuma chave ou segredo hardcoded encontrado no repositório rastreado.

**Severidade**: 🟢 Nenhuma vulnerabilidade

---

## Achado 8 — IDOR na API de voz

**Localização**: `supabase/functions/voice-token/index.ts` linhas 282-295

**Descrição**: O `userId` usado em todas as operações é extraído do JWT Supabase verificado pelo servidor, nunca de input do cliente. IDOR não é aplicável.

**Severidade**: 🟢 Nenhuma vulnerabilidade

---

## Achado 9 — Dependência `@djpfs/react-vlibras` de origem comunitária

**Localização**: `package.json` linha 13

**Descrição**: Wrapper comunitário não-oficial para o widget VLibras do gov.br. O prefixo `@djpfs` indica namespace pessoal, não organização oficial.

**Raciocínio**: O widget em si é carregado do servidor `vlibras.gov.br`. O risco está em continuidade de manutenção do pacote npm, não em segurança imediata. A API pública usada (`forceOnload`) é estável.

**Severidade**: 🟢 Baixa

---

## Sumário de Severidades

| # | Achado | Severidade |
|---|--------|-----------|
| 1 | `USING (true)` em `pontos` | 🟢 Baixa (by design) |
| 2 | `USING (true)` em `trilhas` / `trilha_pontos` | 🟢 Baixa (by design) |
| 3 | Bucket de Storage público sem políticas de MIME | 🟡 Média |
| 4 | CORS `Allow-Origin: *` na Edge Function de voz | 🟡 Média |
| 5 | `alert()` nativo em geolocalização e placeholders de Login | 🟡 Média |
| 6 | `wakeWordListener.ts` — código morto | 🟢 Baixa |
| 7 | Chaves e segredos — nenhum hardcoded | 🟢 Sem vulnerabilidade |
| 8 | IDOR — não aplicável | 🟢 Sem vulnerabilidade |
| 9 | `@djpfs/react-vlibras` — pacote comunitário | 🟢 Baixa |
