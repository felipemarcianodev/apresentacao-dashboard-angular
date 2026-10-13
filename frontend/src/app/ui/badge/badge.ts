import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type TomBadge = 'neutro' | 'info' | 'sucesso' | 'alerta' | 'perigo' | 'violeta';

const TONS: Record<TomBadge, string> = {
  neutro: 'border-line bg-sunken text-muted',
  info: 'border-transparent bg-accent-soft text-accent-ink',
  sucesso: 'border-transparent bg-up-soft text-up',
  alerta: 'border-transparent bg-warn-soft text-warn',
  perigo: 'border-transparent bg-down-soft text-down',
  violeta: 'border-transparent bg-violet-soft text-violet',
};

/** Selo curto de status ou categoria. O tom carrega o significado; o texto sempre o repete. */
@Component({
  selector: 'mi-badge',
  template: `
    @if (icone()) {
      <i class="fa-solid text-[0.7em]" [class]="icone()" aria-hidden="true"></i>
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class Badge {
  readonly tom = input<TomBadge>('neutro');
  readonly icone = input<string>('');

  protected readonly classes = computed(
    () =>
      'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 ' +
      `text-xs font-semibold ${TONS[this.tom()]}`,
  );
}
