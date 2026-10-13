import { SentidoBom } from '../../charts/kpi-card/kpi-card';
import { ValorUf } from '../../charts/mapa-uf/mapa-uf';
import { UFS } from '../../core/brasil/ufs';
import { FormatoNumero } from '../../core/formato/formato';
import { ConsultaAgregado, Periodicidade, VariavelLida, rotuloPeriodo, ultimoValido } from './agregados';

export type IdIndicadorUf = 'populacao' | 'desocupacao' | 'pib';

/** Indicador do IBGE disponível para o Brasil e para cada UF. */
export interface IndicadorUf {
  readonly id: IdIndicadorUf;
  readonly nome: string;
  readonly consulta: ConsultaAgregado;
  readonly variavel: string;
  readonly periodicidade: Periodicidade;
  readonly formato: FormatoNumero;
  readonly formatoTabela: FormatoNumero;
  /** O PIB vem em mil reais: multiplicamos para exibir em reais. */
  readonly multiplicador: number;
  readonly sentidoBom: SentidoBom;
  readonly formatoVariacao: FormatoNumero | 'pontos';
  /** Quantos períodos atrás comparar: 4 trimestres = mesmo trimestre do ano anterior. */
  readonly comparacao: number;
  readonly fonte: string;
}

export const INDICADORES_UF: readonly IndicadorUf[] = [
  {
    id: 'populacao',
    nome: 'População estimada',
    consulta: { agregado: 6579, variaveis: [9324], periodos: -8, localidades: ['N1', 'N3'] },
    variavel: '9324',
    periodicidade: 'anual',
    formato: 'compacto',
    formatoTabela: 'numero',
    multiplicador: 1,
    sentidoBom: 'neutro',
    formatoVariacao: 'percentual',
    comparacao: 1,
    fonte: 'IBGE, Estimativas de População (SIDRA, tabela 6579)',
  },
  {
    id: 'desocupacao',
    nome: 'Taxa de desocupação',
    consulta: { agregado: 4099, variaveis: [4099], periodos: -12, localidades: ['N1', 'N3'] },
    variavel: '4099',
    periodicidade: 'trimestral',
    formato: 'percentual',
    formatoTabela: 'percentual',
    multiplicador: 1,
    sentidoBom: 'baixa',
    formatoVariacao: 'pontos',
    comparacao: 4,
    fonte: 'IBGE, PNAD Contínua trimestral (SIDRA, tabela 4099)',
  },
  {
    id: 'pib',
    nome: 'PIB a preços correntes',
    consulta: { agregado: 5938, variaveis: [37], periodos: -6, localidades: ['N1', 'N3'] },
    variavel: '37',
    periodicidade: 'anual',
    formato: 'moeda-compacta',
    formatoTabela: 'moeda-compacta',
    multiplicador: 1000,
    sentidoBom: 'alta',
    formatoVariacao: 'percentual',
    comparacao: 1,
    fonte: 'IBGE, PIB dos Municípios (SIDRA, tabela 5938)',
  },
];

/** IPCA: só existe para o Brasil e regiões metropolitanas, não por UF. */
export const IPCA = {
  consulta: { agregado: 1737, variaveis: [2265, 63], periodos: -25, localidades: ['N1'] } as ConsultaAgregado,
  acumulado12Meses: '2265',
  mensal: '63',
  fonte: 'IBGE, IPCA (SIDRA, tabela 1737)',
} as const;

export const ID_BRASIL = '1';

export interface ResumoIndicador {
  readonly valor: number | null;
  readonly variacao: number | null;
  readonly rotuloVariacao: string;
  readonly referencia: string;
  readonly serie: readonly (number | null)[];
  readonly pontos: readonly { readonly rotulo: string; readonly valor: number | null }[];
}

/**
 * Valor mais recente, variação contra `comparacao` períodos antes e a série para os gráficos.
 * Variação em pontos é a diferença; em percentual, o crescimento relativo.
 */
export function resumir(
  variavel: VariavelLida | undefined,
  localidade: string,
  indicador: Pick<IndicadorUf, 'periodicidade' | 'multiplicador' | 'formatoVariacao' | 'comparacao'>,
): ResumoIndicador | null {
  const serie = variavel?.localidades.get(localidade);
  const ultimo = serie && ultimoValido(serie.pontos);
  if (!serie || !ultimo) {
    return null;
  }
  const escalar = (valor: number | null) => (valor === null ? null : valor * indicador.multiplicador);
  const indice = serie.pontos.indexOf(ultimo);
  const base = serie.pontos[indice - indicador.comparacao];
  let variacao: number | null = null;
  if (base && base.valor !== null && ultimo.valor !== null) {
    variacao =
      indicador.formatoVariacao === 'pontos'
        ? Number((ultimo.valor - base.valor).toFixed(2))
        : base.valor !== 0
          ? ((ultimo.valor - base.valor) / base.valor) * 100
          : null;
  }
  return {
    valor: escalar(ultimo.valor),
    variacao,
    rotuloVariacao: base ? `vs. ${rotuloPeriodo(base.periodo, indicador.periodicidade)}` : '',
    referencia: rotuloPeriodo(ultimo.periodo, indicador.periodicidade),
    serie: serie.pontos.map((p) => escalar(p.valor)),
    pontos: serie.pontos.map((p) => ({
      rotulo: rotuloPeriodo(p.periodo, indicador.periodicidade),
      valor: escalar(p.valor),
    })),
  };
}

/** Valor de cada UF no período mais recente do Brasil, para mapa, ranking e tabela. */
export function valoresPorUf(variavel: VariavelLida | undefined, multiplicador = 1): ValorUf[] {
  const brasil = variavel?.localidades.get(ID_BRASIL);
  const periodo = brasil && ultimoValido(brasil.pontos)?.periodo;
  return UFS.map((uf) => {
    const ponto = variavel?.localidades.get(uf.codigo)?.pontos.find((p) => p.periodo === periodo);
    const valor = ponto?.valor ?? null;
    return { sigla: uf.sigla, valor: valor === null ? null : valor * multiplicador };
  });
}
