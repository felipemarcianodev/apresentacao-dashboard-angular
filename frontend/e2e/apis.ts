import { Page, test as base, expect } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

/** Data em que as respostas de e2e/dados/apis.har foram gravadas; as URLs do SGS dependem dela. */
export const DATA_DA_GRAVACAO = new Date('2026-10-13T12:00:00-03:00');

/** Origem da aplicação: ng serve local ou o container de produção (E2E_BASE_URL). */
export const ORIGEM = new URL(process.env['E2E_BASE_URL'] || 'http://localhost:4300').origin;

/** Consultas do site à API do Mirante, que responde pelas três fontes nos mesmos caminhos. */
export const API = /\/api\/(ibge|bcb|ipea)\//;

/**
 * O HAR guarda os endereços das fontes oficiais (independe de onde o site roda). Cada par liga o
 * prefixo da fonte ao prefixo da API do Mirante que responde por ela.
 */
const PREFIXOS: readonly (readonly [fonte: string, api: string])[] = [
  ['https://servicodados.ibge.gov.br/api/v3/agregados', '/api/ibge/agregados'],
  ['https://api.bcb.gov.br/dados/serie', '/api/bcb/serie'],
  ['https://www.ipeadata.gov.br/api/odata4', '/api/ipea/odata4'],
];

export const HAR = 'e2e/dados/apis.har';

/** O HAR com os endereços já na API da origem testada (gerado a cada execução, fora do git). */
// Um arquivo por processo: os workers do Playwright rodam em paralelo.
const HAR_NA_ORIGEM = `test-results/apis-${new URL(ORIGEM).port || 'padrao'}-${process.pid}.har`;

function trocarPrefixo(url: string, de: 0 | 1): string {
  for (const par of PREFIXOS) {
    const origem = de === 0 ? par[0] : ORIGEM + par[1];
    const destino = de === 0 ? ORIGEM + par[1] : par[0];
    if (url.startsWith(origem)) {
      return destino + url.slice(origem.length);
    }
  }
  return url;
}

/** Endereço da fonte oficial para o endereço da API do Mirante na origem testada. */
export const paraApi = (url: string) => trocarPrefixo(url, 0);

/** O caminho inverso, usado ao regravar o HAR. */
export const paraFonte = (url: string) => trocarPrefixo(url, 1);

function prepararHar(): string {
  const har = JSON.parse(readFileSync(HAR, 'utf8'));
  for (const entrada of har.log.entries) {
    entrada.request.url = paraApi(entrada.request.url);
  }
  mkdirSync('test-results', { recursive: true });
  writeFileSync(HAR_NA_ORIGEM, JSON.stringify(har));
  return HAR_NA_ORIGEM;
}

/**
 * Fixa o relógio e responde a API com a gravação; qualquer endereço fora da origem é bloqueado.
 * Com `gravar`, as consultas vão de verdade à API do Mirante (E2E_BASE_URL com o compose de pé)
 * e as respostas são salvas (só a suíte gravar-apis.spec.ts usa, com GRAVAR=1).
 */
export async function usarApisGravadas(page: Page, gravar = false): Promise<void> {
  await page.clock.setFixedTime(DATA_DA_GRAVACAO);
  const har = gravar ? HAR_NA_ORIGEM : prepararHar();
  await page.routeFromHAR(har, { url: API, update: gravar, updateContent: 'embed', notFound: 'abort' });
  await page.route(
    (url) => url.origin !== ORIGEM,
    (rota) => rota.abort(),
  );
}

/** Depois de gravar: volta os endereços para as fontes e guarda em e2e/dados/apis.har. */
export function salvarGravacao(transformar: (har: { log: { entries: unknown[] } }) => void): void {
  const har = JSON.parse(readFileSync(HAR_NA_ORIGEM, 'utf8'));
  for (const entrada of har.log.entries) {
    entrada.request.url = paraFonte(entrada.request.url);
  }
  transformar(har);
  writeFileSync(HAR, JSON.stringify(har));
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
export const ROTAS = [
  '/ibge',
  '/bcb',
  '/ipea',
  '/ui',
  '/ui/line-chart',
  '/ui/data-table',
  '/testes',
  '/testes/celular',
  '/testes/como-rodar',
] as const;

/** Espera os dados chegarem: nenhum skeleton no painel. */
export async function esperarDados(page: Page): Promise<void> {
  await expect(page.locator('main mi-skeleton')).toHaveCount(0, { timeout: 15_000 });
}
