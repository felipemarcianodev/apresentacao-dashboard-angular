import { HttpResourceRef } from '@angular/common/http';

/**
 * Valor de um httpResource, ou undefined enquanto carrega ou quando falhou.
 * Ler value() direto de um resource em erro lança exceção e derruba a tela inteira.
 */
export function valorDe<T>(recurso: HttpResourceRef<T | undefined>): T | undefined {
  return recurso.hasValue() ? recurso.value() : undefined;
}
