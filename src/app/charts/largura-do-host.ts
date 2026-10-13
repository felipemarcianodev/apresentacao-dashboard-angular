import { DestroyRef, ElementRef, Signal, afterNextRender, inject, signal } from '@angular/core';

/**
 * Largura do elemento hospedeiro em pixels, atualizada por ResizeObserver.
 * Os gráficos desenham em pixels reais (e não num viewBox esticado) para o texto dos eixos
 * não deformar. Deve ser chamada no contexto de injeção do componente.
 */
export function larguraDoHost(inicial = 640): Signal<number> {
  const elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const destroyRef = inject(DestroyRef);
  const largura = signal(inicial);

  afterNextRender(() => {
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
