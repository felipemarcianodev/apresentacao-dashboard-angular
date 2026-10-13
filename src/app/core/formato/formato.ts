export type FormatoNumero = 'numero' | 'decimal' | 'percentual' | 'moeda' | 'moeda-compacta' | 'compacto';

const FORMATADORES: Record<FormatoNumero, Intl.NumberFormat> = {
  numero: new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }),
  decimal: new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 }),
  percentual: new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }),
  moeda: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
  'moeda-compacta': new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    notation: 'compact',
    maximumFractionDigits: 2,
  }),
  compacto: new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }),
};

export const SEM_DADO = 'sem dado';

/**
 * Formata um número no padrão brasileiro.
 * Percentual recebe o valor já em pontos percentuais, como as APIs do IBGE e do BCB devolvem
 * (4.62 vira "4,62%").
 */
export function formatar(valor: number | null | undefined, formato: FormatoNumero = 'numero'): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) {
    return SEM_DADO;
  }
  const normalizado = formato === 'percentual' ? valor / 100 : valor;
  // Intl usa espaço não separável; trocamos por espaço comum para o texto copiar bem.
  return FORMATADORES[formato].format(normalizado).replace(/ /g, ' ');
}

/** Variação com sinal explícito, em pontos percentuais ou no formato pedido: "+0,4 p.p.", "−1,2%". */
export function formatarVariacao(valor: number, formato: FormatoNumero | 'pontos' = 'percentual'): string {
  const sinal = valor > 0 ? '+' : valor < 0 ? '−' : '';
  const absoluto = Math.abs(valor);
  const texto =
    formato === 'pontos'
      ? `${FORMATADORES.decimal.format(absoluto)} p.p.`
      : formatar(absoluto, formato);
  return `${sinal}${texto}`;
}
