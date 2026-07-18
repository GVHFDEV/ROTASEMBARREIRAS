# Changelog (Histórico de Alterações)

Este arquivo registra todas as modificações, correções e refinamentos realizados no código e na interface do protótipo **Rota sem Barreiras**.

---

## [Versão 1.3.4] — 18/07/2026

### Corrigido (Ajustes Visuais de Hierarquia e Navegação)
- **Sobreposição do Dropdown de Busca**:
  - Ajustamos o `zIndex` do contêiner externo da barra de busca ([SearchBar.tsx](file:///d:/ROTASEMBARREIRAS/src/components/SearchBar.tsx)) para `z-50`.
  - Isso garante que a caixa de sugestões que surge ao digitar termos de busca sobreponha perfeitamente as tags horizontais de categoria do mapa, eliminando o conflito visual anterior.
- **Ocultação Reativa do Botão GPS**:
  - Elevamos o controle de estado da bottom sheet para o componente raiz [page.tsx](file:///d:/ROTASEMBARREIRAS/src/app/page.tsx).
  - Envolvemos o botão GPS em um `<AnimatePresence>`, fazendo com que ele **desapareça suavemente** (fade-out e escala menor) assim que a bottom sheet é levantada/expandida, e reapareça da mesma forma ao recolhê-la.

---

## [Versão 1.3.3] — 18/07/2026

### Corrigido (Ajustes de Camadas e Deslizamento)
- **Hierarquia de Camadas da Bottom Sheet**:
  - Ajustamos o `zIndex` do [ExploreBottomSheet.tsx](file:///d:/ROTASEMBARREIRAS/src/components/ExploreBottomSheet.tsx) para `30` em todas as variantes de estado de animação.
  - Isso garante que a bottom sheet deslize de forma limpa por trás do menu inferior (`BottomNav`, que possui `z-40` e posicionamento relativo) ao ser recolhida ou reduzida para baixo pelo usuário, impossibilitando qualquer sobreposição visual de textos ou elementos interativos no menu.

---

## [Versão 1.3.2] — 18/07/2026

### Corrigido (Ajustes de Altura e Visibilidade)
- **Persistência do BottomNav**:
  - Ajuste nas variantes de animação do [ExploreBottomSheet.tsx](file:///d:/ROTASEMBARREIRAS/src/components/ExploreBottomSheet.tsx) para que seu limite inferior, tanto no estado colapsado quanto no expandido, fique fixo acima do menu inferior (`bottom: calc(env(safe-area-inset-bottom) + 84px)`). Com isso, a barra de navegação principal (`BottomNav`) permanece sempre visível e interativa para o usuário.
- **Posicionamento do Botão de Centrar GPS**:
  - Reajuste do posicionamento vertical do botão de centralizar mapa para `bottom-[106px]` em [page.tsx](file:///d:/ROTASEMBARREIRAS/src/app/page.tsx), reduzindo o vão livre e posicionando-o a exatamente `16px` acima da bottom sheet minimizada.

---

## [Versão 1.3.1] — 18/07/2026

### Corrigido (Overlays e Filtros do Mapa)
- **Posicionamento e Comportamento da Bottom Sheet**:
  - Movimentação do `<ExploreBottomSheet>` para a raiz do dispositivo em `page.tsx` para sincronização com o ponto absoluto do rodapé.
  - Adição de classe `relative` no [BottomNav.tsx](file:///d:/ROTASEMBARREIRAS/src/components/BottomNav.tsx) para habilitar suporte a `z-index`. A bottom sheet recolhida agora fica estável e oculta atrás do menu inferior (`z-30`), mas o sobrepõe perfeitamente ao ser expandida (`z-50`).
  - Resolução de conflitos de empilhamento de cartões: a bottom sheet de exploração é oculta automaticamente sempre que o scanner de QR Code ou os cards de pré-visualização/detalhes de pontos turísticos são ativados.
  - Correção de bugs de animação de troca de abas adicionando variantes de deslize de entrada e saída (`initial` e `exit`) integradas ao `AnimatePresence`.
- **Sincronização de Tags e Filtros**:
  - Correção na filtragem de categorias de pontos turísticos para usar comparação por substring (`.includes()`). Tags como "Cultura" e "Gastronomia" agora filtram corretamente pontos com categorias conjugadas, como "Cultura & Gastronomia" (Mercado Municipal).
  - Atualização da lista de categorias visíveis para corresponder exatamente às existentes no banco de dados (`Patrimônio`, `Cultura`, `Lazer`, `Gastronomia`, `Natureza`, `Religião` e `Todos`).

---

## [Versão 1.3.0] — 18/07/2026

### Adicionado (Recursos Estilo Google Maps)
- **Bottom Sheet Persistente (Vibe Local)**:
  - Desenvolvimento do componente [ExploreBottomSheet.tsx](file:///d:/ROTASEMBARREIRAS/src/components/ExploreBottomSheet.tsx) contendo detalhes de rotas acessíveis, sugestões de visitas e banes informativos.
  - Implementação de controle por gestos de arrasto e cliques para alternar entre os estados minimizado (acima do BottomNav) e expandido (tela inteira cobrindo o BottomNav).
- **Geolocalização Ativa e Centrado do Mapa**:
  - Solicitação automática de permissão de geolocalização ao abrir o mapa.
  - Renderização do marcador de localização do usuário na forma de um ponto azul com animação pulsing em CSS no mapa [CustomMap.tsx](file:///d:/ROTASEMBARREIRAS/src/components/CustomMap.tsx).
  - Adição de botão flutuante de GPS (Navigation icon) que recentra a visualização na localização atual do usuário.
- **Filtros por Badges/Tags de Pesquisa**:
  - Barra de tags horizontais deslizantes posicionada logo abaixo da barra de pesquisa contendo ícones dinâmicos da biblioteca Lucide (Gastronomia, Lazer, Cultura, Patrimônio, História e Todos).
  - Filtragem instantânea e síncrona dos marcadores do mapa e dos resultados de busca baseada nas tags ativas.

---

## [Versão 1.2.2] — 18/07/2026

### Corrigido (Estabilidade Mobile & PWA)
- **Viewport e Rolagem de Tela**:
  - Mudança de `h-screen`/`100vh` para `h-dvh`/`100dvh` (Dynamic Viewport Height) para evitar estouro da área visível do navegador mobile devido à barra de endereço.
  - Bloqueio de rolagens gerais indesejadas na página inteira e efeito "elástico" (bounce) no Safari adicionando `overflow: hidden` e `overscroll-behavior: none` no CSS global.
- **Prevenção de Zoom Automático no Safari**:
  - Remoção de restrições de zoom no viewport meta-tag de `layout.tsx` (permitindo zoom manual livre para acessibilidade).
  - Adição de regra CSS global forçando a fonte de elementos interativos (`input`, `select`, `textarea`) a ter no mínimo `16px`, o que desativa nativamente o zoom automático indesejado no Safari/iOS.
- **Instabilidade do Menu Inferior**:
  - Trava da barra de navegação no rodapé real da tela, impedindo que ela flutue ou suma.
  - Ajuste de safe-area nativa `env(safe-area-inset-bottom)` com fallback de padding inferior no `BottomNav`.
- **Margens de Safe Area com Notch (Notch/Safe-Areas)**:
  - Ajuste de componentes absolutos do topo (`SearchBar`, `ProfileView`, `PointDetails` e `QRCodeScanner`) com a variável CSS `env(safe-area-inset-top)` para evitar sobreposições com a câmera frontal/notch e a barra de status.
- **Build de Prerendering Estático**:
  - Adicionados fallbacks seguros de string (placeholders) em `client.ts`, `server.ts` e `middleware.ts` para evitar erros de compilação em builds onde as chaves do Supabase não estão presentes no ambiente Node.

---

## [Versão 1.2.1] — 18/07/2026

### Ajustado
- **Layout do Onboarding**:
  - Inclusão do logotipo em negrito "Rota sem Barreiras" no topo da tela de boas-vindas.
  - Centralização vertical e alinhamento equilibrado da ilustração vetorial com os textos.
  - Adição de aviso de Termos de Uso e Política de Privacidade de forma interativa abaixo do botão de prosseguir.

---

## [Versão 1.2.0] — 18/07/2026

### Adicionado
- **Fluxo de Login Multi-Telas**: Redesenho completo do sistema de login, expandindo-o para 4 telas sequenciais animadas com Framer Motion:
  - **Onboarding/Boas-vindas**: Com ilustração SVG exclusiva e botões sociais de alta fidelidade (Apple e Google) e acesso via e-mail.
  - **Sign In (Entrar)**: Formatação idêntica ao print de referência, contendo logo central, atalhos sociais, divisor, caixas de input arredondadas (`rounded-full`) de e-mail/senha com toggle de visualização, link de recuperar senha e botão `CREATE ONE`.
  - **Sign Up (Criar Conta)**: Formulário para cadastro completo de nome, e-mail, senha e confirmação.
  - **Verificação de E-mail**: Tela com animação de mensagem confirmada e 6 inputs numéricos focáveis que pulam automaticamente.
- **Integração com Supabase Auth**: Integration real dos novos fluxos de Onboarding, Sign In, Sign Up e a Verificação com os métodos `login` e `signup` do Supabase via `useAuth()`.

---

## [Versão 1.1.0] — 18/07/2026

### Adicionado
- **Integração com Leaflet**: Substituição do mapa SVG original por um mapa real georreferenciado com a biblioteca Leaflet e tiles minimalistas do CartoDB Positron.
- **Coordenadas Reais**: Atualização da base de dados de pontos turísticos (`mockData.ts`) com latitude e longitude reais de Governador Valadares (MG).
- **Rótulos Sempre Visíveis**: A barra de navegação inferior foi redirecionada para que os rótulos de texto de cada aba fiquem permanentemente visíveis abaixo do respectivo ícone (em formato vertical de alta acessibilidade).

### Corrigido
- **Bug de Sobreposição do Menu Inferior**: As telas de detalhes (`PointDetails`) e o leitor de QR Code (`QRCodeScanner`) foram movidos para a raiz do frame do dispositivo em `page.tsx`. Sendo elementos absolutos com `z-50`, agora cobrem perfeitamente o menu inferior ao serem abertos, eliminando o erro de sobreposição relatado.
- **Bug de Travamento de Navegação**: Ao alternar abas no `BottomNav`, qualquer slide-over de detalhes de ponto turístico ou leitor de QR Code aberto é fechado automaticamente, limpando a tela e liberando a navegação.
- **Tamanho das Áreas de Toque (Acessibilidade)**:
  - Altura do input de busca expandida de `h-12` para `h-14` (56px) com fonte ampliada para `text-base` (evita zoom do teclado móvel).
  - Botão de acionamento do QR Code na busca aumentado para `w-11 h-11`.
  - Botão principal "Ver Detalhes do Local" do painel inferior ampliado com preenchimento generoso (`py-4.5`) e texto em tamanho `text-base font-extrabold`.
  - Interruptores/Switches das preferências de acessibilidade ampliados para `w-15 h-8.5` com cursor de `w-6.5 h-6.5` (otimizados para uso sênior).
  - Botão de voltar na tela de detalhes do local expandido para `w-12 h-12` com ícone mais espesso.
  - Botões simuladores de escaneamento de QR Code aumentados para o formato de cartões de toque amplos.

### Removido
- **Indicador de Zoom**: Removida a div flutuante transparente com a legenda de instruções de controle de zoom no rodapé do mapa para manter a visualização limpa.
- **Círculos Decorativos**: Removidos os circles geométricos opacos em background dos cards de cor primária em `ProfileView.tsx` e `PointDetails.tsx`.
- **Badge de Contagem**: Removido o badge numérico que marcava a quantidade de locais pesquisados na listagem do perfil.
- **Emojis**: Removidos emojis nos botões do simulador de leitura no leitor de QR Code, substituídos por ícones Lucide.

---

## [Versão 1.0.0] — 18/07/2026
- Inicialização do projeto em Next.js com Tailwind CSS v4 e Framer Motion.
- Criação dos componentes estruturais iniciais: `BottomNav`, `SearchBar`, `CustomMap`, `BottomSheet`, `QRCodeScanner`, `PointDetails` e `ProfileView`.
- Criação dos dados mockados iniciais de Governador Valadares.
- Definição das cores base e tipografia Plus Jakarta Sans no design system.
