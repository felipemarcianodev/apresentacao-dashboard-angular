import { defineConfig, devices } from '@playwright/test';

/**
 * E2E do Mirante. As APIs públicas são respondidas por gravações em e2e/dados (HAR), então a
 * suíte não depende da rede nem do dia. Para regravar: GRAVAR=1 npx playwright test.
 *
 * Com E2E_BASE_URL (ex.: http://localhost:8092, o container do docker/), a suíte roda contra a
 * imagem de produção, com a CSP e os headers do nginx, sem subir o ng serve.
 */
const BASE_URL = process.env['E2E_BASE_URL'] || 'http://localhost:4300';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'line' : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    // Teste local do nginx de borda (docker/borda) com certificado provisório.
    ignoreHTTPSErrors: BASE_URL.startsWith('https://localhost'),
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } } },
    {
      name: 'celular',
      use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true },
    },
  ],
  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'npx ng serve --port 4300',
        url: BASE_URL,
        reuseExistingServer: !process.env['CI'],
        timeout: 180_000,
      },
});
