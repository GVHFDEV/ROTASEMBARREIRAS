# Diretrizes de Interface e Acessibilidade (Design System)

Este documento reúne os padrões visuais e as regras de usabilidade estritas do aplicativo **Rota sem Barreiras**, projetados para garantir conformidade estética e acessibilidade para o público-alvo (idosos e PCDs).

---

## 1. Padrões Visuais (Design System)

### 1.1 Paleta de Cores
- **Cor Primária (Brand)**: Laranja `#ff7f00` (usada para botões principais, marcações de destaque ativo, ícones e marca institucional).
- **Suave/Destaque (Brand Light)**: Laranja claro/pêssego `#fff4e6` (fundo para elementos ativos no menu inferior, tags de acessibilidade e backgrounds de botões secundários).
- **Escuro (Brand Dark)**: Laranja queimado `#cc6600` (estados de hover/foco em botões preenchidos).
- **Background Geral do App**: Off-white aquecido `#FAF8F5` (substitui fundos brancos frios para proporcionar maior conforto visual).
- **Background dos Cards**: Branco puro `#FFFFFF` (para contraste ideal sobre o fundo off-white).
- **Texto Principal**: Cinza escuro esverdeado `#222E2D` (alto contraste sem o cansaço do preto puro `#000000`).
- **Texto Secundário / Legendas**: Cinza médio `#6E7A79`.

### 1.2 Tipografia
- Fonte única carregada: **Plus Jakarta Sans** (Google Fonts).
- Tipografia limpa, geométrica, com excelente legibilidade e sem serifa.
- Acentos, pesos e alturas de linha configurados com folga para prevenir sobreposição de letras.

### 1.3 Botões e Controles
- **Formatos**: Cantos arredondados no estilo capsule/pílula (`rounded-full`).
- **Sombras**: Evitar sombras pesadas ou flutuantes artificiais geradas por IA. Utilizar sombras discretas (`shadow-md` ou `shadow-lg` suaves) apenas para dar noção de relevo tátil aos botões sobre o mapa ou cards.
- **Toggles/Switches**: Dimensões ampliadas no perfil (`w-15 h-8.5` com cursor de `w-6.5 h-6.5`) para facilitar o acionamento físico por idosos ou pessoas com tremores motores.

---

## 2. Regras de Acessibilidade Física e Visual

### 2.1 Alvos de Toque Aumentados (Touch Targets)
- Em conformidade com as diretrizes da WCAG (Web Content Accessibility Guidelines) e diretrizes de sistemas móveis (iOS/Android):
  - Todos os botões e áreas interativas possuem dimensões mínimas superiores a **48×48dp** (ex: botão de voltar `w-12 h-12` e input de busca `h-14`).
  - Espaçamentos generosos entre botões adjacentes para evitar toques acidentais (ex: no grid do simulador de QR Code).

### 2.2 Relação de Contraste (WCAG AA)
- Relação de contraste de cores atende à conformidade WCAG AA (mínimo de 4.5:1 para texto normal e 3:1 para texto grande).
- Textos sobrepostos a imagens ou mapas sempre possuem um fundo sólido ou gradiente escuro de contraste (ex: títulos de pontos turísticos possuem gradiente escuro na imagem de capa).

### 2.3 Rótulos e Semântica Visual
- Nenhuma informação é transmitida exclusivamente por meio de cor. Ícones e marcadores são sempre combinados com texto legível ou rótulos alternativos.
- Rótulos do menu inferior são **sempre visíveis**, posicionados verticalmente abaixo de ícones aumentados (`w-6.5 h-6.5`) em uma barra com altura de toque otimizada.

---

## 3. Diretrizes Antimotivos de IA (Anti-GenAI Giveaways)
Para evitar que a interface pareça gerada artificialmente, seguimos as regras estritas:
- **Sem badges decorativos irrelevantes**: Distintivos e selos são restritos a tags de categoria funcionais.
- **Sem emojis**: Emojis são substituídos por ícones vetoriais com traço fino e elegante da biblioteca **Lucide React**.
- **Sem decorações abstratas**: Removidos círculos e padrões geométricos translúcidos sem função em fundos coloridos.
- **Responsividade limpa**: O aplicativo é centralizado em formato de frame mobile no desktop para demonstração fiel de PWA móvel, estendendo-se para 100% de tela cheia no celular.
- **Mapa real e integrado**: Uso do Leaflet com dados geográficos autênticos, sem simulações estáticas em SVG que denunciam soluções incompletas.
- **Sem rodapés de créditos/localização**: É estritamente proibido exibir rodapés com créditos da equipe ('Equipe Carnelian', 'ONG UAI') ou da cidade ('Governador Valadares - MG') na parte inferior das telas (login, perfil, etc.).

