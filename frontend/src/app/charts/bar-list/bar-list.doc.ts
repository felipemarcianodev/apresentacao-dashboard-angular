import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Card } from '../../ui/card/card';
import { BarList, ItemBarra } from './bar-list';

const RANKING = `<mi-card titulo="Maiores filiais" descricao="Exemplo ilustrativo, top 5">
  <mi-bar-list [itens]="filiais" formato="compacto" [limite]="5" />
</mi-card>`;

@Component({
  selector: 'mi-exemplo-bar-list',
  imports: [BarList, Card],
  template: RANKING,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploRanking {
  protected readonly filiais: ItemBarra[] = [
    { rotulo: 'Filial Norte', valor: 820000 },
    { rotulo: 'Filial Centro', valor: 2450000, destaque: true },
    { rotulo: 'Filial Sul', valor: 1630000 },
    { rotulo: 'Filial Leste', valor: 410000 },
    { rotulo: 'Filial Oeste', valor: 1120000 },
    { rotulo: 'Filial Litoral', valor: 260000 },
  ];
}

export const BAR_LIST_DOC: ComponentDoc = {
  slug: 'bar-list',
  nome: 'BarList',
  seletor: 'mi-bar-list',
  categoria: 'Gráficos',
  resumo: 'Ranking em barras horizontais, com rótulo, barra proporcional e valor.',
  descricao: [
    'Feito em HTML com utilitários do Tailwind, não em SVG: o rótulo trunca com título completo no hover, a barra acompanha a largura e o resultado continua sendo uma lista ordenada.',
    'A barra é proporcional ao maior valor exibido. Marque destaque para chamar atenção para um item (a UF selecionada, por exemplo).',
  ],
  importacao: "import { BarList, ItemBarra } from './charts/bar-list/bar-list';",
  entradas: [
    { nome: 'itens', tipo: 'readonly ItemBarra[]', obrigatoria: true, descricao: 'Lista de { rotulo, valor, destaque? }.' },
    { nome: 'formato', tipo: 'FormatoNumero', padrao: "'numero'", descricao: 'Formato do valor.' },
    { nome: 'ordenar', tipo: 'boolean', padrao: 'true', descricao: 'Ordena do maior para o menor.' },
    { nome: 'limite', tipo: 'number', padrao: '0', descricao: 'Mostra só os N primeiros. Zero mostra todos.' },
  ],
  saidas: [],
  exemplos: [{ titulo: 'Ranking com destaque', componente: ExemploRanking, codigo: RANKING }],
  acessibilidade: [
    'É uma lista ordenada (ol): a posição no ranking é anunciada.',
    'A barra é decorativa; o valor está escrito ao lado.',
  ],
};
