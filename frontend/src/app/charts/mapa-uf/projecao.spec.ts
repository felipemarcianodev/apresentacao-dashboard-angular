import { MalhaUf, classeDoValor, limitesPorQuantil, projetarMalha } from './projecao';

const MALHA: MalhaUf = {
  type: 'FeatureCollection',
  features: [
    {
      properties: { codarea: '11' },
      geometry: { type: 'Polygon', coordinates: [[[-60, -10], [-50, -10], [-50, -20], [-60, -10]]] },
    },
    {
      properties: { codarea: '12' },
      geometry: {
        type: 'MultiPolygon',
        coordinates: [[[[-70, -5], [-65, -5], [-65, -8], [-70, -5]]], [[[-40, -30], [-39, -30], [-39, -31], [-40, -30]]]],
      },
    },
  ],
};

describe('projetarMalha', () => {
  it('ajusta a malha à largura pedida e mantém a proporção', () => {
    const mapa = projetarMalha(MALHA, 600);
    expect(mapa.largura).toBe(600);
    expect(mapa.altura).toBeGreaterThan(0);
    expect(mapa.altura).toBeLessThan(600);
  });

  it('gera um caminho por UF, com um subcaminho por anel', () => {
    const mapa = projetarMalha(MALHA, 600);
    expect(mapa.ufs.map((uf) => uf.codigo)).toEqual(['11', '12']);
    expect(mapa.ufs[1].caminho.match(/M/g)?.length).toBe(2);
  });

  it('põe o extremo oeste e o extremo norte na origem', () => {
    const mapa = projetarMalha(MALHA, 600);
    expect(mapa.ufs[1].caminho.startsWith('M0.0,0.0')).toBe(true);
  });
});

describe('limitesPorQuantil e classeDoValor', () => {
  it('divide os valores em classes de tamanho parecido', () => {
    const limites = limitesPorQuantil([1, 2, 3, 4, 5, 6, 7, 8, 9], 3);
    expect(limites).toEqual([3.6666666666666665, 6.333333333333333]);
    expect(classeDoValor(1, limites)).toBe(0);
    expect(classeDoValor(5, limites)).toBe(1);
    expect(classeDoValor(9, limites)).toBe(2);
  });

  it('ignora valores não finitos', () => {
    expect(limitesPorQuantil([Number.NaN, 2, 4], 2)).toEqual([3]);
  });
});
