import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

export type VarianteBotao = 'primario' | 'secundario' | 'fantasma' | 'perigo';
export type TamanhoBotao = 'sm' | 'md';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50';

const VARIANTES: Record<VarianteBotao, string> = {
  primario: 'bg-primary-600 text-white hover:bg-primary-700',
  secundario: 'border border-line bg-surface text-fg hover:bg-sunken',
  fantasma: 'text-muted hover:bg-sunken hover:text-fg',
  perigo: 'bg-red-600 text-white hover:bg-red-700',
};

const TAMANHOS: Record<TamanhoBotao, string> = {
  sm: 'min-h-10 px-3.5 text-sm',
  md: 'min-h-11 px-5 text-sm',
};

/**
 * Botão do kit, aplicado sobre o elemento nativo para manter teclado, foco e formulário de graça.
 * Uso: `<button miButton variante="secundario">Exportar</button>`.
 */
@Component({
  selector: 'button[miButton], a[miButton]',
  template: `
    @if (carregando()) {
      <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
    } @else if (icone()) {
      <i class="fa-solid" [class]="icone()" aria-hidden="true"></i>
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.aria-busy]': 'carregando() || null',
  },
})
export class Button {
  readonly variante = input<VarianteBotao>('primario');
  readonly tamanho = input<TamanhoBotao>('md');
  readonly icone = input<string>('');
  readonly carregando = input(false, { transform: booleanAttribute });

  protected readonly classes = computed(
    () => `${BASE} ${VARIANTES[this.variante()]} ${TAMANHOS[this.tamanho()]}`,
  );
}
