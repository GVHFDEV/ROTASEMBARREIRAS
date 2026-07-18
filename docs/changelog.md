# Changelog (Histórico de Alterações)

Este arquivo registra todas as modificações, correções e refinamentos realizados no código e na interface do protótipo **Rota sem Barreiras**.

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
- **Integração com Supabase Auth**: Integração real dos novos fluxos de Onboarding, Sign In, Sign Up e a Verificação com os métodos `login` e `signup` do Supabase via `useAuth()`.

---

## [Versão 1.1.0] — 18/07/2026

### Adicionado
- **Integração com Leaflet**: Substituição do mapa SVG original por um mapa real georreferenciado com a biblioteca Leaflet e tiles minimalistas do CartoDB Positron.
- **Coordenadas Reais**: Atualização da base de dados de pontos turísticos (`mockData.ts`) com latitude e longitude reais de Governador Valadares (MG).
- **Rótulos Sempre Visíveis**: A barra de navegação inferior foi redesenhada para que os rótulos de texto de cada aba fiquem permanentemente visíveis abaixo do respectivo ícone (em formato vertical de alta acessibilidade).

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
- **Círculos Decorativos**: Removidos os círculos geométricos opacos em background dos cards de cor primária em `ProfileView.tsx` e `PointDetails.tsx`.
- **Badge de Contagem**: Removido o badge numérico que marcava a quantidade de locais pesquisados na listagem do perfil.
- **Emojis**: Removidos emojis nos botões do simulador de leitura no leitor de QR Code, substituídos por ícones Lucide.

---

## [Versão 1.0.0] — 18/07/2026
- Inicialização do projeto em Next.js com Tailwind CSS v4 e Framer Motion.
- Criação dos componentes estruturais iniciais: `BottomNav`, `SearchBar`, `CustomMap`, `BottomSheet`, `QRCodeScanner`, `PointDetails` e `ProfileView`.
- Criação dos dados mockados iniciais de Governador Valadares.
- Definição das cores base e tipografia Plus Jakarta Sans no design system.
