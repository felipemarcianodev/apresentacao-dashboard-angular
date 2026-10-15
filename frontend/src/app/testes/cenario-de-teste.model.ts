/** Identificador de persona: a tag do Playwright sem o @ (`{ tag: ['@celular'] }`). */
export type PersonaId =
  | 'visitante'
  | 'celular'
  | 'teclado'
  | 'leitor-de-tela'
  | 'tema-escuro'
  | 'api-fora'
  | 'link-compartilhado'
  | 'desenvolvedor'
  | 'mantenedor';

export type CategoriaPersona = 'Quem usa o site' | 'Situações' | 'Quem constrói';

/** Quem usa o site, do ponto de vista dos testes de ponta a ponta. */
export interface Persona {
  readonly id: PersonaId;
  readonly categoria: CategoriaPersona;
  readonly nome: string;
  readonly icone: string;
  readonly descricao: string;
}

/** Um teste de ponta a ponta, como o Playwright o lista (gerado em catalogo.ts). */
export interface CenarioDeTeste {
  /** Arquivo em e2e/, sem a pasta. */
  readonly arquivo: string;
  readonly linha: number;
  /** Títulos dos test.describe em volta, separados por " › "; vazio se não houver. */
  readonly grupo: string;
  readonly titulo: string;
  readonly personas: readonly PersonaId[];
}
