import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Badge } from '../badge/badge';
import { Card } from './card';

const COMPLETO = `<mi-card
  titulo="População residente"
  descricao="Exemplo ilustrativo"
  fonte="IBGE, Censo Demográfico"
>
  <mi-badge acoes tom="info">Exemplo</mi-badge>
  <p class="text-sm text-muted">Qualquer conteúdo entra aqui: gráfico, tabela, texto.</p>
</mi-card>`;

@Component({
  selector: 'mi-exemplo-card-completo',
  imports: [Card, Badge],
  template: COMPLETO,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploCompleto {}

const SIMPLES = `<mi-card>
  <p class="text-sm">Sem título e sem fonte, o card vira só uma moldura.</p>
</mi-card>`;

@Component({
  selector: 'mi-exemplo-card-simples',
  imports: [Card],
  template: SIMPLES,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploSimples {}

export const CARD_DOC: ComponentDoc = {
  slug: 'card',
  nome: 'Card',
  seletor: 'mi-card',
  categoria: 'Primitivos',
  resumo: 'Moldura de gráfico e tabela, com título, ações e rodapé de fonte.',
  descricao: [
    'É a peça que organiza um painel. O cabeçalho só aparece quando há título.',
    'O input fonte gera o rodapé "Fonte: ...". No Mirante todo número mostra de onde veio, então todo card com dado preenche a fonte.',
  ],
  importacao: "import { Card } from './ui/card/card';",
  entradas: [
    { nome: 'titulo', tipo: 'string', padrao: "''", descricao: 'Título do card. Sem ele, o cabeçalho não é renderizado.' },
    { nome: 'descricao', tipo: 'string', padrao: "''", descricao: 'Linha de apoio abaixo do título (período, unidade).' },
    { nome: 'fonte', tipo: 'string', padrao: "''", descricao: 'Origem do dado, exibida no rodapé.' },
  ],
  saidas: [],
  conteudo: [
    { nome: 'padrão', tipo: 'conteúdo', descricao: 'Corpo do card.' },
    { nome: '[acoes]', tipo: 'conteúdo', descricao: 'Elementos com o atributo acoes vão para o canto direito do cabeçalho.' },
  ],
  exemplos: [
    { titulo: 'Com título, ação e fonte', componente: ExemploCompleto, codigo: COMPLETO },
    { titulo: 'Só a moldura', componente: ExemploSimples, codigo: SIMPLES },
  ],
  acessibilidade: [
    'O título é um h3: dentro de uma página com h2 por seção, a hierarquia fica correta.',
    'O ícone do rodapé é decorativo; o texto "Fonte:" carrega a informação.',
  ],
};
