import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Estado vazio: diz o que apareceria ali e, quando houver, como chegar lá. */
@Component({
  selector: 'mi-empty-state',
  template: `
    <i class="fa-solid mb-3 text-2xl text-muted" [class]="icone()" aria-hidden="true"></i>
    <p class="font-semibold">{{ titulo() }}</p>
    @if (descricao()) {
      <p class="mt-1 max-w-sm text-sm text-muted">{{ descricao() }}</p>
    }
    <div class="mt-4 empty:hidden"><ng-content /></div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col items-center px-6 py-10 text-center' },
})
export class EmptyState {
  readonly titulo = input.required<string>();
  readonly descricao = input<string>('');
  readonly icone = input<string>('fa-inbox');
}
