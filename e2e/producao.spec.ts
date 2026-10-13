import { expect, test } from './apis';

/**
 * Só contra a imagem de produção (E2E_BASE_URL): headers do nginx e CSP. Violação de CSP aparece
 * como erro no console, e o fixture de apis.ts já reprova o teste nesse caso em toda a suíte.
 */
test.skip(!process.env['E2E_BASE_URL'], 'só contra o container (E2E_BASE_URL)');

test('o nginx entrega CSP, headers de segurança e cache certo', async ({ request }) => {
  const pagina = await request.get('/ipea');
  expect(pagina.status()).toBe(200);
  const h = pagina.headers();
  expect(h['content-security-policy']).toContain("script-src 'self';");
  // O navegador só fala com a própria origem: as fontes oficiais são consultadas pela API do Mirante.
  expect(h['content-security-policy']).toContain("connect-src 'self';");
  expect(h['content-security-policy']).not.toContain('unsafe-inline');
  expect(h['x-content-type-options']).toBe('nosniff');
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['cache-control']).toBe('no-cache');
  expect(h['server']).toBe('nginx');

  const html = await pagina.text();
  const script = /src="(main-[A-Z0-9]{8}\.js)"/.exec(html)![1];
  const js = await request.get(`/${script}`);
  expect(js.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  expect(js.headers()['content-security-policy']).toBeTruthy();

  expect((await request.get('/theme-init.js')).headers()['cache-control']).toBe('no-cache');
  const inexistente = await request.get('/arquivo-que-nao-existe-ABCDEFGH.js');
  expect(inexistente.status()).toBe(404);
  expect(inexistente.headers()['cache-control'] ?? '').not.toContain('immutable');
  expect(await (await request.get('/health')).text()).toBe('ok');
});

test('a página carrega inteira sob a CSP, sem violação', async ({ page }) => {
  const violacoes: string[] = [];
  page.on('console', (msg) => msg.text().includes('Content Security Policy') && violacoes.push(msg.text()));
  await page.goto('/ibge');
  await expect(page.getByRole('region', { name: 'Indicadores principais' }).locator('mi-kpi-card')).toHaveCount(4);
  const fonte = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(fonte).toContain('Inter');
  expect(violacoes).toEqual([]);
});
