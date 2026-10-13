export interface ItemNavegacao {
  readonly rota: string;
  readonly rotulo: string;
  readonly icone: string;
}

export interface GrupoNavegacao {
  readonly titulo: string;
  readonly itens: readonly ItemNavegacao[];
}

export const NAVEGACAO: readonly GrupoNavegacao[] = [
  {
    titulo: 'Painéis',
    itens: [
      { rota: '/ibge', rotulo: 'IBGE', icone: 'fa-map-location-dot' },
      { rota: '/bcb', rotulo: 'Banco Central', icone: 'fa-building-columns' },
      { rota: '/ipea', rotulo: 'Ipeadata', icone: 'fa-chart-line' },
    ],
  },
  {
    titulo: 'Kit',
    itens: [{ rota: '/ui', rotulo: 'Componentes', icone: 'fa-shapes' }],
  },
];
