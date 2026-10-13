import { ChangeDetectionStrategy, Component, ElementRef, inject, input, model } from '@angular/core';

export interface OpcaoSegmented<T extends string = string> {
  readonly valor: T;
  readonly rotulo: string;
}

/**
 * Escolha única entre poucas opções sempre visíveis (período 1A, 5A, 10A...).
 * Segue o padrão de radiogroup: Tab entra no grupo, setas trocam a opção.
 */
@Component({
  selector: 'mi-segmented',
  templateUrl: './segmented.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
})
export class Segmented<T extends string = string> {
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly opcoes = input.required<readonly OpcaoSegmented<T>[]>();
  readonly rotulo = input.required<string>();
  readonly valor = model.required<T>();

  protected selecionar(valor: T): void {
    this.valor.set(valor);
  }

  protected moverComTeclado(evento: KeyboardEvent, indice: number): void {
    const passos: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const passo = passos[evento.key];
    if (passo === undefined) {
      return;
    }
    evento.preventDefault();
    const opcoes = this.opcoes();
    const proximo = (indice + passo + opcoes.length) % opcoes.length;
    this.valor.set(opcoes[proximo].valor);
    this.elemento.nativeElement.querySelectorAll<HTMLButtonElement>('button')[proximo]?.focus();
  }
}
