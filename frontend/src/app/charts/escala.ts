/** Funções puras de escala usadas pelos gráficos. Sem DOM, para serem testadas isoladamente. */

export type Escala = (valor: number) => number;

/** Mapeia linearmente um domínio [d0, d1] para uma faixa [r0, r1]. Domínio degenerado vai para o meio. */
export function escalaLinear(
  [d0, d1]: readonly [number, number],
  [r0, r1]: readonly [number, number],
): Escala {
  if (d0 === d1) {
    return () => (r0 + r1) / 2;
  }
  const fator = (r1 - r0) / (d1 - d0);
  return (valor) => r0 + (valor - d0) * fator;
}

/** Passo "redondo" (1, 2, 2,5 ou 5 vezes uma potência de 10) para cerca de `quantidade` intervalos. */
export function passoAgradavel(intervalo: number, quantidade: number): number {
  if (intervalo <= 0 || !Number.isFinite(intervalo)) {
    return 1;
  }
  const bruto = intervalo / Math.max(quantidade, 1);
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const fracao = bruto / potencia;
  const multiplo = fracao <= 1 ? 1 : fracao <= 2 ? 2 : fracao <= 2.5 ? 2.5 : fracao <= 5 ? 5 : 10;
  return multiplo * potencia;
}

/**
 * Domínio arredondado para fora e as marcas do eixo, com cerca de `quantidade` intervalos.
 * Com `incluirZero`, o domínio sempre contém o zero (barras e contagens).
 */
export function eixoAgradavel(
  valores: readonly number[],
  quantidade = 4,
  incluirZero = false,
): { dominio: [number, number]; marcas: number[] } {
  const finitos = valores.filter(Number.isFinite);
  let min = finitos.length ? Math.min(...finitos) : 0;
  let max = finitos.length ? Math.max(...finitos) : 1;
  if (incluirZero) {
    min = Math.min(min, 0);
    max = Math.max(max, 0);
  }
  if (min === max) {
    const folga = Math.abs(min) || 1;
    min -= folga / 2;
    max += folga / 2;
  }
  const passo = passoAgradavel(max - min, quantidade);
  const inicio = Math.floor(min / passo) * passo;
  const fim = Math.ceil(max / passo) * passo;
  const marcas: number[] = [];
  for (let v = inicio; v <= fim + passo / 2; v += passo) {
    // Corrige a imprecisão do ponto flutuante (0.30000000000000004).
    marcas.push(Number(v.toFixed(10)));
  }
  return { dominio: [inicio, fim], marcas };
}

/** Índices igualmente espaçados para rótulos do eixo X, sempre incluindo o primeiro e o último. */
export function indicesDeRotulo(total: number, maximo: number): number[] {
  if (total <= 0) {
    return [];
  }
  if (total <= maximo) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const passo = (total - 1) / (maximo - 1);
  return Array.from({ length: maximo }, (_, i) => Math.round(i * passo));
}
