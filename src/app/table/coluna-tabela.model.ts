import { FormatoNumero } from '../core/formato/formato';

export type ValorCelula = string | number | null;

/** Definição de uma coluna da DataTable. */
export interface ColunaTabela<T> {
  readonly id: string;
  readonly titulo: string;
  /** Extrai o valor bruto da linha. Número é ordenado como número e formatado por `formato`. */
  readonly valor: (linha: T) => ValorCelula;
  readonly formato?: FormatoNumero;
  /** Padrão: direita para número, esquerda para texto. */
  readonly alinhamento?: 'esquerda' | 'direita';
  readonly ordenavel?: boolean;
}

export type DirecaoOrdenacao = 'asc' | 'desc';

export interface Ordenacao {
  readonly coluna: string;
  readonly direcao: DirecaoOrdenacao;
}
