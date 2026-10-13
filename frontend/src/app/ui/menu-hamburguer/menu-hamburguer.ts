import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input } from '@angular/core';

const BARRA = 'absolute left-0 h-0.5 w-5 rounded-full bg-current transition-all duration-200 motion-reduce:transition-none';

/**
 * Botão de menu (três barras que viram um X quando o menu está aberto), aplicado sobre o button
 * nativo. Quem usa liga o clique e diz se o menu está aberto; o componente cuida do ícone, do
 * aria-expanded e do aria-controls.
 * Uso: `<button miMenuHamburguer [aberto]="aberto()" controla="menu" (click)="alternar()"></button>`.
 */
@Component({
  selector: 'button[miMenuHamburguer]',
  template: `
    <span class="relative block h-3.5 w-5" aria-hidden="true">
      <span [class]="barraDeCima()"></span>
      <span [class]="barraDoMeio()"></span>
      <span [class]="barraDeBaixo()"></span>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    type: 'button',
    class: 'grid size-10 place-items-center rounded-lg text-muted transition-colors hover:bg-sunken hover:text-fg',
    '[attr.aria-expanded]': 'aberto()',
    '[attr.aria-controls]': 'controla() || null',
    '[attr.aria-label]': 'rotulo()',
  },
})
export class MenuHamburguer {
  /** Se o menu controlado está aberto: vira aria-expanded e, com virarX, desenha o X. */
  readonly aberto = input(false, { transform: booleanAttribute });
  /** id do elemento que o botão abre e fecha (aria-controls). */
  readonly controla = input('');
  /** Nome acessível. Fica igual nos dois estados: quem diz se está aberto é o aria-expanded. */
  readonly rotulo = input('Menu');
  /** Troca as barras pelo X quando aberto. Desligue quando o menu aberto não cobre a tela (barra lateral fixa). */
  readonly virarX = input(true, { transform: booleanAttribute });

  private readonly x = computed(() => this.aberto() && this.virarX());

  // As classes ficam inteiras no código (e não em [class.x]) para o Tailwind encontrá-las.
  protected readonly barraDeCima = computed(() => `${BARRA} ${this.x() ? 'top-1.5 rotate-45' : 'top-0'}`);
  protected readonly barraDoMeio = computed(() => `${BARRA} top-1.5 ${this.x() ? 'opacity-0' : ''}`);
  protected readonly barraDeBaixo = computed(() => `${BARRA} ${this.x() ? 'top-1.5 -rotate-45' : 'top-3'}`);
}
