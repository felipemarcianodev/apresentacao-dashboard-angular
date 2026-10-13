import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { KpiCard } from './kpi-card';

const INDICADORES = `<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <mi-kpi-card
    rotulo="Vendas"
    [valor]="1284500"
    formato="moeda"
    [variacao]="3.2"
    rotuloVariacao="no trimestre"
    [serie]="[980, 1010, 1120, 1090, 1180, 1284]"
    referencia="Exemplo ilustrativo"
  />
  <mi-kpi-card
    rotulo="Taxa de desocupação"
    [valor]="7.1"
    formato="percentual"
    [variacao]="0.4"
    formatoVariacao="pontos"
    sentidoBom="baixa"
    rotuloVariacao="no trimestre"
    [serie]="[6.6, 6.8, 6.5, 6.7, 6.7, 7.1]"
    referencia="Exemplo ilustrativo"
  />
  <mi-kpi-card rotulo="Municípios" [valor]="5570" referencia="Sem variação nem série" />
</div>`;

@Component({
  selector: 'mi-exemplo-kpi-card',
  imports: [KpiCard],
  template: INDICADORES,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploIndicadores {}

export const KPI_CARD_DOC: ComponentDoc = {
  slug: 'kpi-card',
  nome: 'KpiCard',
  seletor: 'mi-kpi-card',
  categoria: 'Gráficos',
  resumo: 'Indicador em destaque com variação, minigráfico de tendência e referência.',
  descricao: [
    'A cor da variação depende do sentidoBom: alta de vendas é boa (verde), alta de desocupação é ruim (vermelho). A seta e um texto oculto para leitor de tela repetem a direção, então a cor nunca é a única pista.',
    'A série opcional vira um Sparkline com a mesma cor da variação.',
  ],
  importacao: "import { KpiCard } from './charts/kpi-card/kpi-card';",
  entradas: [
    { nome: 'rotulo', tipo: 'string', obrigatoria: true, descricao: 'Nome do indicador.' },
    { nome: 'valor', tipo: 'number | null', obrigatoria: true, descricao: 'Valor atual. null exibe "sem dado".' },
    { nome: 'formato', tipo: 'FormatoNumero', padrao: "'numero'", descricao: "numero, decimal, percentual (em pontos: 4.6 vira 4,6%), moeda, moeda-compacta (R$ 10,94 tri) ou compacto." },
    { nome: 'unidade', tipo: 'string', padrao: "''", descricao: 'Sufixo discreto após o valor (hab., t, km²).' },
    { nome: 'variacao', tipo: 'number | null', padrao: 'null', descricao: 'Variação a exibir com sinal.' },
    { nome: 'formatoVariacao', tipo: "FormatoNumero | 'pontos'", padrao: "'percentual'", descricao: 'Use pontos para diferença entre taxas (p.p.).' },
    { nome: 'rotuloVariacao', tipo: 'string', padrao: "''", descricao: 'Base da comparação ("em 12 meses").' },
    { nome: 'sentidoBom', tipo: "'alta' | 'baixa' | 'neutro'", padrao: "'alta'", descricao: 'Qual direção é favorável, para a cor.' },
    { nome: 'serie', tipo: 'readonly (number | null)[]', padrao: '[]', descricao: 'Histórico para o minigráfico (2 pontos ou mais).' },
    { nome: 'referencia', tipo: 'string', padrao: "''", descricao: 'Período ou fonte do dado.' },
  ],
  saidas: [],
  exemplos: [{ titulo: 'Indicadores', componente: ExemploIndicadores, codigo: INDICADORES }],
  acessibilidade: [
    'A direção da variação é lida como texto ("Alta de", "Queda de") por leitores de tela.',
    'O minigráfico é decorativo (aria-hidden); o valor e a variação carregam a informação.',
  ],
};
