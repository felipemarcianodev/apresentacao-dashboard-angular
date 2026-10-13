import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Card } from '../../ui/card/card';
import { LineChart, SerieGrafico } from './line-chart';

const TRIMESTRES = ['1º tri 23', '2º tri 23', '3º tri 23', '4º tri 23', '1º tri 24', '2º tri 24', '3º tri 24', '4º tri 24'];

function serie(nome: string, valores: (number | null)[]): SerieGrafico {
  return { nome, pontos: valores.map((valor, i) => ({ rotulo: TRIMESTRES[i], valor })) };
}

const UMA_SERIE = `<mi-card titulo="Receita trimestral" descricao="Exemplo ilustrativo" fonte="Dados fictícios">
  <mi-line-chart rotulo="Receita trimestral, em reais" formato="compacto" [series]="receita" />
</mi-card>`;

@Component({
  selector: 'mi-exemplo-line-chart-uma',
  imports: [LineChart, Card],
  template: UMA_SERIE,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploUmaSerie {
  protected readonly receita = [serie('Receita', [1.2e6, 1.35e6, 1.31e6, 1.6e6, 1.52e6, 1.7e6, 1.78e6, 1.95e6])];
}

const VARIAS_SERIES = `<mi-card titulo="Taxa por região" descricao="Exemplo ilustrativo, com um trimestre sem dado">
  <mi-line-chart rotulo="Taxa por região, em %" formato="percentual" [altura]="220" [series]="regioes" />
</mi-card>`;

@Component({
  selector: 'mi-exemplo-line-chart-varias',
  imports: [LineChart, Card],
  template: VARIAS_SERIES,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploVariasSeries {
  protected readonly regioes = [
    serie('Região A', [8.1, 7.9, 7.6, 7.2, 7.4, 6.9, 6.6, 6.2]),
    serie('Região B', [11.3, 11.0, null, 10.1, 10.4, 9.8, 9.5, 9.0]),
    serie('Região C', [5.2, 5.4, 5.1, 4.9, 5.0, 4.7, 4.5, 4.4]),
  ];
}

export const LINE_CHART_DOC: ComponentDoc = {
  slug: 'line-chart',
  nome: 'LineChart',
  seletor: 'mi-line-chart',
  categoria: 'Gráficos',
  resumo: 'Séries temporais em linha, com eixo arredondado, tooltip e leitura por teclado.',
  descricao: [
    'Desenha em pixels reais (largura medida por ResizeObserver), por isso o texto dos eixos não deforma em nenhuma largura.',
    'O eixo Y usa marcas "redondas" (1, 2, 2,5 ou 5 vezes uma potência de dez). Com uma série, a linha ganha área; com várias, legenda e uma cor por série. Ponto null interrompe a linha em vez de inventar valor.',
    'As séries devem ter os mesmos rótulos, na mesma ordem: o eixo X usa os rótulos da primeira.',
  ],
  importacao: "import { LineChart, SerieGrafico } from './charts/line-chart/line-chart';",
  entradas: [
    { nome: 'series', tipo: 'readonly SerieGrafico[]', obrigatoria: true, descricao: 'Lista de { nome, pontos: { rotulo, valor }[] }.' },
    { nome: 'rotulo', tipo: 'string', obrigatoria: true, descricao: 'Descrição do gráfico para leitor de tela e legenda da tabela oculta.' },
    { nome: 'formato', tipo: 'FormatoNumero', padrao: "'numero'", descricao: 'Formato dos valores no eixo e no tooltip.' },
    { nome: 'altura', tipo: 'number', padrao: '260', descricao: 'Altura em pixels.' },
    { nome: 'incluirZero', tipo: 'boolean', padrao: 'false', descricao: 'Força o zero no eixo Y.' },
  ],
  saidas: [],
  exemplos: [
    { titulo: 'Uma série com área', descricao: 'Passe o mouse ou foque o gráfico e use as setas.', componente: ExemploUmaSerie, codigo: UMA_SERIE },
    { titulo: 'Várias séries', componente: ExemploVariasSeries, codigo: VARIAS_SERIES },
  ],
  acessibilidade: [
    'O gráfico é focável: setas, Home e End percorrem os pontos e o tooltip é anunciado (aria-live).',
    'Uma tabela visualmente oculta repete todos os valores para leitores de tela.',
    'As cores das séries vêm dos tokens do tema e funcionam no claro e no escuro.',
  ],
};
