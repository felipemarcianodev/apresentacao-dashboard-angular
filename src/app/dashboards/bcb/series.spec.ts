import { SERIE_BCB, resumirSerie } from './series';

describe('séries do Banco Central', () => {
  it('usa o último dia na referência e compara com o mesmo mês do ano anterior em pontos', () => {
    const resumo = resumirSerie(
      [
        { data: '2025-10-31', valor: 15 },
        { data: '2026-09-30', valor: 14.25 },
        { data: '2026-10-09', valor: 14 },
      ],
      SERIE_BCB.selic,
    )!;
    expect(resumo.valor).toBe(14);
    expect(resumo.variacao).toBe(-1);
    expect(resumo.rotuloVariacao).toBe('vs. out/25');
    expect(resumo.referencia).toBe('09/10/2026');
    expect(resumo.pontos.map((p) => p.rotulo)).toEqual(['out/25', 'set/26', 'out/26']);
  });

  it('converte o crédito de milhões para reais e calcula a variação relativa', () => {
    const resumo = resumirSerie(
      [
        { data: '2025-08-01', valor: 6_000_000 },
        { data: '2026-08-01', valor: 6_600_000 },
      ],
      SERIE_BCB.credito,
    )!;
    expect(resumo.valor).toBe(6.6e12);
    expect(resumo.variacao).toBeCloseTo(10, 5);
    expect(resumo.referencia).toBe('ago/26');
  });

  it('não inventa variação sem o mês base', () => {
    const resumo = resumirSerie([{ data: '2026-08-01', valor: 5 }], SERIE_BCB.inadimplencia)!;
    expect(resumo.variacao).toBeNull();
    expect(resumo.rotuloVariacao).toBe('');
  });

  it('devolve null sem nenhum valor válido', () => {
    expect(resumirSerie([{ data: '2026-08-01', valor: null }], SERIE_BCB.ibcbr)).toBeNull();
    expect(resumirSerie(undefined, SERIE_BCB.ibcbr)).toBeNull();
  });
});
