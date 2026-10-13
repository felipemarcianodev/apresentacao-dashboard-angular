import { Page, test as base, expect } from '@playwright/test';

/** Data em que as respostas de e2e/dados/apis.har foram gravadas; as URLs do SGS dependem dela. */
export const DATA_DA_GRAVACAO = new Date('2026-10-13T12:00:00-03:00');

/** Hosts das três APIs de dados. Qualquer outro host externo é bloqueado. */
export const APIS = /^https:\/\/(servicodados\.ibge\.gov\.br|api\.bcb\.gov\.br|www\.ipeadata\.gov\.br)\//;

export const HAR = 'e2e/dados/apis.har';

/** Origem da aplicação: ng serve local ou o container de produção (E2E_BASE_URL). */
export const ORIGEM = new URL(process.env['E2E_BASE_URL'] || 'http://localhost:4300').origin;

/**
 * Fixa o relógio e responde as APIs com a gravação. Com `gravar`, consulta as APIs de verdade e
 * salva as respostas (só a suíte gravar-apis.spec.ts usa, com GRAVAR=1).
 */
export async function usarApisGravadas(page: Page, gravar = false): Promise<void> {
  await page.clock.setFixedTime(DATA_DA_GRAVACAO);
  await page.routeFromHAR(HAR, { url: APIS, update: gravar, updateContent: 'embed', notFound: 'abort' });
  await page.route(
    (url) => url.origin !== ORIGEM && !APIS.test(url.href),
    (rota) => rota.abort(),
  );
}

/**
 * `test` do Mirante: toda página já vem com as APIs gravadas e o teste falha se o console
 * registrar erro (exceção não tratada derruba a tela sem aviso).
 */
export const test = base.extend<{ errosDoConsole: string[] }>({
  errosDoConsole: [
    async ({ page }, usar) => {
      const erros: string[] = [];
      page.on('pageerror', (erro) => erros.push(erro.message));
      page.on('console', (msg) => {
        // Falha de rede simulada pelo teste é registrada pelo próprio Chrome, não pela aplicação.
        if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) erros.push(msg.text());
      });
      await usarApisGravadas(page);
      await usar(erros);
      expect(erros, 'erros no console').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Rotas principais, usadas pelas suítes de acessibilidade e responsividade. */
export const ROTAS = ['/ibge', '/bcb', '/ipea', '/ui', '/ui/line-chart', '/ui/data-table'] as const;

/** Espera os dados chegarem: nenhum skeleton no painel. */
export async function esperarDados(page: Page): Promise<void> {
  await expect(page.locator('main mi-skeleton')).toHaveCount(0, { timeout: 15_000 });
}
