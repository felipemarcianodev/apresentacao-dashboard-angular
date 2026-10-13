import { eixoAgradavel, escalaLinear, indicesDeRotulo, passoAgradavel } from './escala';

describe('escalaLinear', () => {
  it('mapeia o domínio na faixa, inclusive invertida (eixo Y do SVG)', () => {
    const y = escalaLinear([0, 100], [200, 0]);
    expect(y(0)).toBe(200);
    expect(y(50)).toBe(100);
    expect(y(100)).toBe(0);
  });

  it('manda domínio degenerado para o meio da faixa', () => {
    expect(escalaLinear([5, 5], [0, 10])(5)).toBe(5);
  });
});

describe('passoAgradavel', () => {
  it('escolhe 1, 2, 2,5, 5 ou 10 vezes uma potência de dez', () => {
    expect(passoAgradavel(100, 4)).toBe(25);
    expect(passoAgradavel(9, 4)).toBe(2.5);
    expect(passoAgradavel(0.8, 4)).toBe(0.2);
    expect(passoAgradavel(7000, 5)).toBe(2000);
  });
});

describe('eixoAgradavel', () => {
  it('arredonda o domínio para fora e gera marcas redondas', () => {
    const { dominio, marcas } = eixoAgradavel([3.2, 11.7], 4);
    expect(dominio).toEqual([2.5, 12.5]);
    expect(marcas).toEqual([2.5, 5, 7.5, 10, 12.5]);
  });

  it('inclui o zero quando pedido', () => {
    expect(eixoAgradavel([40, 90], 4, true).dominio[0]).toBe(0);
  });

  it('abre um intervalo em volta de série constante', () => {
    const { dominio } = eixoAgradavel([10, 10, 10]);
    expect(dominio[0]).toBeLessThan(10);
    expect(dominio[1]).toBeGreaterThan(10);
  });

  it('não sofre com ponto flutuante', () => {
    expect(eixoAgradavel([0.1, 0.7], 3).marcas).toEqual([0, 0.2, 0.4, 0.6, 0.8]);
  });
});

describe('indicesDeRotulo', () => {
  it('devolve todos quando cabem', () => {
    expect(indicesDeRotulo(3, 6)).toEqual([0, 1, 2]);
  });

  it('espalha e mantém primeiro e último', () => {
    expect(indicesDeRotulo(11, 3)).toEqual([0, 5, 10]);
  });
});
