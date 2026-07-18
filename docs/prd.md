# PRD — Rota sem Barreiras

## 1. Visão Geral
**Rota sem Barreiras** é um PWA mobile-first de turismo acessível para Governador Valadares (MG). Permite que qualquer pessoa — com foco especial em pessoas com deficiência, idosos e pessoas com baixa familiaridade com tecnologia — encontre pontos turísticos, culturais e patrimoniais da cidade via mapa e acesse informações acessíveis de cada ponto ao escanear um QR code físico instalado no local, ou buscando por texto dentro do app.

---

## 2. Contexto e Parceria
- Projeto social da equipe **Carnelian Escuderia**, ligada ao programa STEM Racing / F1 in Schools.
- Desenvolvido em parceria com a **ONG UAI** — União dos Amigos da Inclusão (nome fantasia Equovila/UAI).
- A UAI está estruturando a proposta *"Rota Valadares Acessível — Cultura, Turismo e Inclusão"* para o Edital Rio Doce Participativo e Comunitário.
- **Escopo da proposta da UAI**: rota acessível piloto com inicialmente 5 pontos culturais/turísticos/patrimoniais/naturais da cidade, acessados por QR Code, reunindo conteúdos acessíveis (texto, imagem, áudio, audiodescrição, vídeo em Libras, materiais educativos, recursos táteis).
- A UAI solicitou à Carnelian uma carta de intenção de apoio ao projeto (não representa compromisso financeiro imediato).
- Possibilidade de expansão futura para além de Governador Valadares.

---

## 3. Objetivo do Produto
Dar acesso digital, acessível e centralizado às informações de patrimônios da cidade, permitindo que pessoas com deficiência (visual, auditiva, motora) e idosos consigam visitar, entender e navegar pelos pontos turísticos com autonomia.

---

## 4. Público-Alvo
- Pessoas com deficiência visual, auditiva ou motora
- Idosos e pessoas com baixa familiaridade digital
- Turistas e moradores locais em geral

*Implicação de design: a interface precisa priorizar alvos de toque grandes, alto contraste, textos legíveis e navegação simples — precisa "parecer um app real", não um protótipo genérico.*

---

## 5. Escopo da Primeira Versão (Protótipo de Interface)
- Foco exclusivo em interface visual e fluxo de navegação.
- Dados mockados, sem backend funcional nesta etapa.
- Sem servidor — o backend futuro será Supabase.
- Recursos avançados de acessibilidade (Libras, audiodescrição, leitor de tela, alto contraste, navegação por teclado/switch) ficam fora deste protótipo inicial — serão adicionados de forma simplificada em etapa posterior.
- Recursos táteis (impressão 3D, mapas táteis) ficam para uma fase futura, fora do app.

---

## 6. Plataforma e Stack
- **Formato**: PWA / site responsivo, mobile-first (não é app nativo).
- **Banco de dados (futuro)**: Supabase.
- **Mapa**: OpenStreetMap como fonte de dados, via Leaflet, com tiles neutros (CartoDB Positron) e pins customizados.
- **Desenvolvimento assistido por IA**: Antigravity (para design/interface) e Claude Code.

---

## 7. Fluxo Principal do Usuário
1. O usuário abre o app na tela **Home/Explorar**: visualiza o mapa com pins dos pontos turísticos de Governador Valadares.
2. O usuário busca um ponto por texto ou aciona o leitor de QR code para simular o escaneamento de uma placa física no local.
3. Ao tocar em um pin ou efetuar a busca, abre-se um card de preview do ponto turístico na parte inferior.
4. O usuário acessa a tela de detalhes do ponto, com as informações históricas e os recursos de acessibilidade daquele local.
5. O usuário navega para a tela de **Perfil** para gerenciar seus dados e visualizar o histórico de locais pesquisados.

---

## 8. Estrutura de Telas

### 8.1 Home / Explorar
- Mapa (sem lista de pontos) ocupando a tela inteira.
- Barra de busca no topo: campo de texto + atalho de leitor de QR code.
- Pins customizados no mapa; o toque abre o card de preview (nome, categoria, atalhos rápidos).
- Controles de mapa: botões de zoom (+/−) visíveis e botão de redefinir foco — sem depender apenas de gestos de pinça.
- Barra de navegação inferior (Bottom Navigation) fixa com 2 itens: Explorar e Perfil.

### 8.2 Detalhe do Ponto Turístico
- Imagem de capa grande do local.
- Categoria do ponto (tag) e nome.
- Endereço físico completo.
- Seção de acessibilidade do local detalhada (rampas, áudio, Braille, Libras) — com destaque especial e legibilidade aprimorada, considerando no futuro um botão de "ouvir descrição" (texto-para-voz).
- Lista de recursos de acessibilidade confirmados (entrada plana, sinalização tátil, vídeo-guia).
- Banner institucional sutil sobre a parceria com a ONG UAI e a equipe Carnelian.

### 8.3 Perfil
- Cabeçalho do perfil do usuário (avatar, nome, e-mail).
- Card de identificação institucional do projeto (Carnelian & ONG UAI).
- Lista de locais pesquisados (histórico de visitas/consultas), com miniatura, nome e categoria de cada ponto.
- Configurações e toggles de preferências de acessibilidade.

---

## 9. Estrutura de Dados do Ponto Turístico
Os pontos de turismo no protótipo contêm os seguintes campos:
- `id`: Identificador único (string).
- `nome`: Título do ponto (string).
- `categoria`: Ex: "Natureza & Aventura", "Patrimônio Histórico" (string).
- `coords`: Latitude e Longitude (objeto `{ lat, lng }`).
- `image`: URL da imagem ilustrativa (string).
- `description`: Resumo explicativo do local (string).
- `accessibility`: Registro estruturado de recursos como rampas, áudio, Braille e Libras, incluindo uma lista textual descritiva de cada item.
- `history`: Contextualização histórico-cultural do local (string).
- `address`: Endereço de localização física (string).
- `qrCodeValue`: Valor correspondente gravado no QR Code simulado (string).
- *Campos de reserva para dados futuros (áudios originais, vídeos em Libras e texto alternativo).*
