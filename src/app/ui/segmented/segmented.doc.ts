import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { OpcaoSegmented, Segmented } from './segmented';

const PERIODO = `<mi-segmented rotulo="Período" [opcoes]="periodos" [(valor)]="periodo" />
<p class="mt-3 text-sm text-muted">Selecionado: {{ periodo() }}</p>`;

@Component({
  selector: 'mi-exemplo-segmented-periodo',
  imports: [Segmented],
  template: PERIODO,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploPeriodo {
  protected readonly periodos: OpcaoSegmented[] = [
    { valor: '1A', rotulo: '1A' },
    { valor: '5A', rotulo: '5A' },
    { valor: '10A', rotulo: '10A' },
    { valor: 'max', rotulo: 'Máx.' },
  ];
  protected readonly periodo = signal('5A');
}

export const SEGMENTED_DOC: ComponentDoc = {
  slug: 'segmented',
  nome: 'Segmented',
  seletor: 'mi-segmented',
  categoria: 'Primitivos',
  resumo: 'Escolha única entre poucas opções sempre visíveis, como o período de um gráfico.',
  descricao: [
    'Funciona com two-way binding por model(): [(valor)]="sinal" mantém o signal do pai sincronizado.',
    'Para mais de cinco opções, prefira um select.',
  ],
  importacao: "import { Segmented, OpcaoSegmented } from './ui/segmented/segmented';",
  entradas: [
    { nome: 'opcoes', tipo: 'readonly OpcaoSegmented<T>[]', obrigatoria: true, descricao: 'Lista de { valor, rotulo }.' },
    { nome: 'rotulo', tipo: 'string', obrigatoria: true, descricao: 'Nome do grupo para leitor de tela (aria-label).' },
    { nome: 'valor', tipo: 'model<T>', obrigatoria: true, descricao: 'Valor selecionado. Use [(valor)] para two-way binding.' },
  ],
  saidas: [{ nome: 'valorChange', tipo: 'T', descricao: 'Emitido a cada troca (gerado pelo model).' }],
  exemplos: [{ titulo: 'Seletor de período', componente: ExemploPeriodo, codigo: PERIODO }],
  acessibilidade: [
    'Padrão radiogroup do WAI-ARIA: só a opção selecionada entra na ordem do Tab.',
    'Setas para os lados (ou para cima e para baixo) trocam a opção e movem o foco.',
  ],
};
