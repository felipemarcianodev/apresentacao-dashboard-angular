import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Painel com cabeçalho opcional e rodapé de fonte. É a moldura padrão de gráfico e tabela:
 * no Mirante todo número mostra de onde veio, por isso o input `fonte`.
 */
@Component({
  selector: 'mi-card',
  templateUrl: './card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-col rounded-xl border border-line bg-surface' },
})
export class Card {
  readonly titulo = input<string>('');
  readonly descricao = input<string>('');
  readonly fonte = input<string>('');
}
