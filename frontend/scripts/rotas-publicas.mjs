// Metadados do cartão de cada rota pública (prévia do link no WhatsApp, LinkedIn e Slack).
// Usado pelo cartoes-por-rota.mjs (depois do build) e pelo gerar-capas.mjs (imagens em public/og/).
// Os títulos repetem os de app.routes.ts.

export const ORIGEM = 'https://mirante.felipemarcianodev.com';

export const ROTAS_PUBLICAS = [
  {
    caminho: '',
    titulo: 'Mirante · painéis de dados abertos do Brasil',
    descricao:
      'Kit de dashboard em Angular e Tailwind CSS com painéis sobre dados abertos do IBGE, do Banco Central e do Ipeadata.',
    capa: { arquivo: 'mirante', icone: 'fa-mountain-sun', chamada: 'Painéis de dados abertos do Brasil' },
  },
  {
    caminho: 'ibge',
    titulo: 'IBGE · Mirante',
    descricao: 'População, PIB, desocupação e IPCA do Brasil e das 27 UFs, com dados abertos do IBGE.',
    capa: { arquivo: 'ibge', icone: 'fa-map-location-dot', chamada: 'IBGE' },
  },
  {
    caminho: 'bcb',
    titulo: 'Banco Central · Mirante',
    descricao: 'Selic, dólar, euro, crédito, inadimplência e IBC-Br pela API SGS do Banco Central, em 1, 2 ou 5 anos.',
    capa: { arquivo: 'bcb', icone: 'fa-building-columns', chamada: 'Banco Central' },
  },
  {
    caminho: 'ipea',
    titulo: 'Ipeadata · Mirante',
    descricao: 'Crescimento do PIB, PIB per capita, salário mínimo real e índice de Gini em séries históricas do Ipeadata.',
    capa: { arquivo: 'ipea', icone: 'fa-chart-line', chamada: 'Ipeadata' },
  },
  {
    caminho: 'ui',
    titulo: 'Componentes · Mirante',
    descricao:
      'Galeria do kit de dashboard: gráficos em SVG, tabela, cartões e estados, com exemplos vivos e código para copiar.',
    capa: { arquivo: 'ui', icone: 'fa-shapes', chamada: 'Componentes' },
  },
  {
    caminho: 'testes',
    titulo: 'Testes · Mirante',
    descricao: 'Os testes de ponta a ponta do Mirante por persona: celular, teclado, leitor de tela, tema escuro e mais.',
    capa: { arquivo: 'testes', icone: 'fa-vial-circle-check', chamada: 'Testes' },
  },
];
