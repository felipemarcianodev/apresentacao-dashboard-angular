import { ChangeDetectionStrategy, Component, computed, input, numberAttribute } from '@angular/core';
import { escalaLinear, eixoAgradavel } from '../escala';
import { larguraDoHost } from '../largura-do-host';

/**
 * Minigráfico de linha sem eixos, para mostrar tendência ao lado de um número.
 * A cor vem de `currentColor`: use uma classe de texto no elemento (`class="text-up"`).
 */
@Component({
  selector: 'mi-sparkline',
  template: `
    @if (desenho(); as d) {
      <svg [attr.width]="largura()" [attr.height]="altura()" class="block overflow-visible" aria-hidden="true">
        <path [attr.d]="d.area" fill="currentColor" class="opacity-10" />
        <path
          [attr.d]="d.linha"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <circle [attr.cx]="d.fimX" [attr.cy]="d.fimY" r="2.75" fill="currentColor" />
      </svg>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class Sparkline {
  readonly valores = input.required<readonly (number | null)[]>();
  readonly altura = input(36, { transform: numberAttribute });

  protected readonly largura = larguraDoHost();

  protected readonly desenho = computed(() => {
    const pontos = this.valores()
      .map((valor, indice) => ({ valor, indice }))
      .filter((p): p is { valor: number; indice: number } => p.valor !== null && Number.isFinite(p.valor));
    if (pontos.length < 2 || this.largura() === 0) {
      return null;
    }
    const folga = 3;
    const total = this.valores().length - 1;
    const { dominio } = eixoAgradavel(pontos.map((p) => p.valor), 2);
    const x = escalaLinear([0, total], [folga, this.largura() - folga]);
    const y = escalaLinear(dominio, [this.altura() - folga, folga]);
    const coordenadas = pontos.map((p) => `${x(p.indice).toFixed(1)},${y(p.valor).toFixed(1)}`);
    const ultimo = pontos[pontos.length - 1];
    const base = (this.altura() - folga).toFixed(1);
    return {
      linha: `M${coordenadas.join('L')}`,
      area: `M${x(pontos[0].indice).toFixed(1)},${base}L${coordenadas.join('L')}L${x(ultimo.indice).toFixed(1)},${base}Z`,
      fimX: x(ultimo.indice),
      fimY: y(ultimo.valor),
    };
  });
}
