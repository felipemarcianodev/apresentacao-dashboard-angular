import { RespostaVariavel, lerAgregado } from './agregados';
import { INDICADORES_UF, resumir, valoresPorUf } from './indicadores';

const DESOCUPACAO = INDICADORES_UF.find((i) => i.id === 'desocupacao')!;
const PIB = INDICADORES_UF.find((i) => i.id === 'pib')!;

function variavel(series: Record<string, Record<string, string>>): RespostaVariavel[] {
  return [
    {
      id: 'v',
      variavel: 'Teste',
      unidade: '%',
      resultados: [
        {
          series: Object.entries(series).map(([id, serie]) => ({
            localidade: { id, nome: id, nivel: { id: id === '1' ? 'N1' : 'N3' } },
            serie,
          })),
        },
      ],
    },
  ];
}

describe('indicadores do IBGE', () => {
  it('compara a desocupação com o mesmo trimestre do ano anterior, em pontos', () => {
    const lida = lerAgregado(
      variavel({
        '1': { '202501': '7.0', '202502': '5.8', '202503': '5.6', '202504': '5.1', '202601': '6.1', '202602': '5.4' },
      }),
    ).get('v');
    const resumo = resumir(lida, '1', DESOCUPACAO)!;
    expect(resumo.valor).toBe(5.4);
    expect(resumo.variacao).toBe(-0.4);
    expect(resumo.rotuloVariacao).toBe('vs. 2º tri 25');
    expect(resumo.referencia).toBe('2º tri 26');
    expect(resumo.serie.length).toBe(6);
  });

  it('converte o PIB de mil reais para reais e calcula o crescimento relativo', () => {
    const lida = lerAgregado(variavel({ '1': { '2022': '1000', '2023': '1100' } })).get('v');
    const resumo = resumir(lida, '1', PIB)!;
    expect(resumo.valor).toBe(1_100_000);
    expect(resumo.variacao).toBeCloseTo(10, 5);
  });

  it('usa o último período com dado e não inventa variação sem base', () => {
    const lida = lerAgregado(variavel({ '1': { '2025': '10', '2026': '...' } })).get('v');
    const resumo = resumir(lida, '1', PIB)!;
    expect(resumo.referencia).toBe('2025');
    expect(resumo.variacao).toBeNull();
  });

  it('devolve null para localidade sem série', () => {
    const lida = lerAgregado(variavel({ '1': { '2025': '10' } })).get('v');
    expect(resumir(lida, '33', PIB)).toBeNull();
    expect(resumir(undefined, '1', PIB)).toBeNull();
  });

  it('lista as 27 UFs no período mais recente do Brasil', () => {
    const lida = lerAgregado(
      variavel({ '1': { '2022': '1', '2023': '2' }, '33': { '2022': '5', '2023': '7' }, '35': { '2022': '9' } }),
    ).get('v');
    const valores = valoresPorUf(lida, 1000);
    expect(valores.length).toBe(27);
    expect(valores.find((v) => v.sigla === 'RJ')!.valor).toBe(7000);
    expect(valores.find((v) => v.sigla === 'SP')!.valor).toBeNull();
  });
});
