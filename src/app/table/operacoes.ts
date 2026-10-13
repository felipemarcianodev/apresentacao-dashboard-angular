import { formatar } from '../core/formato/formato';
import { ColunaTabela, Ordenacao, ValorCelula } from './coluna-tabela.model';

/** Funções puras da tabela: texto exibido, busca, ordenação e CSV. */

export function textoDaCelula<T>(coluna: ColunaTabela<T>, linha: T): string {
  const valor = coluna.valor(linha);
  if (typeof valor === 'number') {
    return formatar(valor, coluna.formato ?? 'numero');
  }
  return valor ?? '';
}

/** Minúsculas e sem acento: "São Paulo" casa com "sao paulo". */
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
}

export function filtrarLinhas<T>(
  linhas: readonly T[],
  colunas: readonly ColunaTabela<T>[],
  busca: string,
): readonly T[] {
  const termo = normalizar(busca);
  if (!termo) {
    return linhas;
  }
  return linhas.filter((linha) =>
    colunas.some((coluna) => normalizar(textoDaCelula(coluna, linha)).includes(termo)),
  );
}

const COLADOR = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });

function comparar(a: ValorCelula, b: ValorCelula): number {
  if (a === null || a === '') {
    return b === null || b === '' ? 0 : 1;
  }
  if (b === null || b === '') {
    return -1;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  return COLADOR.compare(String(a), String(b));
}

/** Ordena sem alterar a lista original. Vazios ficam sempre no fim, em qualquer direção. */
export function ordenarLinhas<T>(
  linhas: readonly T[],
  colunas: readonly ColunaTabela<T>[],
  ordenacao: Ordenacao | null,
): readonly T[] {
  const coluna = ordenacao && colunas.find((c) => c.id === ordenacao.coluna);
  if (!ordenacao || !coluna) {
    return linhas;
  }
  const sinal = ordenacao.direcao === 'asc' ? 1 : -1;
  return [...linhas].sort((x, y) => {
    const a = coluna.valor(x);
    const b = coluna.valor(y);
    const vazioA = a === null || a === '';
    const vazioB = b === null || b === '';
    if (vazioA || vazioB) {
      return comparar(a, b);
    }
    return comparar(a, b) * sinal;
  });
}

/**
 * CSV no formato que o Excel em português abre direto: separador ponto e vírgula, números com
 * vírgula decimal, aspas quando preciso e BOM para os acentos.
 */
export function gerarCsv<T>(colunas: readonly ColunaTabela<T>[], linhas: readonly T[]): string {
  const escapar = (texto: string) => (/[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto);
  const celula = (valor: ValorCelula) =>
    typeof valor === 'number' ? String(valor).replace('.', ',') : escapar(valor ?? '');
  const cabecalho = colunas.map((c) => escapar(c.titulo)).join(';');
  const corpo = linhas.map((linha) => colunas.map((c) => celula(c.valor(linha))).join(';'));
  return '﻿' + [cabecalho, ...corpo].join('\r\n');
}
