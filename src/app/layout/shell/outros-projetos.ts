export interface OutroProjeto {
  readonly url: string;
  readonly rotulo: string;
  readonly descricao: string;
  readonly icone: string;
}

/** Outros projetos do autor, listados na barra lateral em "Conheça também". */
export const OUTROS_PROJETOS: readonly OutroProjeto[] = [
  {
    url: 'https://planuz.com',
    rotulo: 'Planuz',
    descricao: 'SaaS de planejamento técnico',
    icone: 'fa-diagram-project',
  },
  {
    url: 'https://felipemarcianodev.com',
    rotulo: 'Portfólio',
    descricao: 'Projetos e trajetória',
    icone: 'fa-briefcase',
  },
  {
    url: 'https://blog.felipemarcianodev.com',
    rotulo: 'Blog',
    descricao: 'Artigos sobre desenvolvimento',
    icone: 'fa-pen-nib',
  },
];
