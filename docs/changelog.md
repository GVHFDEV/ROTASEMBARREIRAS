# Changelog (Histórico de Alterações)

Este arquivo registra todas as modificações, correções e refinamentos realizados no código e na interface do protótipo **Rota sem Barreiras**.

---

## [Versão 1.4.3] — 18/07/2026

### Adicionado (Integração Oficial do VLibras gov.br)
- **Carregamento Seguro e Reutilização de Script**:
  - Correção na inicialização dinâmica do plugin do VLibras em [VLibrasWidget.tsx](file:///d:/ROTASEMBARREIRAS/src/components/VLibrasWidget.tsx). Agora o componente verifica se o script oficial `vlibras-plugin.js` já está inserido no DOM ou se a biblioteca `window.VLibras` já foi declarada (evitando a duplicação do script ou travamento de eventos durante transições de abas e Hot Reload do Next.js).
- **Controle de Abertura e Ocultação Dinâmica**:
  - O contêiner de inicialização do widget `div[vw]` tem seu estado de exibição CSS controlado dinamicamente de acordo com o parâmetro `vLibrasActive` vindo do menu de acessibilidade.
  - Ao ser habilitado, o widget é renderizado com a propriedade `display: block` e simulamos a ativação do avatar executando um clique programático no seletor `[vw-access-button]`. Ao ser desativado, o avatar é recolhido e a bolinha do widget é ocultada de forma total (`display: none`).
- **Posicionamento Interno e Prevenção de Conflitos**:
  - Sobrescrevemos o estilo original de `position: fixed` do VLibras para `position: absolute !important` em [globals.css](file:///d:/ROTASEMBARREIRAS/src/app/globals.css).
  - Posicionamos a bolinha e o painel de forma absoluta no canto inferior esquerdo (`bottom: 96px`, `left: 12px`) do simulador mobile. Isso mantém a experiência retida dentro da interface simulada (em vez de escapar para os limites da janela principal no desktop) e evita qualquer interferência com o botão GPS localizado no canto inferior direito.

---

## [Versão 1.4.2] — 18/07/2026

### Corrigido (Ajustes de Visibilidade em Alto Contraste e VLibras)
- **Especificidade de Textos em Badges**:
  - Correção nas regras CSS de especificidade em [globals.css](file:///d:/ROTASEMBARREIRAS/src/app/globals.css). Adicionamos seletores combinados `.bg-brand.text-brand` e `.bg-brand-light.text-brand` para garantir que o texto das tags de acessibilidade (como "Acessível" e "Áudio") e categorias no BottomSheet de pontos turísticos adotem a cor preta (`#000000`) sobre o fundo amarelo, evitando o conflito anterior que as deixava amarelas (invisíveis).
- **Exibição de Imagens**:
  - Correção na regra CSS que forçava gradientes absolutos colocados sobre as imagens a ficarem pretos em alto contraste. Adicionamos uma regra que define `background-color: transparent !important` em qualquer classe contendo `bg-gradient-` sob o escopo `.theme-high-contrast`, garantindo o carregamento e exibição normais das fotos de cobertura dos pontos turísticos.
- **VLibras**:
  - Remoção do painel indicador simulado do VLibras que surgia na parte inferior do painel lateral de acessibilidade ao ativar o toggle, limpando o layout.

---

## [Versão 1.4.1] — 18/07/2026

### Corrigido (Ajustes de Acessibilidade e Alto Contraste)
- **Textos em Alto Contraste**:
  - Correção nas regras CSS de alto contraste em [globals.css](file:///d:/ROTASEMBARREIRAS/src/app/globals.css). Adicionamos seletores específicos que forçam os filhos de contêineres de marca (`.bg-brand`, `.bg-brand-light`) a adotar cor de texto preta (`#000000`). Isso corrige a invisibilidade das tags de acessibilidade e categorias (que antes apareciam em amarelo-no-amarelo).
- **Proteção de Layout sob Zoom de Texto**:
  - Mudança no método de escala de fontes: abandonamos seletores percentuais absolutos que causavam duplicação em cascata de tamanhos em textos aninhados. Em seu lugar, sobrescrevemos localmente as variáveis customizadas de tipografia do Tailwind (`--text-xs`, `--text-sm`, `--text-base`, etc.) dentro das classes `.font-scale-lg` e `.font-scale-xl`.
  - Ampliação da largura física do painel lateral de acessibilidade para `w-[325px]` em [AccessibilityMenu.tsx](file:///d:/ROTASEMBARREIRAS/src/components/AccessibilityMenu.tsx) para acomodar melhor os textos e botões de controle.
  - Implementação de proteções de layout no painel: uso de `flex-shrink-0` nas chaves toggle e botões de ajuste e `min-w-0 flex-1` nas colunas de texto para evitar quebras ou deslocamentos.
  - Adição de um limitador de escala para as fontes de controle do próprio painel para impedir quebras internas nos botões de aumento de texto.

---

## [Versão 1.4.0] — 18/07/2026

### Adicionado (Menu de Acessibilidade Flutuante)
- **Botão Flutuante Lateral**:
  - Inclusão do botão flutuante de acessibilidade (ícone de acessibilidade) posicionado no meio da lateral direita (`top-[45%] -translate-y-1/2`) em [page.tsx](file:///d:/ROTASEMBARREIRAS/src/app/page.tsx). Ele está posicionado estrategicamente para evitar qualquer sobreposição com o `BottomNav` ou o botão de recentralizar.
- **Painel de Recursos e Toggles ([AccessibilityMenu.tsx](file:///d:/ROTASEMBARREIRAS/src/components/AccessibilityMenu.tsx))**:
  - Criação de um menu slide-over lateral animado contendo 4 toggles/opções principais de acessibilidade:
    - **VLibras**: Ativação simulada de tradutor em libras.
    - **Alto Contraste**: Inversão de cores de alta visibilidade.
    - **Tamanho de Fonte**: Controles de zoom de texto (`A+` / `A-`) com três escalas (Normal, Grande, Extra Grande).
    - **Leitura em Voz Alta**: Ativação simulada de sintetizador de voz.
  - Ergonomia aprimorada com botões e seletores tendo alvos de toque maiores ou iguais a `44×44pt`.
- **Prototipagem de Alto Contraste e Escala de Fontes ([globals.css](file:///d:/ROTASEMBARREIRAS/src/app/globals.css))**:
  - **CSS do Alto Contraste (`.theme-high-contrast`)**: Sobrescreve todos os fundos do app para preto, textos e ícones para branco/amarelo, e aplica filtro CSS de inversão nas camadas do mapa Leaflet (`.leaflet-tile`), transformando-o em um mapa de ruas de alto contraste.
  - **CSS de Escala de Fontes (`.font-scale-lg` / `.font-scale-xl`)**: Aumenta o tamanho do texto de todo o app proporcionalmente (112% e 125%, respectivamente).

---

## [Versão 1.3.6] — 18/07/2026

### Corrigido (Ajustes de Panning e Altura do Preview)
- **Arrasto Livre de Câmera (Panning)**:
  - Remoção das propriedades de restrição geográfica `maxBounds` e `maxBoundsViscosity` em [CustomMap.tsx](file:///d:/ROTASEMBARREIRAS/src/components/CustomMap.tsx), permitindo que o usuário navegue e mova o mapa livremente.
  - Mantivemos o zoom mínimo e máximo ativos para evitar visualizações fora do mapa-múndi.
- **Posicionamento da Bottom Sheet de Preview**:
  - Ajuste na classe de posicionamento da bottom sheet de resumo de locais ([BottomSheet.tsx](file:///d:/ROTASEMBARREIRAS/src/components/BottomSheet.tsx)) para `bottom-0`.
  - Como o componente é montado dentro do contêiner da aba de mapas (`home-tab` - cuja base se apoia diretamente no topo do menu de abas), o valor `bottom-0` elimina qualquer vão cinza duplicado e a posiciona com precisão imediatamente acima do menu.
