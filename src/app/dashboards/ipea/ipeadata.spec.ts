import { anualizar, lerValores, urlValores } from './ipeadata';
import { SERIES_IPEA, resumirIpea } from './series';

const SALARIO = SERIES_IPEA.find((s) => s.id === 'salarioMinimo')!;
const PIB_PER_CAPITA = SERIES_IPEA.find((s) => s.id === 'pibPerCapita')!;
const GINI = SERIES_IPEA.find((s) => s.id === 'gini')!;

describe('Ipeadata', () => {
  it('monta a URL da série e recusa código fora do padrão', () => {
    expect(urlValores('PNADS_GINI')).toBe(
      "https://www.ipeadata.gov.br/api/odata4/ValoresSerie(SERCODIGO='PNADS_GINI')?$select=VALDATA,VALVALOR",
    );
    expect(() => urlValores("X')/Metadados?$top=1&a=('")).toThrow();
  });

  it('lê a resposta OData, ordena e descarta o que não tem a forma esperada', () => {
    const pontos = lerValores({
      value: [
        { VALDATA: '2025-01-01T00:00:00-03:00', VALVALOR: 51.1 },
        { VALDATA: '1995-01-01T00:00:00-02:00', VALVALOR: 61.5 },
        { VALDATA: 'ontem', VALVALOR: 1 },
        { VALDATA: '2000-01-01T00:00:00-02:00', VALVALOR: '9' },
        null,
        { VALDATA: '2001-01-01T00:00:00-02:00', VALVALOR: null },
      ],
    });
    expect(pontos).toEqual([
      { mes: '1995-01', valor: 61.5 },
      { mes: '2001-01', valor: null },
      { mes: '2025-01', valor: 51.1 },
    ]);
    expect(lerValores(null)).toEqual([]);
    expect(lerValores({ error: 'x' })).toEqual([]);
  });

  it('anualiza com o último valor do ano', () => {
    expect(
      anualizar([
        { mes: '2025-11', valor: 1500 },
        { mes: '2025-12', valor: 1518 },
        { mes: '2026-09', valor: 1621 },
      ]),
    ).toEqual([
      { ano: '2025', valor: 1518 },
      { ano: '2026', valor: 1621 },
    ]);
  });

  it('compara a série mensal com o mesmo mês do ano anterior', () => {
    const resumo = resumirIpea(
      [
        { mes: '2025-09', valor: 1500 },
        { mes: '2025-12', valor: 1518 },
        { mes: '2026-09', valor: 1621 },
      ],
      SALARIO,
      '2000',
    )!;
    expect(resumo.valor).toBe(1621);
    expect(resumo.variacao).toBeCloseTo(8.0667, 3);
    expect(resumo.rotuloVariacao).toBe('vs. set/2025');
    expect(resumo.referencia).toBe('set/2026');
    expect(resumo.anos.map((a) => a.ano)).toEqual(['2025', '2026']);
  });

  it('converte o PIB per capita de mil dólares e corta pelo período', () => {
    const resumo = resumirIpea(
      [
        { mes: '1990-01', valor: 3 },
        { mes: '2023-01', valor: 10 },
        { mes: '2024-01', valor: 10.638467 },
      ],
      PIB_PER_CAPITA,
      '2000',
    )!;
    expect(resumo.valor).toBeCloseTo(10638.467, 3);
    expect(resumo.referencia).toBe('2024');
    expect(resumo.rotuloVariacao).toBe('vs. 2023');
    expect(resumo.anos.length).toBe(2);
  });

  it('mede a variação do Gini em pontos', () => {
    const resumo = resumirIpea(
      [
        { mes: '2024-01', valor: 51.6 },
        { mes: '2025-01', valor: 51.12722 },
      ],
      GINI,
      '1995',
    )!;
    expect(resumo.variacao).toBe(-0.47);
  });
});
