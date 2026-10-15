import { CategoriaPersona, Persona, PersonaId } from './cenario-de-teste.model';

export const CATEGORIAS_PERSONA: readonly CategoriaPersona[] = ['Quem usa o site', 'Situações', 'Quem constrói'];

/**
 * Personas da galeria de testes, na ordem da página. Cada teste de ponta a ponta declara as suas
 * por tag (`{ tag: ['@celular'] }`); o scripts/catalogo-de-testes.mjs recusa tag fora desta lista.
 */
export const PERSONAS: readonly Persona[] = [
  {
    id: 'visitante',
    categoria: 'Quem usa o site',
    nome: 'Quem visita',
    icone: 'fa-user',
    descricao: 'Abre os painéis, navega pelo menu, filtra, ordena e exporta, num notebook comum.',
  },
  {
    id: 'celular',
    categoria: 'Quem usa o site',
    nome: 'No celular',
    icone: 'fa-mobile-screen',
    descricao: 'Tela de 360 px com toque: nada rola para o lado, alvos de 40 px e menu em gaveta.',
  },
  {
    id: 'teclado',
    categoria: 'Quem usa o site',
    nome: 'Só com teclado',
    icone: 'fa-keyboard',
    descricao: 'Navega sem mouse: atalho para pular ao conteúdo e Tab que não entra no que está escondido.',
  },
  {
    id: 'leitor-de-tela',
    categoria: 'Quem usa o site',
    nome: 'Com leitor de tela',
    icone: 'fa-universal-access',
    descricao: 'Depende de nomes acessíveis e de estrutura: o axe confere WCAG 2.2 AA em cada página.',
  },
  {
    id: 'tema-escuro',
    categoria: 'Quem usa o site',
    nome: 'Tema escuro',
    icone: 'fa-moon',
    descricao: 'Escolhe o tema escuro ou segue o do aparelho, com contraste conferido nos dois temas.',
  },
  {
    id: 'api-fora',
    categoria: 'Situações',
    nome: 'Fonte fora do ar',
    icone: 'fa-plug-circle-xmark',
    descricao: 'Quando a API ou a fonte oficial cai: erro com "Tentar de novo" ou o dado guardado, com a data.',
  },
  {
    id: 'link-compartilhado',
    categoria: 'Situações',
    nome: 'Link compartilhado',
    icone: 'fa-share-nodes',
    descricao: 'Recebe um link: abre na UF certa, rota desconhecida não quebra e a prévia mostra o cartão da página.',
  },
  {
    id: 'desenvolvedor',
    categoria: 'Quem constrói',
    nome: 'Quem reaproveita o kit',
    icone: 'fa-code',
    descricao: 'Usa a galeria /ui: cada componente abre com o exemplo funcionando e o código copia certo.',
  },
  {
    id: 'mantenedor',
    categoria: 'Quem constrói',
    nome: 'Quem mantém o site',
    icone: 'fa-screwdriver-wrench',
    descricao: 'Confere a imagem de produção (CSP, headers e cache) e regrava as respostas das fontes.',
  },
];

export function buscarPersona(id: string): Persona | undefined {
  return PERSONAS.find((persona) => persona.id === (id as PersonaId));
}
