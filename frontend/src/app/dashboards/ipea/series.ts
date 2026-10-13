import { SentidoBom } from '../../charts/kpi-card/kpi-card';
import { FormatoNumero } from '../../core/formato/formato';
import { PontoIpea, anualizar } from './ipeadata';

export type IdSerieIpea = 'pib' | 'pibPerCapita' | 'salarioMinimo' | 'gini';

export interface SerieIpea {
  readonly id: IdSerieIpea;
  readonly codigo: string;
  readonly nome: string;
  readonly descricao: string;
  readonly mensal: boolean;
  readonly formato: FormatoNumero;
  /** PIB per capita vem em mil dólares. */
  readonly multiplicador: number;
  readonly sentidoBom: SentidoBom;
  readonly formatoVariacao: FormatoNumero | 'pontos';
  readonly incluirZero: boolean;
  readonly fonte: string;
}

export const SERIES_IPEA: readonly SerieIpea[] = [
  {
    id: 'pib',
    codigo: 'SCN10_PIBG10',
    nome: 'Crescimento do PIB',
    descricao: 'Variação real do PIB a cada ano, em %',
    mensal: false,
    formato: 'percentual',
    multiplicador: 1,
    sentidoBom: 'alta',
    formatoVariacao: 'pontos',
    incluirZero: true,
    fonte: 'Ipeadata, série SCN10_PIBG10 (IBGE, Sistema de Contas Nacionais)',
  },
  {
    id: 'pibPerCapita',
    codigo: 'GAC_PIBCAPUSN',
    nome: 'PIB per capita',
    descricao: 'Em dólares correntes',
    mensal: false,
    formato: 'dolar',
    multiplicador: 1000,
    sentidoBom: 'alta',
    formatoVariacao: 'percentual',
    incluirZero: true,
    fonte: 'Ipeadata, série GAC_PIBCAPUSN (Ipea)',
  },
  {
    id: 'salarioMinimo',
    codigo: 'GAC12_SALMINRE12',
    nome: 'Salário mínimo real',
    descricao: 'Em reais do último mês publicado; dezembro de cada ano',
    mensal: true,
    formato: 'moeda',
    multiplicador: 1,
    sentidoBom: 'alta',
    formatoVariacao: 'percentual',
    incluirZero: true,
    fonte: 'Ipeadata, série GAC12_SALMINRE12 (Ipea)',
  },
  {
    id: 'gini',
    codigo: 'PNADS_GINI',
    nome: 'Índice de Gini',
    descricao: 'Desigualdade da renda domiciliar per capita, de 0 a 100',
    mensal: false,
    formato: 'decimal',
    multiplicador: 1,
    sentidoBom: 'baixa',
    formatoVariacao: 'pontos',
    incluirZero: false,
    fonte: 'Ipeadata, série PNADS_GINI (Ipea, a partir da PNAD e da PNAD Contínua)',
  },
];

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function rotuloMesAno(mes: string): string {
  const [ano, numero] = mes.split('-');
  return `${MESES[Number(numero) - 1]}/${ano}`;
}

export interface ResumoIpea {
  readonly valor: number | null;
  readonly variacao: number | null;
  readonly rotuloVariacao: string;
  readonly referencia: string;
  readonly serie: readonly (number | null)[];
  /** Pontos anuais a partir de `desde`, para o gráfico e a tabela. */
  readonly anos: readonly { readonly ano: string; readonly valor: number | null }[];
}

/**
 * Último valor publicado e variação contra o mesmo mês do ano anterior (série mensal) ou contra o
 * ano anterior (série anual). O gráfico usa um ponto por ano a partir de `desde`.
 */
export function resumirIpea(pontos: readonly PontoIpea[] | undefined, serie: SerieIpea, desde: string): ResumoIpea | null {
  const validos = (pontos ?? []).filter((p) => p.valor !== null);
  const ultimo = validos.at(-1);
  if (!ultimo || ultimo.valor === null) {
    return null;
  }
  const escalar = (valor: number | null) => (valor === null ? null : valor * serie.multiplicador);
  const [ano, mes] = ultimo.mes.split('-');
  const mesBase = `${Number(ano) - 1}-${mes}`;
  const base = validos.find((p) => p.mes === mesBase)?.valor ?? null;

  let variacao: number | null = null;
  if (base !== null) {
    variacao =
      serie.formatoVariacao === 'pontos'
        ? Number((ultimo.valor - base).toFixed(2))
        : base !== 0
          ? ((ultimo.valor - base) / base) * 100
          : null;
  }

  const anos = anualizar(pontos ?? [])
    .filter((p) => p.ano >= desde)
    .map((p) => ({ ano: p.ano, valor: escalar(p.valor) }));

  return {
    valor: escalar(ultimo.valor),
    variacao,
    rotuloVariacao: base === null ? '' : serie.mensal ? `vs. ${rotuloMesAno(mesBase)}` : `vs. ${Number(ano) - 1}`,
    referencia: serie.mensal ? rotuloMesAno(ultimo.mes) : ano,
    serie: anos.slice(-15).map((p) => p.valor),
    anos,
  };
}
