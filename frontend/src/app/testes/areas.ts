/**
 * Área do site que cada arquivo de e2e/ cobre, na ordem em que aparece na página da persona.
 * Arquivo novo de teste entra aqui (o spec da galeria falha se faltar).
 */
export const AREAS: Readonly<Record<string, string>> = {
  'navegacao.spec.ts': 'Navegação e tema',
  'paineis.spec.ts': 'Painéis',
  'acessibilidade.spec.ts': 'Acessibilidade',
  'responsivo.spec.ts': 'Telas pequenas',
  'galeria.spec.ts': 'Galeria de componentes',
  'testes.spec.ts': 'Galeria de testes',
  'producao.spec.ts': 'Imagem de produção',
  'gravar-apis.spec.ts': 'Gravação das respostas',
};

export function areaDoArquivo(arquivo: string): string {
  return AREAS[arquivo] ?? arquivo;
}

export function ordemDaArea(arquivo: string): number {
  const posicao = Object.keys(AREAS).indexOf(arquivo);
  return posicao < 0 ? Number.MAX_SAFE_INTEGER : posicao;
}
