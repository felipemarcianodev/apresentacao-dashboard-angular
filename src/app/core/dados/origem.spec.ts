import { HttpHeaders, HttpResourceRef } from '@angular/common/http';
import { obtidoNaReserva } from './origem';

function recurso(cabecalhos?: Record<string, string>): HttpResourceRef<unknown> {
  const headers = cabecalhos ? new HttpHeaders(cabecalhos) : undefined;
  return { headers: () => headers } as unknown as HttpResourceRef<unknown>;
}

describe('obtidoNaReserva', () => {
  it('é null quando nada veio da reserva', () => {
    expect(obtidoNaReserva([recurso({ 'X-Mirante-Origem': 'fonte' }), recurso({ 'X-Mirante-Origem': 'cache' }), recurso()])).toBeNull();
  });

  it('devolve o momento mais antigo entre os dados da reserva', () => {
    const quando = obtidoNaReserva([
      recurso({ 'X-Mirante-Origem': 'reserva', 'X-Mirante-Obtido-Em': '2026-10-13T10:00:00+00:00' }),
      recurso({ 'X-Mirante-Origem': 'fonte', 'X-Mirante-Obtido-Em': '2026-10-01T10:00:00+00:00' }),
      recurso({ 'X-Mirante-Origem': 'reserva', 'X-Mirante-Obtido-Em': '2026-10-12T08:00:00+00:00' }),
    ]);
    expect(quando?.toISOString()).toBe('2026-10-12T08:00:00.000Z');
  });

  it('ignora data inválida em vez de mostrar "Invalid Date"', () => {
    expect(obtidoNaReserva([recurso({ 'X-Mirante-Origem': 'reserva', 'X-Mirante-Obtido-Em': 'ontem' })])).toBeNull();
  });
});
