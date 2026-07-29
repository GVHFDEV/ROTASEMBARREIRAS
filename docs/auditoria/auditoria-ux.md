# Auditoria de UX e Coerência de Produto — Rota sem Barreiras

> **Escopo**: análise das telas, fluxos de usuário, regras de interface documentadas e componentes React. Nenhum arquivo foi modificado.
> **Data**: 2026-07-27

---

## Resumo Executivo

O produto tem uma identidade visual e uma arquitetura de componentes coesas, alinhadas ao PRD e às `interface_rules.md`. O assistente de voz e o sistema de trilhas são os diferenciais mais potentes. Os problemas de UX encontrados são principalmente de polimento e de funcionalidades incompletas, não de falhas de conceito. Há um gap importante entre o que o assistente de voz **pode fazer** e o que o usuário **descobre que pode fazer** — o onboarding do assistente é inexistente.

---

## Achado UX-1 — Assistente de voz não tem onboarding nem dicas de comandos

**Localização**: `src/components/VoiceView.tsx`

**Descrição**: A aba de voz abre diretamente com o botão de conectar, sem nenhuma indicação do que o assistente pode fazer. O usuário precisa descobrir sozinho que pode dizer coisas como "mostre o ponto mais próximo de mim", "ative alto contraste", "abra a trilha de Governador Valadares", "qual é o meu XP?".

**Impacto no público-alvo**: O público primário inclui idosos e pessoas com baixa familiaridade digital — exatamente quem mais se beneficiaria de um assistente de voz, mas que provavelmente não vai descobrir seus poderes sem orientação.

**Coerência com produto**: O PRD especifica "pessoas com baixa familiaridade digital" como público. A ausência de orientação contraria diretamente esse objetivo.

**Sugestão de melhoria**: Uma tela de estado "idle" com 3-4 exemplos de frases ("Experimente dizer:") que rotacionem suavemente enquanto o usuário não iniciou sessão. Essas dicas desapareceriam quando a sessão começasse.

**Severidade de UX**: 🔴 Alta — afeta diretamente a descobribilidade da feature mais diferencial do produto

---

## Achado UX-2 — Feedback de estado do assistente após navegação é incompleto

**Localização**: `src/services/voiceActionExecutor.ts` linhas 138-142 e 150-155

**Descrição**: Quando o assistente navega para outra tela (ex: "vai para o mapa" → `goToMap()`), o `sideEffect` é executado após o turno de fala terminar, o que é correto. Porém, a VoiceView é **desmontada** quando o tab muda — a sessão WebSocket é interrompida junto com ela.

**Problema**: O usuário diz "vai para as trilhas" → o assistente confirma → a tela muda → a sessão de voz é encerrada. Para falar de novo, o usuário precisa voltar à aba de voz manualmente e reconectar. Isso quebra a expectativa de um assistente "persistente".

**Coerência com produto**: A arquitetura está correta (montar/desmontar ao mudar de aba é mais simples e econômico), mas o contrato com o usuário não está claro — ele não sabe que vai perder a conexão ao navegar.

**Sugestão de melhoria**: Antes de executar qualquer `sideEffect` de navegação, o assistente poderia dizer algo como "Abrindo as trilhas! Você pode voltar à aba de voz para continuar conversando." Isso seria fácil de adicionar no `buildSystemInstruction` como diretriz.

**Severidade de UX**: 🟡 Média

---

## Achado UX-3 — `alert()` nativo em falha de geolocalização do mapa

**Localização**: `src/app/page.tsx` linhas 175 e 180

**Descrição**: Já documentado em Segurança-5. Do ponto de vista de UX: quando o usuário toca no botão de recentralizar e a geolocalização falha, um `alert()` blocante aparece, interrompendo completamente a interação com o mapa por uma mensagem de erro genérica.

**Impacto**: Para usuário com leitor de tela ativo, `alert()` causa anúncio disruptivo e foco de teclado saltando. Para idosos, a caixa de alerta pode ser confusa.

**Sugestão**: Substituir por um toast/snackbar não-blocante no rodapé do mapa, com texto legível e que desapareça após 4 segundos.

**Severidade de UX**: 🟡 Média

---

## Achado UX-4 — Termos de Uso, Política de Privacidade e Recuperação de Senha são placeholders com `alert()`

**Localização**: `src/components/LoginPage.tsx` linhas 259, 261, 389, 625

**Descrição**: Quatro funcionalidades importantes estão implementadas como `alert("Simulação: ...")`:
- Termos de Uso
- Política de Privacidade
- "Esqueceu sua senha" (redefinição)
- "Reenviar email de confirmação"

**Impacto legal e de UX**: Termos de Uso e Política de Privacidade são **requisitos legais** para aplicativos que coletam dados pessoais (LGPD — Lei Geral de Proteção de Dados). A recuperação de senha é funcionalidade essencial de qualquer sistema de autenticação.

**Nota**: O Supabase já oferece o fluxo de "reset password by email" via `supabase.auth.resetPasswordForEmail()` — a implementação seria simples.

**Severidade de UX**: 🔴 Alta — Termos/Privacidade são obrigações legais; recuperação de senha é essencial para o lançamento

---

## Achado UX-5 — A aba de voz não comunica o custo de conexão ao usuário

**Localização**: `src/components/VoiceView.tsx`

**Descrição**: Cada toque no botão de iniciar sessão consome um slot de rate-limit (5 por minuto por usuário) e abre uma conexão WebSocket com o Gemini. Se o usuário toca repetidamente no botão sem entender que a sessão já está conectando, pode esgotar o limite e receber um erro `429`.

