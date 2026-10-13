export type RegiaoBrasil = 'Norte' | 'Nordeste' | 'Sudeste' | 'Sul' | 'Centro-Oeste';

export interface Uf {
  /** Código IBGE da UF (o mesmo de codarea nas malhas e de N3 nos agregados). */
  readonly codigo: string;
  readonly sigla: string;
  readonly nome: string;
  readonly regiao: RegiaoBrasil;
}

/** As 27 unidades da federação, com o código do IBGE. Dado de referência estável. */
export const UFS: readonly Uf[] = [
  { codigo: '11', sigla: 'RO', nome: 'Rondônia', regiao: 'Norte' },
  { codigo: '12', sigla: 'AC', nome: 'Acre', regiao: 'Norte' },
  { codigo: '13', sigla: 'AM', nome: 'Amazonas', regiao: 'Norte' },
  { codigo: '14', sigla: 'RR', nome: 'Roraima', regiao: 'Norte' },
  { codigo: '15', sigla: 'PA', nome: 'Pará', regiao: 'Norte' },
  { codigo: '16', sigla: 'AP', nome: 'Amapá', regiao: 'Norte' },
  { codigo: '17', sigla: 'TO', nome: 'Tocantins', regiao: 'Norte' },
  { codigo: '21', sigla: 'MA', nome: 'Maranhão', regiao: 'Nordeste' },
  { codigo: '22', sigla: 'PI', nome: 'Piauí', regiao: 'Nordeste' },
  { codigo: '23', sigla: 'CE', nome: 'Ceará', regiao: 'Nordeste' },
  { codigo: '24', sigla: 'RN', nome: 'Rio Grande do Norte', regiao: 'Nordeste' },
  { codigo: '25', sigla: 'PB', nome: 'Paraíba', regiao: 'Nordeste' },
  { codigo: '26', sigla: 'PE', nome: 'Pernambuco', regiao: 'Nordeste' },
  { codigo: '27', sigla: 'AL', nome: 'Alagoas', regiao: 'Nordeste' },
  { codigo: '28', sigla: 'SE', nome: 'Sergipe', regiao: 'Nordeste' },
  { codigo: '29', sigla: 'BA', nome: 'Bahia', regiao: 'Nordeste' },
  { codigo: '31', sigla: 'MG', nome: 'Minas Gerais', regiao: 'Sudeste' },
  { codigo: '32', sigla: 'ES', nome: 'Espírito Santo', regiao: 'Sudeste' },
  { codigo: '33', sigla: 'RJ', nome: 'Rio de Janeiro', regiao: 'Sudeste' },
  { codigo: '35', sigla: 'SP', nome: 'São Paulo', regiao: 'Sudeste' },
  { codigo: '41', sigla: 'PR', nome: 'Paraná', regiao: 'Sul' },
  { codigo: '42', sigla: 'SC', nome: 'Santa Catarina', regiao: 'Sul' },
  { codigo: '43', sigla: 'RS', nome: 'Rio Grande do Sul', regiao: 'Sul' },
  { codigo: '50', sigla: 'MS', nome: 'Mato Grosso do Sul', regiao: 'Centro-Oeste' },
  { codigo: '51', sigla: 'MT', nome: 'Mato Grosso', regiao: 'Centro-Oeste' },
  { codigo: '52', sigla: 'GO', nome: 'Goiás', regiao: 'Centro-Oeste' },
  { codigo: '53', sigla: 'DF', nome: 'Distrito Federal', regiao: 'Centro-Oeste' },
];

const POR_CODIGO = new Map(UFS.map((uf) => [uf.codigo, uf]));
const POR_SIGLA = new Map(UFS.map((uf) => [uf.sigla, uf]));

export function ufPorCodigo(codigo: string): Uf | undefined {
  return POR_CODIGO.get(codigo);
}

export function ufPorSigla(sigla: string): Uf | undefined {
  return POR_SIGLA.get(sigla.toUpperCase());
}
