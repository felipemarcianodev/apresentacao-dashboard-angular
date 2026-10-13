/**
 * Leitura da API OData v4 do Ipeadata: http://www.ipeadata.gov.br/api/
 * A rota ValoresSerie devolve a série inteira (o filtro por data é ignorado pelo servidor), então
 * o recorte de período é feito no navegador. Os metadados trazem HTML no comentário da série: o
 * painel não usa esse campo.
 */

export const BASE_IPEADATA = 'https://www.ipeadata.gov.br/api/odata4';

export interface ValorIpea {
  readonly VALDATA: string;
  readonly VALVALOR: number | null;
}

export interface PontoIpea {
  /** aaaa-mm */
  readonly mes: string;
  readonly valor: number | null;
}

export interface PontoAnual {
  readonly ano: string;
  readonly valor: number | null;
}

/** Só letras, números e sublinhado: o código vai dentro de uma expressão OData entre aspas. */
const CODIGO_VALIDO = /^[A-Z0-9_]+$/;

export function urlValores(codigo: string): string {
  if (!CODIGO_VALIDO.test(codigo)) {
    throw new Error(`Código de série inválido: ${codigo}`);
  }
  return `${BASE_IPEADATA}/ValoresSerie(SERCODIGO='${codigo}')?$select=VALDATA,VALVALOR`;
}

const DATA_VALIDA = /^(\d{4})-(0[1-9]|1[0-2])-\d{2}T/;

/** Converte { value: [...] } em pontos mensais ordenados; o que não tiver forma esperada é descartado. */
export function lerValores(resposta: unknown): PontoIpea[] {
  const valores = (resposta as { value?: unknown } | null)?.value;
  if (!Array.isArray(valores)) {
    return [];
  }
  return valores
    .filter(
      (item): item is ValorIpea =>
        typeof item?.VALDATA === 'string' &&
        DATA_VALIDA.test(item.VALDATA) &&
        (item.VALVALOR === null || typeof item.VALVALOR === 'number'),
    )
    .map((item) => ({
      mes: item.VALDATA.slice(0, 7),
      valor: item.VALVALOR !== null && Number.isFinite(item.VALVALOR) ? item.VALVALOR : null,
    }))
    .sort((a, b) => a.mes.localeCompare(b.mes));
}

/**
 * Um ponto por ano, com o último valor válido do ano: dezembro nas séries mensais e, no ano
 * corrente, o mês mais recente publicado.
 */
export function anualizar(pontos: readonly PontoIpea[]): PontoAnual[] {
  const porAno = new Map<string, number | null>();
  for (const ponto of pontos) {
    const ano = ponto.mes.slice(0, 4);
    if (ponto.valor !== null || !porAno.has(ano)) {
      porAno.set(ano, ponto.valor);
    }
  }
  return [...porAno].map(([ano, valor]) => ({ ano, valor }));
}
