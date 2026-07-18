export interface TouristPoint {
  id: string;
  name: string;
  category: string;
  coords: { lat: number; lng: number }; // Real Latitude and Longitude coordinates
  image: string;
  description: string;
  accessibility: {
    wheelchair: boolean;
    audio: boolean;
    braille: boolean;
    libras: boolean;
    details: string[];
  };
  history: string;
  address: string;
  qrCodeValue: string;
}

export const touristPoints: TouristPoint[] = [
  {
    id: "ibituruna",
    name: "Pico da Ibituruna",
    category: "Natureza & Aventura",
    coords: { lat: -18.8872, lng: -41.9161 },
    image: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop",
    description: "Com 1.123 metros de altitude, a Ibituruna é uma das principais plataformas de voo livre do mundo, oferecendo uma vista deslumbrante do Rio Doce e de Governador Valadares.",
    accessibility: {
      wheelchair: true,
      audio: true,
      braille: true,
      libras: false,
      details: [
        "Rampa de acesso ao mirante principal com inclinação regulamentar",
        "Banheiros totalmente adaptados e acessíveis",
        "Piso tátil de alerta nas bordas de segurança",
        "Audiodescrição das paisagens disponível via app/QR Code"
      ]
    },
    history: "A palavra 'Ibituruna' vem do tupi-guarani e significa 'serra negra'. O local serviu como marco geográfico para os antigos bandeirantes e hoje é considerado o patrimônio ambiental mais precioso da região, abrigando diversas espécies de fauna e flora atlântica.",
    address: "Estrada de Acesso ao Pico, Governador Valadares - MG",
    qrCodeValue: "rota-ibituruna"
  },
  {
    id: "estacao",
    name: "Praça da Estação Ferroviária",
    category: "Patrimônio Histórico",
    coords: { lat: -18.8582, lng: -41.9485 },
    image: "https://images.unsplash.com/photo-1541336032412-2048a678540d?q=80&w=800&auto=format&fit=crop",
    description: "Ponto de passagem da famosa Estrada de Ferro Vitória a Minas, a praça abriga a antiga locomotiva Maria Fumaça, símbolo da era de ouro do transporte ferroviário.",
    accessibility: {
      wheelchair: true,
      audio: true,
      braille: true,
      libras: true,
      details: [
        "Entrada plana e sem degraus para toda a área da praça",
        "Placas informativas em Braille instaladas ao lado da locomotiva",
        "Vídeo-guia em Libras acessível via QR Code",
        "Calçadão amplo e liso, facilitando o trânsito de cadeiras de rodas"
      ]
    },
    history: "Inaugurada em 1910, a Estação de Governador Valadares (antiga Figueira) impulsionou o desenvolvimento econômico da cidade. A locomotiva exposta foi desativada nos anos 70 e restaurada pela prefeitura para manter viva a memória cultural dos ferroviários.",
    address: "Rua Leonardo Cristino, Centro, Governador Valadares - MG",
    qrCodeValue: "rota-estacao"
  },
  {
    id: "mercado",
    name: "Mercado Municipal",
    category: "Cultura & Gastronomia",
    coords: { lat: -18.8596, lng: -41.9547 },
    image: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=800&auto=format&fit=crop",
    description: "O coração comercial e gastronômico da cidade, onde se encontram queijos artesanais, doces típicos mineiros, artesanatos regionais e o famoso pastel de feira.",
    accessibility: {
      wheelchair: true,
      audio: false,
      braille: false,
      libras: true,
      details: [
        "Elevador moderno de acesso ao segundo pavimento",
        "Sanitários adaptados unissex na área central",
        "Corredores largos e livres de obstáculos",
        "Balcões de atendimento com altura rebaixada em lojas selecionadas"
      ]
    },
    history: "Fundado em 1948, o Mercado Municipal é um ponto de encontro tradicional dos valadarenses. Ele reflete a fusão de culturas da bacia do Rio Doce, trazendo influências gastronômicas indígenas, africanas e europeias em seus produtos.",
    address: "Rua Israel Pinheiro, 2000, Centro, Governador Valadares - MG",
    qrCodeValue: "rota-mercado"
  },
  {
    id: "catedral",
    name: "Catedral de Santo Antônio",
    category: "Religião & Arquitetura",
    coords: { lat: -18.8561, lng: -41.9489 },
    image: "https://images.unsplash.com/photo-1548625361-155deee223cb?q=80&w=800&auto=format&fit=crop",
    description: "Principal templo católico de Governador Valadares, com uma arquitetura imponente e vitrais artísticos que retratam passagens bíblicas e a história da paróquia.",
    accessibility: {
      wheelchair: true,
      audio: true,
      braille: false,
      libras: true,
      details: [
        "Rampa lateral suave com corrimão duplo",
        "Espaço reservado nas primeiras fileiras para cadeirantes",
        "Guias de áudio detalhando a arquitetura dos vitrais",
        "Intérprete de Libras disponível nas missas solenes de domingo"
      ]
    },
    history: "A capela original de Santo Antônio foi erguida na década de 1910. Com o crescimento da cidade, a igreja foi reconstruída nos moldes atuais, tornando-se Catedral Diocesana em 1956, marcando a forte religiosidade e tradição da comunidade local.",
    address: "Praça Dom Manoel, Centro, Governador Valadares - MG",
    qrCodeValue: "rota-catedral"
  },
  {
    id: "deck",
    name: "Deck do Rio Doce (Ilha dos Araújos)",
    category: "Lazer & Paisagem",
    coords: { lat: -18.8683, lng: -41.9680 },
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop",
    description: "Um espaço de convivência e lazer às margens do Rio Doce na charmosa Ilha dos Araújos. Ideal para caminhadas, pôr do sol e contemplação da natureza urbana.",
    accessibility: {
      wheelchair: true,
      audio: true,
      braille: true,
      libras: false,
      details: [
        "Pistas de caminhada asfaltadas e totalmente lisas",
        "Rampas metálicas antiderrapantes de acesso ao deck de madeira",
        "Mapas táteis em Braille na entrada do calçadão",
        "Bancos de repouso ergonomicamente adaptados e espaçados"
      ]
    },
    history: "O Rio Doce é a alma geográfica de Governador Valadares. O calçadão da Ilha dos Araújos foi revitalizado para integrar os moradores à bacia hidrográfica, servindo como o principal refúgio verde e de bem-estar urbano da cidade.",
    address: "Calçadão da Ilha dos Araújos, Governador Valadares - MG",
    qrCodeValue: "rota-deck"
  }
];
