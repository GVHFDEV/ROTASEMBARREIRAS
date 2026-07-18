# Documentação do Projeto Rota sem Barreiras

Bem-vindo à documentação oficial do **Rota sem Barreiras**, um PWA (Progressive Web App) mobile-first voltado ao turismo, cultura e inclusão patrimonial na cidade de Governador Valadares (MG). 

Este é um projeto de cunho social vinculado à equipe **Carnelian Escuderia** (STEM Racing / F1 in Schools) em parceria direta com a **ONG UAI** (União dos Amigos da Inclusão).

---

## Estrutura da Documentação

Nesta pasta `docs/`, você encontrará as diretrizes completas do projeto, divididas nos seguintes arquivos:

1. **[Documento de Requisitos (PRD)](file:///d:/ROTASEMBARREIRAS/docs/prd.md)**: O Product Requirement Document contendo a visão geral, público-alvo, escopo, fluxo de usuários, estruturas de dados e regras gerais do aplicativo.
2. **[Regras de Interface & Acessibilidade](file:///d:/ROTASEMBARREIRAS/docs/interface_rules.md)**: As especificações do design system, paleta de cores (Laranja `#ff7f00`), tipografia, tamanhos de toque mínimos, contraste e diretrizes de acessibilidade física e visual aplicadas.
3. **[Histórico de Alterações (Changelog)](file:///d:/ROTASEMBARREIRAS/docs/changelog.md)**: Registro detalhado das modificações efetuadas na interface durante o ciclo de desenvolvimento, incluindo a transição de um mapa SVG para a biblioteca Leaflet, correções de z-index nas telas sobrepostas e ajustes ergonômicos de botões para idosos.

---

## Como Rodar o Protótipo Localmente

1. Certifique-se de ter o **Node.js** e o **npm** instalados.
2. Na raiz do projeto, instale as dependências:
   ```bash
   npm install
   ```
3. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra o navegador no endereço indicado (geralmente [http://localhost:3000](http://localhost:3000)).
