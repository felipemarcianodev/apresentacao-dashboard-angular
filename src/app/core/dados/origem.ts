import { HttpResourceRef } from '@angular/common/http';

/**
 * A API do Mirante diz de onde veio cada resposta (X-Mirante-Origem: cache, fonte ou reserva).
 * "reserva" é a última resposta boa guardada, servida porque a fonte oficial não respondeu.
 *
 * Devolve quando foi obtido o dado mais antigo servido da reserva entre os recursos, ou null se
 * nenhum veio dela. O painel usa isso para avisar que o número pode não ser o mais recente.
 */
export function obtidoNaReserva(recursos: readonly HttpResourceRef<unknown>[]): Date | null {
  let maisAntigo: Date | null = null;
  for (const recurso of recursos) {
    const cabecalhos = recurso.headers();
    if (cabecalhos?.get('X-Mirante-Origem') !== 'reserva') {
      continue;
    }
    const obtidoEm = new Date(cabecalhos.get('X-Mirante-Obtido-Em') ?? '');
    if (Number.isNaN(obtidoEm.getTime())) {
      continue;
    }
    if (!maisAntigo || obtidoEm < maisAntigo) {
      maisAntigo = obtidoEm;
    }
  }
  return maisAntigo;
}
