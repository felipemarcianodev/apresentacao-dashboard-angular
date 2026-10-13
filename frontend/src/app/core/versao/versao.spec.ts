import { VERSAO } from './versao';

describe('VERSAO', () => {
  it('vem do arquivo VERSION, no formato semântico e sem quebra de linha', () => {
    expect(VERSAO).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
