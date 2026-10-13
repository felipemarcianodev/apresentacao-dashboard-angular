import { Type } from '@angular/core';

export type CategoriaDoc = 'Primitivos' | 'Gráficos' | 'Dados';

/** Uma propriedade pública do componente: input, model ou output. */
export interface PropriedadeDoc {
  readonly nome: string;
  readonly tipo: string;
  readonly descricao: string;
  readonly padrao?: string;
  readonly obrigatoria?: boolean;
}

/** Um exemplo vivo: o componente renderizado na galeria e o trecho de código que o gera. */
export interface ExemploDoc {
  readonly titulo: string;
  readonly descricao?: string;
  readonly componente: Type<unknown>;
  readonly codigo: string;
}

/**
 * Documentação de um componente do kit. Cada componente tem o seu arquivo `*.doc.ts` ao lado,
 * e a galeria `/ui` monta a página a partir dele.
 */
export interface ComponentDoc {
  readonly slug: string;
  readonly nome: string;
  readonly seletor: string;
  readonly categoria: CategoriaDoc;
  readonly resumo: string;
  readonly descricao: readonly string[];
  readonly importacao: string;
  readonly entradas: readonly PropriedadeDoc[];
  readonly saidas: readonly PropriedadeDoc[];
  readonly conteudo?: readonly PropriedadeDoc[];
  readonly exemplos: readonly ExemploDoc[];
  readonly acessibilidade: readonly string[];
}
