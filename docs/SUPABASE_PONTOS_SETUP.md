# Setup pontos table + Storage — passo a passo

Contexto: app Next.js já code-complete, espera tabela `pontos` existir com este schema exato. SQL abaixo já testado contra código (build passou). Copie pra outra IA/você mesmo executar no Supabase.

## 1. Rodar SQL

Supabase Dashboard → SQL Editor → New query → colar conteúdo de `supabase/migrations.sql` (arquivo completo do projeto) → Run.

Cria: `profiles`, `pontos`, `user_searches`, `user_favorites`, `accessibility_preferences` + triggers + RLS policies. Tudo em uma run, ordem já resolvida (FKs corretas).

## 2. Confirmar RLS pontos

Table Editor → `pontos` → aba Policies. Deve ter só 1 policy: `pontos_select_authenticated` (SELECT, role `authenticated`). Nenhuma policy de INSERT/UPDATE/DELETE — correto, é assim que fica. Escrita só via Table Editor (roda com privilégio de dashboard, ignora RLS) ou script com `service_role` key (nunca no frontend).

## 3. Criar bucket de Storage p/ imagens

Storage → New bucket:
- nome: `pontos-imagens`
- Public bucket: **ligado** (imagens precisam ser acessíveis via URL direta no app, sem auth)

Dentro do bucket, sugestão de organização por pasta:
```
pontos-imagens/
  ibituruna/capa.jpg
  ibituruna/galeria-1.jpg
  ibituruna/galeria-2.jpg
  ibituruna/audio.mp3
  ibituruna/audiodescricao.mp3
  estacao/capa.jpg
  ...
```

Nome de pasta não precisa bater com `id` da linha (é uuid gerado). Usar nome curto do local só ajuda organização manual.

## 4. Pegar URL pública de cada arquivo

Após upload, Storage → arquivo → botão "..." → Copy URL. Formato:
```
https://<project-ref>.supabase.co/storage/v1/object/public/pontos-imagens/ibituruna/capa.jpg
```
Essa URL completa vai direto nas colunas `imagem_capa`, `galeria_imagens`, `audio_url`, `audiodescricao_url`, `video_libras_url`.

## 5. Cadastrar ponto via ferramenta interna (recomendado) ou Table Editor

Existe uma ferramenta interna em `/admin/pontos` (`src/app/admin/pontos/page.tsx`) que preenche a maior parte deste formulário automaticamente: o campo de endereço usa a mesma busca Photon do app, e latitude/longitude são capturados automaticamente do resultado selecionado (sem precisar consultar o Google Maps manualmente). Requer rodar `supabase/migrations_pontos_insert.sql` (adiciona a policy de INSERT para `authenticated`) e estar logado com uma conta não-anônima.

**Atenção de segurança:** essa rota não tem controle de admin/role — qualquer conta autenticada (não visitante) consegue cadastrar pontos por ela. Mantenha a URL interna/não divulgada até que um sistema de papéis (`is_admin`) seja adicionado — ver comentário no topo de `migrations_pontos_insert.sql`.

Alternativa manual (sem preencher nenhum campo automaticamente):

Table Editor → `pontos` → Insert row. Campos:

| Coluna | Tipo | Preencher com |
|---|---|---|
| `nome` | text | "Pico da Ibituruna" |
| `categoria` | text | "Natureza & Aventura" |
| `latitude` | float8 | -18.8872 |
| `longitude` | float8 | -41.9161 |
| `endereco` | text | endereço completo |
| `descricao_curta` | text | texto curto (card/preview) |
| `descricao_longa` | text | texto longo (tela detalhe, seção "História") |
| `imagem_capa` | text | URL pública do Storage |
| `galeria_imagens` | text[] | usar editor de array do Table Editor, colar cada URL |
| `acessibilidade_rampa` | bool | true/false |
| `acessibilidade_audio` | bool | true/false |
| `acessibilidade_braille` | bool | true/false |
| `acessibilidade_libras` | bool | true/false |
| `acessibilidade_detalhes` | jsonb | array de objetos `{"texto": "...", "estado": "tem" \| "nao_tem" \| "nao_verificado"}`, ex: `[{"texto": "Rampa de acesso ao mirante", "estado": "tem"}]` |
| `audio_url` | text | URL do áudio (opcional, deixar null se não tiver) |
| `audiodescricao_url` | text | URL da audiodescrição (opcional) |
| `video_libras_url` | text | URL do vídeo em Libras (opcional) |
| `qr_code_value` | text | valor único gravado no QR físico, ex: "rota-ibituruna" |

`id`, `criado_em`, `atualizado_em` são automáticos — não preencher.

## 6. Testar no app

App já busca `pontos` automaticamente (sem cache, sem mock). Depois de salvar linha no Table Editor:
1. Recarregar app (F5)
2. Ponto aparece no mapa + busca + scanner de QR
3. Clicar → tela detalhe mostra tudo: galeria (se tiver), acessibilidade, botões de áudio/audiodescrição/Libras (só aparecem se URL preenchida)

Nenhuma alteração de código necessária pra próximos cadastros — é só popular a tabela.

## Arquivos de referência no projeto

- `supabase/migrations.sql` — SQL completo (rodar 1x)
- `src/types/database.ts` — `PontoRow`, espelha schema exato
- `src/types/point.ts` — `TouristPoint`, tipo usado pelos componentes
- `src/services/pointsService.ts` — `fetchTouristPoints()` faz o `select * from pontos`
