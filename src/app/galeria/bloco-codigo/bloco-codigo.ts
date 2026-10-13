import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/**
 * Trecho de código com botão de copiar. O código é renderizado por interpolação (texto),
 * nunca como HTML.
 */
@Component({
  selector: 'mi-bloco-codigo',
  templateUrl: './bloco-codigo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class BlocoCodigo {
  readonly codigo = input.required<string>();
  readonly linguagem = input('html');

  protected readonly copiado = signal(false);

  protected async copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.codigo());
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 2000);
    } catch {
      // Clipboard negado pelo navegador: o texto continua selecionável no bloco.
    }
  }
}
