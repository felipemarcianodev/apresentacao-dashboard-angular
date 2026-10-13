import { RespostaVariavel, lerAgregado, lerValor, rotuloPeriodo, ultimoValido, urlAgregado } from './agregados';

const RESPOSTA: RespostaVariavel[] = [
  {
    id: '4099',
    variavel: 'Taxa de desocupação',
    unidade: '%',
    resultados: [
      {
        series: [
          { localidade: { id: '1', nome: 'Brasil', nivel: { id: 'N1' } }, serie: { '202602': '5.4', '202601': '6.1' } },
          { localidade: { id: '33', nome: 'Rio de Janeiro', nivel: { id: 'N3' } }, serie: { '202601': '...', '202602': '7.9' } },
        ],
      },
    ],
  },
];

describe('agregados do IBGE', () => {
  it('monta a URL com períodos, variáveis e níveis', () => {
    expect(urlAgregado({ agregado: 4099, variaveis: [4099], periodos: -12, localidades: ['N1', 'N3'] })).toBe(
      'https://servicodados.ibge.gov.br/api/v3/agregados/4099/periodos/-12/variaveis/4099?localidades=N1[all]|N3[all]',
    );
    expect(urlAgregado({ agregado: 1737, variaveis: [2265, 63], periodos: ['202608', '202609'], localidades: ['N1'] })).toContain(
      '/1737/periodos/202608|202609/variaveis/2265|63?localidades=N1[all]',
    );
  });

  it('trata os símbolos do IBGE como dado ausente', () => {
    expect(lerValor('5.4')).toBe(5.4);
    expect(lerValor('-0.32')).toBe(-0.32);
    for (const simbolo of ['-', '...', '..', 'X', '', null, undefined]) {
      expect(lerValor(simbolo)).withContext(String(simbolo)).toBeNull();
    }
  });

  it('lê as séries por localidade em ordem cronológica', () => {
    const variavel = lerAgregado(RESPOSTA).get('4099')!;
    expect(variavel.unidade).toBe('%');
    expect(variavel.localidades.get('1')!.pontos).toEqual([
      { periodo: '202601', valor: 6.1 },
      { periodo: '202602', valor: 5.4 },
    ]);
    expect(variavel.localidades.get('33')!.pontos[0].valor).toBeNull();
  });

  it('escreve o período como as pessoas leem', () => {
    expect(rotuloPeriodo('2026', 'anual')).toBe('2026');
    expect(rotuloPeriodo('202609', 'mensal')).toBe('set/26');
    expect(rotuloPeriodo('202602', 'trimestral')).toBe('2º tri 26');
  });

  it('acha o último ponto com valor', () => {
    expect(ultimoValido([{ periodo: 'a', valor: 1 }, { periodo: 'b', valor: null }])).toEqual({ periodo: 'a', valor: 1 });
    expect(ultimoValido([{ periodo: 'a', valor: null }])).toBeNull();
  });
});
