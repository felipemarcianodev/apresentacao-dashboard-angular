import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Sparkline } from './sparkline';

const CORES = `<div class="grid gap-4 sm:grid-cols-3">
  <mi-sparkline class="text-accent" [valores]="[4, 6, 5, 8, 7, 9, 11]" />
  <mi-sparkline class="text-up" [valores]="[3, 4, 4, 5, null, 6, 7]" />
  <mi-sparkline class="text-down" [valores]="[9, 8, 8, 6, 5, 5, 3]" [altura]="48" />
</div>`;

@Component({
  selector: 'mi-exemplo-sparkline',
  imports: [Sparkline],
  template: CORES,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploCores {}

export const SPARKLINE_DOC: ComponentDoc = {
  slug: 'sparkline',
  nome: 'Sparkline',
  seletor: 'mi-sparkline',
  categoria: 'Gráficos',
  resumo: 'Minigráfico de tendência sem eixos, para ficar ao lado de um número.',
  descricao: [
    'Ocupa a largura do elemento (medida por ResizeObserver) e a altura do input altura.',
    'A cor vem de currentColor: defina com uma classe de texto (text-up, text-down, text-accent). Valores null são pulados.',
  ],
  importacao: "import { Sparkline } from './charts/sparkline/sparkline';",
  entradas: [
    { nome: 'valores', tipo: 'readonly (number | null)[]', obrigatoria: true, descricao: 'Série em ordem cronológica.' },
    { nome: 'altura', tipo: 'number', padrao: '36', descricao: 'Altura em pixels.' },
  ],
  saidas: [],
  exemplos: [{ titulo: 'Cores pela classe de texto', componente: ExemploCores, codigo: CORES }],
  acessibilidade: [
    'É decorativo (aria-hidden). Sempre acompanhe com o número e a variação em texto, como faz o KpiCard.',
  ],
};
