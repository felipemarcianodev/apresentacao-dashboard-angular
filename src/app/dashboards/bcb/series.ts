import { SentidoBom } from '../../charts/kpi-card/kpi-card';
import { FormatoNumero } from '../../core/formato/formato';
import { PontoDiario, mensalizar, rotuloDia, rotuloMes } from './sgs';

export type IdSerieBcb = 'selic' | 'dolar' | 'euro' | 'credito' | 'inadimplencia' | 'ibcbr';

export interface SerieBcb {
  readonly id: IdSerieBcb;
  readonly codigo: number;
  readonly nome: string;
  readonly periodicidade: 'diaria' | 'mensal';
  readonly formato: FormatoNumero;
  /** O saldo de crédito vem em milhões de reais. */
  readonly multiplicador: number;
  readonly sentidoBom: SentidoBom;
  readonly formatoVariacao: FormatoNumero | 'pontos';
  readonly fonte: string;
}

export const SERIES_BCB: readonly SerieBcb[] = [
  {
    id: 'selic',
    codigo: 432,
    nome: 'Meta Selic',
    periodicidade: 'diaria',
    formato: 'percentual',
    multiplicador: 1,
    sentidoBom: 'neutro',
    formatoVariacao: 'pontos',
    fonte: 'Banco Central, SGS série 432 (meta definida pelo Copom, % a.a.)',
  },
  {
    id: 'dolar',
    codigo: 1,
    nome: 'Dólar (PTAX venda)',
    periodicidade: 'diaria',
    formato: 'moeda',
    multiplicador: 1,
    sentidoBom: 'neutro',
    formatoVariacao: 'percentual',
    fonte: 'Banco Central, SGS série 1',
  },
  {
    id: 'euro',
    codigo: 21619,
    nome: 'Euro (PTAX venda)',
    periodicidade: 'diaria',
    formato: 'moeda',
    multiplicador: 1,
    sentidoBom: 'neutro',
    formatoVariacao: 'percentual',
    fonte: 'Banco Central, SGS série 21619',
  },
  {
    id: 'credito',
    codigo: 20539,
    nome: 'Saldo de crédito',
    periodicidade: 'mensal',
    formato: 'moeda-compacta',
    multiplicador: 1_000_000,
    sentidoBom: 'neutro',
    formatoVariacao: 'percentual',
    fonte: 'Banco Central, SGS série 20539 (carteira total do Sistema Financeiro Nacional)',
  },
  {
    id: 'inadimplencia',
    codigo: 21082,
    nome: 'Inadimplência do crédito',
    periodicidade: 'mensal',
    formato: 'percentual',
    multiplicador: 1,
    sentidoBom: 'baixa',
    formatoVariacao: 'pontos',
    fonte: 'Banco Central, SGS série 21082 (carteira total, atraso acima de 90 dias)',
  },
  {
    id: 'ibcbr',
    codigo: 24364,
    nome: 'IBC-Br',
    periodicidade: 'mensal',
    formato: 'decimal',
    multiplicador: 1,
    sentidoBom: 'alta',
    formatoVariacao: 'percentual',
    fonte: 'Banco Central, SGS série 24364 (índice de atividade econômica, com ajuste sazonal)',
  },
];

export const SERIE_BCB = Object.fromEntries(SERIES_BCB.map((s) => [s.id, s])) as Record<IdSerieBcb, SerieBcb>;

export interface ResumoSerie {
  readonly valor: number | null;
  readonly variacao: number | null;
  readonly rotuloVariacao: string;
  readonly referencia: string;
  readonly serie: readonly (number | null)[];
  readonly pontos: readonly { readonly rotulo: string; readonly mes: string; readonly valor: number | null }[];
}

/**
 * Último valor (do dia, na série diária), variação contra o mesmo mês do ano anterior e a série
 * mensal para os gráficos.
 */
export function resumirSerie(pontos: readonly PontoDiario[] | undefined, serie: SerieBcb): ResumoSerie | null {
  const validos = (pontos ?? []).filter((p) => p.valor !== null);
  const ultimo = validos.at(-1);
  if (!ultimo || ultimo.valor === null) {
    return null;
  }
  const escalar = (valor: number | null) => (valor === null ? null : valor * serie.multiplicador);
  const mensal = mensalizar(pontos ?? []);
  const mesAtual = ultimo.data.slice(0, 7);
  const [ano, mes] = mesAtual.split('-');
  const mesBase = `${Number(ano) - 1}-${mes}`;
  const base = mensal.find((p) => p.mes === mesBase)?.valor ?? null;

  let variacao: number | null = null;
  if (base !== null) {
    variacao =
      serie.formatoVariacao === 'pontos'
        ? Number((ultimo.valor - base).toFixed(2))
        : base !== 0
          ? ((ultimo.valor - base) / base) * 100
          : null;
  }

  return {
    valor: escalar(ultimo.valor),
    variacao,
    rotuloVariacao: base !== null ? `vs. ${rotuloMes(mesBase)}` : '',
    referencia: serie.periodicidade === 'diaria' ? rotuloDia(ultimo.data) : rotuloMes(mesAtual),
    serie: mensal.slice(-13).map((p) => escalar(p.valor)),
    pontos: mensal.map((p) => ({ rotulo: rotuloMes(p.mes), mes: p.mes, valor: escalar(p.valor) })),
  };
}
