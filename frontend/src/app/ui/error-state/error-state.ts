import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from '../button/button';

/** Estado de erro com saída: explica o que falhou e oferece tentar de novo. */
@Component({
  selector: 'mi-error-state',
  imports: [Button],
  template: `
    <i class="fa-solid fa-triangle-exclamation mb-3 text-2xl text-down" aria-hidden="true"></i>
    <p class="font-semibold">{{ titulo() }}</p>
    <p class="mt-1 max-w-sm text-sm text-muted">{{ descricao() }}</p>
    <button miButton variante="secundario" tamanho="sm" icone="fa-rotate-right" class="mt-4" (click)="tentarDeNovo.emit()">
      Tentar de novo
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col items-center px-6 py-10 text-center', role: 'alert' },
})
export class ErrorState {
  readonly titulo = input('Não foi possível carregar os dados');
  readonly descricao = input('A fonte não respondeu. Confira a conexão e tente de novo.');

  readonly tentarDeNovo = output<void>();
}
