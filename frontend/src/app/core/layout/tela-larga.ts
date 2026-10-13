import { DOCUMENT, DestroyRef, Signal, inject, signal } from '@angular/core';

/** A partir daqui a barra lateral fica fixa ao lado do conteúdo (breakpoint lg do Tailwind). */
export const MEDIA_TELA_LARGA = '(min-width: 1024px)';

/**
 * Signal que diz se a tela está no breakpoint lg ou acima, atualizado quando a janela muda de
 * tamanho. Chamar dentro de um contexto de injeção (campo de componente).
 */
export function telaLarga(): Signal<boolean> {
  const janela = inject(DOCUMENT).defaultView;
  const consulta = janela?.matchMedia?.(MEDIA_TELA_LARGA);
  const larga = signal(consulta?.matches ?? true);
  if (consulta) {
    const atualizar = (evento: MediaQueryListEvent) => larga.set(evento.matches);
    consulta.addEventListener('change', atualizar);
    inject(DestroyRef).onDestroy(() => consulta.removeEventListener('change', atualizar));
  }
  return larga.asReadonly();
}
