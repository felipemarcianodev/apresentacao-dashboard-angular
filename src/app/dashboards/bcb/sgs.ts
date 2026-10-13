/**
 * Leitura da API do SGS (Sistema Gerenciador de Séries Temporais) do Banco Central.
 * Regras da API: série diária exige dataInicial e dataFinal com janela de até 10 anos, e a
 * consulta "últimos N" aceita no máximo 20 valores. Por isso o painel sempre pede por data.
 */

export const BASE_SGS = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

/** Formato devolvido pela API: data em dd/mm/aaaa e valor como texto. */
export interface RespostaSgs {
  readonly data: string;
  readonly valor: string;
}

export interface PontoDiario {
  /** aaaa-mm-dd */
  readonly data: string;
  readonly valor: number | null;
}

export interface PontoMensal {
  /** aaaa-mm */
  readonly mes: string;
  readonly valor: number | null;
}

/** dd/mm/aaaa com mês de 01 a 12 e dia de 01 a 31; o resto da resposta é descartado. */
const DATA_VALIDA = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;

function paraBr(data: Date): string {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${data.getFullYear()}`;
}

/** aaaa-mm-dd no fuso local (toISOString usaria UTC e mudaria o dia à noite). */
export function dataIso(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

export function urlSerie(codigo: number, inicio: Date, fim: Date): string {
  return `${BASE_SGS}.${codigo}/dados?formato=json&dataInicial=${paraBr(inicio)}&dataFinal=${paraBr(fim)}`;
}

/** Primeiro dia do mês, `anos` anos antes de `hoje`, para a série mensal ter meses inteiros. */
export function inicioDoPeriodo(hoje: Date, anos: number): Date {
  return new Date(hoje.getFullYear() - anos, hoje.getMonth(), 1);
}

/**
 * Converte a resposta em pontos ordenados e descarta datas depois de `hoje`: a meta Selic,
 * por exemplo, já vem preenchida até a próxima reunião do Copom.
 */
export function lerSerie(resposta: unknown, hoje: Date): PontoDiario[] {
  const limite = dataIso(hoje);
  if (!Array.isArray(resposta)) {
    return [];
  }
  return resposta
    .filter(
      (item): item is RespostaSgs =>
        typeof item?.data === 'string' &&
        typeof item?.valor === 'string' &&
        DATA_VALIDA.test(item.data),
    )
    .map(({ data, valor }) => {
      const [dia, mes, ano] = data.split('/');
      const numero = Number(valor);
      return {
        data: `${ano}-${mes}-${dia}`,
        valor: valor.trim() !== '' && Number.isFinite(numero) ? numero : null,
      };
    })
    .filter((ponto) => ponto.data <= limite)
    .sort((a, b) => a.data.localeCompare(b.data));
}

/** Um ponto por mês, com o último valor válido do mês (fechamento). */
export function mensalizar(pontos: readonly PontoDiario[]): PontoMensal[] {
  const porMes = new Map<string, number | null>();
  for (const ponto of pontos) {
    const mes = ponto.data.slice(0, 7);
    if (ponto.valor !== null || !porMes.has(mes)) {
      porMes.set(mes, ponto.valor);
    }
  }
  return [...porMes].map(([mes, valor]) => ({ mes, valor }));
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "2026-09" vira "set/26". */
export function rotuloMes(mes: string): string {
  const [ano, numero] = mes.split('-');
  return `${MESES[Number(numero) - 1]}/${ano.slice(2)}`;
}

/** "2026-10-09" vira "09/10/2026". */
export function rotuloDia(data: string): string {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}
