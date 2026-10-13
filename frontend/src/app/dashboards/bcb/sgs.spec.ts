import { dataIso, inicioDoPeriodo, lerSerie, mensalizar, rotuloDia, rotuloMes, urlSerie } from './sgs';

const HOJE = new Date(2026, 9, 12);

describe('SGS do Banco Central', () => {
  it('monta a URL com janela de datas no formato da API', () => {
    expect(urlSerie(432, new Date(2025, 9, 1), HOJE)).toBe(
      '/api/bcb/serie/bcdata.sgs.432/dados?formato=json&dataInicial=01/10/2025&dataFinal=12/10/2026',
    );
  });

  it('começa o período no primeiro dia do mês', () => {
    expect(dataIso(inicioDoPeriodo(HOJE, 5))).toBe('2021-10-01');
  });

  it('ordena, converte e descarta datas futuras e valores inválidos', () => {
    const pontos = lerSerie(
      [
        { data: '04/11/2026', valor: '13.75' },
        { data: '09/10/2026', valor: '4.9892' },
        { data: '08/10/2026', valor: '' },
      ],
      HOJE,
    );
    expect(pontos).toEqual([
      { data: '2026-10-08', valor: null },
      { data: '2026-10-09', valor: 4.9892 },
    ]);
  });

  it('descarta resposta malformada sem lançar exceção', () => {
    expect(lerSerie(null, HOJE)).toEqual([]);
    expect(lerSerie({ erro: 'x' }, HOJE)).toEqual([]);
    expect(lerSerie([{}, null, { data: 'x', valor: '1' }, { data: '99/99/9999', valor: '1' }, { data: '01/10/2026', valor: 2 }], HOJE)).toEqual([]);
  });

  it('fecha cada mês com o último valor válido', () => {
    expect(
      mensalizar([
        { data: '2026-09-01', valor: 14 },
        { data: '2026-09-30', valor: 14.25 },
        { data: '2026-10-01', valor: 14.25 },
        { data: '2026-10-02', valor: null },
      ]),
    ).toEqual([
      { mes: '2026-09', valor: 14.25 },
      { mes: '2026-10', valor: 14.25 },
    ]);
  });

  it('escreve mês e dia como as pessoas leem', () => {
    expect(rotuloMes('2026-09')).toBe('set/26');
    expect(rotuloDia('2026-10-09')).toBe('09/10/2026');
  });
});
