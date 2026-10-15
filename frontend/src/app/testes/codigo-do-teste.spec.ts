import { codigoDoTeste } from './codigo-do-teste';

describe('codigoDoTeste', () => {
  it('aponta para o arquivo e a linha na tag da versão', () => {
    const cenario = { arquivo: 'paineis.spec.ts', linha: 42, grupo: '', titulo: 'x', personas: ['visitante' as const] };
    expect(codigoDoTeste(cenario, '1.3.0')).toBe(
      'https://github.com/felipemarcianodev/apresentacao-dashboard-angular/blob/v1.3.0/frontend/e2e/paineis.spec.ts#L42',
    );
  });
});
