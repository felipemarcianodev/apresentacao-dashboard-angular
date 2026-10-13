import { SEM_DADO, formatar, formatarVariacao } from './formato';

describe('formatar', () => {
  it('usa o padrão brasileiro de milhar e decimal', () => {
    expect(formatar(213421037)).toBe('213.421.037');
    expect(formatar(4.6234, 'decimal')).toBe('4,62');
  });

  it('trata percentual como pontos percentuais', () => {
    expect(formatar(4.62, 'percentual')).toBe('4,62%');
    expect(formatar(10, 'percentual')).toBe('10,0%');
  });

  it('formata moeda em real com espaço comum', () => {
    expect(formatar(1234.5, 'moeda')).toBe('R$ 1.234,50');
  });

  it('abrevia números grandes', () => {
    expect(formatar(213421037, 'compacto')).toBe('213,4 mi');
  });

  it('formata dólar sem centavos', () => {
    expect(formatar(10638.47, 'dolar')).toBe('US$ 10.638');
  });

  it('abrevia valores em real', () => {
    expect(formatar(10943345439000, 'moeda-compacta')).toBe('R$ 10,94 tri');
  });

  it('devolve "sem dado" para nulo, indefinido e NaN', () => {
    expect(formatar(null)).toBe(SEM_DADO);
    expect(formatar(undefined)).toBe(SEM_DADO);
    expect(formatar(Number.NaN)).toBe(SEM_DADO);
  });
});

describe('formatarVariacao', () => {
  it('mostra o sinal explícito', () => {
    expect(formatarVariacao(0.4)).toBe('+0,4%');
    expect(formatarVariacao(-1.2)).toBe('−1,2%');
    expect(formatarVariacao(0)).toBe('0,0%');
  });

  it('formata em pontos percentuais', () => {
    expect(formatarVariacao(-0.3, 'pontos')).toBe('−0,3 p.p.');
  });
});
