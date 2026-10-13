import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Badge } from '../../ui/badge/badge';

const FORMATO = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

/**
 * Aviso do painel quando algum dado veio da reserva da API do Mirante: a fonte oficial não
 * respondeu e o número mostrado é o último obtido. Específico dos painéis (depende do cabeçalho
 * da API própria), por isso fica fora do kit.
 */
@Component({
  selector: 'mi-aviso-de-reserva',
  imports: [Badge],
  template: `
    <p
      role="status"
      class="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-line bg-warn-soft px-4 py-3 text-sm"
    >
      <mi-badge tom="alerta" icone="fa-clock-rotate-left">Dado guardado</mi-badge>
      <span>A fonte oficial não respondeu agora. Os números são os últimos obtidos, em {{ quando() }}.</span>
    </p>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvisoDeReserva {
  readonly obtidoEm = input.required<Date>();

  protected readonly quando = computed(() => FORMATO.format(this.obtidoEm()));
}