**Impacto**: O estado `connecting` exibe "Conectando..." mas o botão de conectar some e aparece o de parar. O fluxo parece funcionar corretamente. **Porém**, se a conexão falhar silenciosamente (timeout de rede), o estado volta para `idle` sem feedback claro sobre o que aconteceu.

**Sugestão**: Em estado de erro de conexão, exibir a mensagem de erro por pelo menos 5 segundos antes de voltar ao idle, com um botão explícito de "Tentar novamente".

**Severidade de UX**: 🟡 Média

---

## Achado UX-6 — Sistema de XP não tem feedback visual acumulativo

**Localização**: Sistema de trilhas em `TrailsView.tsx` / `trailsService.ts`

**Descrição**: O XP existe no banco de dados (`xp_value` por ponto, `fetchTotalXp()` retorna o total), e o assistente de voz pode informar o XP via `get_total_xp` e `get_user_info`. Mas não há nenhuma representação visual do XP na UI fora do assistente de voz.

**Impacto na gamificação**: O usuário escaneia um QR code e... vê a tela de detalhes do ponto (ou volta para a trilha). Não há celebração, não há "+10 XP!" aparecendo, não há barra de progresso pessoal, não há histórico de XP. A gamificação existe na arquitetura mas não na experiência.

**Coerência com produto**: O changelog (v1.5.1) menciona "total de XP acumulado" como dado disponível para o assistente, sugerindo que a intenção é que o XP seja um elemento central, mas a UI não o expõe.

**Sugestão**: Adicionar ao `ProfileView` um card de XP total com contador animado. Adicionar um toast de "+N XP" após um scan bem-sucedido.

**Severidade de UX**: 🟡 Média

---

## Achado UX-7 — `src/data/` está vazio — possível resíduo de dados mockados

**Localização**: `src/data/` (diretório vazio)

**Descrição**: O diretório `src/data/` existe mas está vazio. Nos estágios iniciais do produto (PRD menciona "dados mockados"), havia provavelmente arquivos de dados estáticos aqui. Foram removidos quando o Supabase foi integrado.

**Impacto**: Nenhum funcional. Apenas ruído estrutural.

**Severidade de UX**: 🟢 Baixa (manutenção)

---

## Achado UX-8 — `voice-assistant/` está vazio dentro de `supabase/functions/`

**Localização**: `supabase/functions/voice-assistant/` (diretório vazio)

**Descrição**: Uma segunda Edge Function chamada `voice-assistant` existe como diretório vazio, sugerindo uma tentativa anterior de arquitetura (possivelmente a versão Groq/Whisper antes do Gemini Live). Apenas `voice-token` está ativa e funcional.

**Impacto**: Nenhum funcional. Pode confundir quem lê a estrutura do projeto.

**Severidade de UX**: 🟢 Baixa (manutenção)

---

## Achado UX-9 — Ausência de estado de "sem pontos cadastrados" na tela inicial

**Localização**: `src/components/CustomMap.tsx` e `src/app/page.tsx`

**Descrição**: Se o Supabase estiver vazio (nenhum ponto cadastrado), o mapa carrega sem nenhum pin. O usuário vê apenas o mapa de Governador Valadares sem orientação sobre o que fazer.

**Impacto**: Em um deploy fresh (antes do primeiro cadastro no Supabase), a experiência é confusa — parece um app quebrado.

**Sugestão**: Um estado de "nenhum ponto disponível ainda" com uma mensagem informativa sobreposta ao mapa.

**Severidade de UX**: 🟡 Média (especialmente relevante durante o período de cadastro inicial dos pontos)

---

## Achado UX-10 — Acessibilidade: `lang="pt-BR"` correto, mas `aria-label` ausente em vários elementos interativos

**Localização**: múltiplos componentes

**Descrição**: A análise estática de alguns componentes mostra que botões de ação têm `title` (tooltip), mas alguns carecem de `aria-label` explícito para leitores de tela. O `title` não é confiável em todos os contextos de leitura de tela mobile.

**Impacto**: Para o público com deficiência visual que usa VoiceOver (iOS) ou TalkBack (Android), botões com apenas `title` podem ser anunciados incorretamente.

**Nota**: Uma auditoria completa de acessibilidade com ferramentas como axe-core ou Lighthouse precisaria rodar no browser para mapear todos os elementos afetados — isso vai além do que é possível por análise estática.

**Severidade de UX**: 🟡 Média (requere auditoria de acessibilidade com ferramenta dedicada)

---

## Sumário de Achados de UX

| # | Achado | Severidade |
|---|--------|-----------|
| UX-1 | Assistente de voz sem onboarding/dicas | 🔴 Alta |
| UX-2 | Sessão de voz encerrada ao navegar sem aviso | 🟡 Média |
| UX-3 | `alert()` nativo em falha de geolocalização | 🟡 Média |
| UX-4 | Termos, Privacidade, Recuperação de senha como placeholders | 🔴 Alta |
| UX-5 | Feedback insuficiente em falha de conexão de voz | 🟡 Média |
| UX-6 | XP existe mas sem representação visual na UI | 🟡 Média |
| UX-7 | `src/data/` vazio — resíduo de mockados | 🟢 Baixa |
| UX-8 | `voice-assistant/` diretório vazio | 🟢 Baixa |
| UX-9 | Sem estado de "nenhum ponto cadastrado" no mapa | 🟡 Média |
| UX-10 | Possível ausência de `aria-label` em elementos interativos | 🟡 Média (requer auditoria dedicada) |
