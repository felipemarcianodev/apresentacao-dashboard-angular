import { DestroyRef, ElementRef, Signal, afterNextRender, inject, signal } from '@angular/core';

/**
 * Largura do elemento hospedeiro em pixels, medida logo após a primeira renderização e atualizada
 * por ResizeObserver. Começa em zero: o gráfico só desenha depois de saber o espaço que tem, em vez
 * de usar um palpite que transborda o card até a primeira medição.
 * Os gráficos desenham em pixels reais (e não num viewBox esticado) para o texto dos eixos
 * não deformar. Deve ser chamada no contexto de injeção do componente.
 */
export function larguraDoHost(): Signal<number> {
  const elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);
  const largura = signal(0);

  afterNextRender(() => {
    largura.set(Math.floor(elemento.getBoundingClientRect().width));
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const observador = new ResizeObserver(([entrada]) => {
      const medida = Math.floor(entrada.contentRect.width);
      if (medida > 0) {
        largura.set(medida);
      }
    });
    observador.observe(elemento);
    destroyRef.onDestroy(() => observador.disconnect());
  });

  return largura.asReadonly();
}
