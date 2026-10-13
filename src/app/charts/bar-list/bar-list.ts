import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, numberAttribute } from '@angular/core';
import { FormatoNumero, formatar } from '../../core/formato/formato';

export interface ItemBarra {
  readonly rotulo: string;
  readonly valor: number;
  readonly destaque?: boolean;
}

/**
 * Ranking em barras horizontais. É HTML e não SVG: o rótulo quebra linha, a barra acompanha
 * a largura e a lista continua sendo uma lista para o leitor de tela.
 */
@Component({
  selector: 'mi-bar-list',
  templateUrl: './bar-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class BarList {
  readonly itens = input.required<readonly ItemBarra[]>();
  readonly formato = input<FormatoNumero>('numero');
  readonly ordenar = input(true, { transform: booleanAttribute });
  readonly limite = input(0, { transform: numberAttribute });

  protected readonly linhas = computed(() => {
    let itens = [...this.itens()];
    if (this.ordenar()) {
      itens.sort((a, b) => b.valor - a.valor);
    }
    if (this.limite() > 0) {
      itens = itens.slice(0, this.limite());
    }
    const maximo = Math.max(...itens.map((item) => Math.abs(item.valor)), 0);
    return itens.map((item) => ({
      ...item,
      texto: formatar(item.valor, this.formato()),
      percentual: maximo > 0 ? (Math.abs(item.valor) / maximo) * 100 : 0,
    }));
  });
}
