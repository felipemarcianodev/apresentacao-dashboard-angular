/**
 * Leitura da API de agregados do IBGE (v3): https://servicodados.ibge.gov.br/api/docs/agregados?versao=3
 * Tudo aqui é função pura: monta a URL, lê a resposta e transforma em séries tipadas.
 */

export const BASE_AGREGADOS = 'https://servicodados.ibge.gov.br/api/v3/agregados';

/** Formato devolvido pela API: uma entrada por variável. */
export interface RespostaVariavel {
  readonly id: string;
  readonly variavel: string;
  readonly unidade: string;
  readonly resultados: readonly {
    readonly series: readonly {
      readonly localidade: { readonly id: string; readonly nome: string; readonly nivel: { readonly id: string } };
      readonly serie: Readonly<Record<string, string | null>>;
    }[];
  }[];
}

export interface PontoPeriodo {
  /** Código do IBGE: 2026 (ano), 202609 (mês) ou 202602 (trimestre). */
  readonly periodo: string;
  readonly valor: number | null;
}

export interface SerieLocalidade {
  readonly id: string;
  readonly nome: string;
  readonly nivel: string;
  readonly pontos: readonly PontoPeriodo[];
}

export interface VariavelLida {
  readonly id: string;
  readonly nome: string;
  readonly unidade: string;
  /** Séries por id de localidade: '1' é o Brasil, '33' é o Rio de Janeiro. */
  readonly localidades: ReadonlyMap<string, SerieLocalidade>;
}

export interface ConsultaAgregado {
  readonly agregado: number;
  readonly variaveis: readonly number[];
  /** Negativo pede os N últimos períodos (-12); também aceita lista explícita. */
  readonly periodos: number | readonly string[];
  readonly localidades: readonly ('N1' | 'N3')[];
}

export function urlAgregado(consulta: ConsultaAgregado): string {
  const periodos = typeof consulta.periodos === 'number' ? String(consulta.periodos) : consulta.periodos.join('|');
  const localidades = consulta.localidades.map((nivel) => `${nivel}[all]`).join('|');
  return `${BASE_AGREGADOS}/${consulta.agregado}/periodos/${periodos}/variaveis/${consulta.variaveis.join('|')}?localidades=${localidades}`;
}

/**
 * O IBGE usa símbolos no lugar do número quando o dado não existe ou é sigiloso
 * ("-", "...", "X", ".."). Tudo que não é número vira null.
 */
export function lerValor(bruto: string | null | undefined): number | null {
  if (bruto === null || bruto === undefined) {
    return null;
  }
  const valor = Number(bruto);
  return bruto.trim() !== '' && Number.isFinite(valor) ? valor : null;
}

/** Transforma a resposta em um mapa variável → localidade → pontos em ordem cronológica. */
export function lerAgregado(resposta: readonly RespostaVariavel[]): ReadonlyMap<string, VariavelLida> {
  return new Map(
    resposta.map((variavel) => {
      const localidades = new Map<string, SerieLocalidade>();
      for (const resultado of variavel.resultados) {
        for (const { localidade, serie } of resultado.series) {
          const pontos = Object.keys(serie)
            .sort()
            .map((periodo) => ({ periodo, valor: lerValor(serie[periodo]) }));
          localidades.set(localidade.id, {
            id: localidade.id,
            nome: localidade.nome,
            nivel: localidade.nivel.id,
            pontos,
          });
        }
      }
      return [
        variavel.id,
        { id: variavel.id, nome: variavel.variavel, unidade: variavel.unidade, localidades },
      ];
    }),
  );
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export type Periodicidade = 'anual' | 'mensal' | 'trimestral';

/** "2026", "set/26" ou "2º tri 26", conforme a periodicidade da tabela. */
export function rotuloPeriodo(periodo: string, periodicidade: Periodicidade): string {
  if (periodicidade === 'anual' || periodo.length !== 6) {
    return periodo;
  }
  const ano = periodo.slice(2, 4);
  const parte = Number(periodo.slice(4));
  return periodicidade === 'mensal' ? `${MESES[parte - 1]}/${ano}` : `${parte}º tri ${ano}`;
}

/** Último ponto com valor, ou null. */
export function ultimoValido(pontos: readonly PontoPeriodo[]): PontoPeriodo | null {
  for (let i = pontos.length - 1; i >= 0; i--) {
    if (pontos[i].valor !== null) {
      return pontos[i];
    }
  }
  return null;
}
