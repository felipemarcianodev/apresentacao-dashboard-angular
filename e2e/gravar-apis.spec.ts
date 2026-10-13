import { Page, test } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { APIS, HAR, usarApisGravadas } from './apis';

/**
 * Regrava e2e/dados/apis.har com as respostas reais das APIs. Só roda com GRAVAR=1:
 * GRAVAR=1 npx playwright test gravar-apis --project=desktop
 * Depois, atualizar DATA_DA_GRAVACAO em apis.ts para o dia da gravação.
 */
test.skip(process.env['GRAVAR'] !== '1', 'só com GRAVAR=1');

/**
 * O HAR é salvo quando a página fecha; depois disso, os headers saem da gravação. Respostas das
 * APIs trazem cookies de balanceador e identificadores de infraestrutura que não precisam ir para
 * o git, e o replay só usa o corpo e o Content-Type.
 */
test.afterAll(() => {
  const har = JSON.parse(readFileSync(HAR, 'utf8'));
  for (const entrada of har.log.entries) {
    entrada.request.headers = [];
    entrada.request.cookies = [];
    entrada.response.cookies = [];
    entrada.response.headers = entrada.response.headers.filter(
      (h: { name: string }) => h.name.toLowerCase() === 'content-type',
    );
  }
  writeFileSync(HAR, JSON.stringify(har));
});

/**
 * Executa o passo e espera todas as consultas às APIs que ele disparou terminarem. Sem isso, o
 * passo seguinte cancela consultas em andamento e o HAR guarda respostas vazias.
 */
async function aguardarConsultas(page: Page, passo: () => Promise<unknown>): Promise<void> {
  let pendentes = 0;
  let iniciadas = 0;
  const inicio = (r: { url(): string }) => APIS.test(r.url()) && (pendentes++, iniciadas++);
  const fim = (r: { url(): string }) => APIS.test(r.url()) && pendentes--;
  page.on('request', inicio);
  page.on('requestfinished', fim);
  page.on('requestfailed', fim);
  await passo();
  await test.expect.poll(() => iniciadas > 0 && pendentes === 0, { timeout: 60_000 }).toBe(true);
  page.off('request', inicio);
  page.off('requestfinished', fim);
  page.off('requestfailed', fim);
}

test('grava as respostas de todos os painéis e períodos', async ({ page }) => {
  test.setTimeout(180_000);
  await usarApisGravadas(page, true);

  await aguardarConsultas(page, () => page.goto('/ibge'));
  await aguardarConsultas(page, () => page.goto('/bcb'));
  for (const periodo of ['1A', '5A']) {
    await aguardarConsultas(page, () => page.getByRole('radio', { name: periodo }).click());
  }
  await aguardarConsultas(page, () => page.goto('/ipea'));
});
