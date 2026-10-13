import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';

/**
 * Espaço reservado enquanto o dado carrega. O tamanho vem de quem usa, por classe no próprio
 * elemento (`<mi-skeleton class="h-40" />`); com `linhas`, desenha um bloco de texto.
 */
@Component({
  selector: 'mi-skeleton',
  template: `
    @if (linhas() > 0) {
      <div class="grid gap-2">
        @for (largura of largurasDasLinhas(); track $index) {
          <span class="block h-3 animate-pulse rounded bg-sunken" [style.width]="largura"></span>
        }
      </div>
    } @else {
      <span class="block size-full min-h-4 animate-pulse rounded-lg bg-sunken"></span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block', 'aria-hidden': 'true' },
})
export class Skeleton {
  readonly linhas = input(0, { transform: numberAttribute });

  /** Última linha mais curta, como um parágrafo de verdade. */
  protected readonly largurasDasLinhas = computed(() =>
    Array.from({ length: this.linhas() }, (_, i) => (i === this.linhas() - 1 ? '60%' : '100%')),
  );
}
