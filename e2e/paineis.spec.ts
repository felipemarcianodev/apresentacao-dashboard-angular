import { APIS, esperarDados, expect, test } from './apis';

/** Os números esperados são os da gravação de 13/10/2026 (e2e/dados/apis.har). */
test.describe('painel do IBGE', () => {
  test('mostra os indicadores nacionais com a fonte', async ({ page }) => {
    await page.goto('/ibge');
    await esperarDados(page);
    const kpis = page.getByRole('region', { name: 'Indicadores principais' });
    await expect(kpis.locator('mi-kpi-card')).toHaveCount(4);
    await expect(kpis).toContainText('214,2 mi');
    await expect(kpis).toContainText('5,4%');
    await expect(page.getByRole('heading', { level: 2, name: 'Brasil em números' })).toBeVisible();
    await expect(page.getByText(/Fonte:/).first()).toBeVisible();
  });

  test('filtra pela UF da lista e guarda na URL', async ({ page }) => {
    await page.goto('/ibge');
    await esperarDados(page);
    await page.getByLabel('Localidade').selectOption({ label: 'Rio de Janeiro' });
    await expect(page).toHaveURL(/\?uf=RJ$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Rio de Janeiro em números' })).toBeVisible();
    await expect(page.getByText('Sudeste', { exact: true })).toBeVisible();
  });

  test('abre direto pela UF na URL e ignora UF inválida', async ({ page }) => {
    await page.goto('/ibge?uf=BA');
    await expect(page.getByRole('heading', { level: 2, name: 'Bahia em números' })).toBeVisible();
    await expect(page.getByLabel('Localidade')).toHaveValue('BA');
    await page.goto('/ibge?uf=<script>');
    await expect(page.getByRole('heading', { level: 2, name: 'Brasil em números' })).toBeVisible();
  });

  test('seleciona a UF pelo mapa', async ({ page }) => {
    await page.goto('/ibge');
    await esperarDados(page);
    await page.getByRole('button', { name: /^Minas Gerais:/ }).click();
    await expect(page).toHaveURL(/\?uf=MG$/);
    await expect(page.getByRole('heading', { level: 2, name: 'Minas Gerais em números' })).toBeVisible();
  });

  test('ordena a tabela das UFs e exporta CSV', async ({ page, isMobile }) => {
    test.skip(isMobile, 'no celular a tabela vira cartões');
    await page.goto('/ibge');
    await esperarDados(page);
    const tabela = page.getByRole('table', { name: 'Indicadores do IBGE por unidade da federação' });
    await tabela.getByRole('button', { name: /População/ }).click();
    await expect(tabela.getByRole('columnheader', { name: /População/ })).toHaveAttribute('aria-sort', /ascending|descending/);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: /CSV/ }).first().click();
    expect((await download).suggestedFilename()).toMatch(/^ibge-indicadores-por-uf.*\.csv$/);
  });

  test('API fora do ar mostra o erro e recupera com Tentar de novo', async ({ page }) => {
    await page.route(/servicodados\.ibge\.gov\.br/, (rota) => rota.fulfill({ status: 503, body: 'fora' }));
    await page.goto('/ibge');
    const tentar = page.getByRole('button', { name: 'Tentar de novo' });
    await expect(tentar.first()).toBeVisible();
    await expect(page.locator('main')).not.toContainText('503');
    await page.unroute(/servicodados\.ibge\.gov\.br/);
    // Cada clique recarrega um recurso e tira da tela todos os botões dele (KPI, gráfico, mapa),
    // então o próximo botão pode sumir entre a contagem e o clique.
    while ((await tentar.count()) > 0) {
      await tentar.first().click({ timeout: 2_000 }).catch(() => undefined);
    }
    await esperarDados(page);
    await expect(page.getByRole('region', { name: 'Indicadores principais' })).toContainText('214,2 mi');
  });
});

test.describe('painel do Banco Central', () => {
  test('mostra Selic e dólar e refaz as consultas ao trocar o período', async ({ page }) => {
    await page.goto('/bcb');
    await esperarDados(page);
    const kpis = page.getByRole('region', { name: 'Indicadores principais' });
    await expect(kpis).toContainText('13,75%');
    await expect(kpis).toContainText('R$ 4,99');
    const consultas: string[] = [];
    page.on('request', (r) => APIS.test(r.url()) && consultas.push(r.url()));
    await page.getByRole('radio', { name: '5A' }).click();
    await expect(page.getByRole('radio', { name: '5A' })).toHaveAttribute('aria-checked', 'true');
    await expect.poll(() => consultas.filter((u) => u.includes('dataInicial=01/10/2021')).length).toBe(6);
    await esperarDados(page);
  });
});

test.describe('painel do Ipeadata', () => {
  test('mostra as séries longas e recorta o período sem nova consulta', async ({ page }) => {
    await page.goto('/ipea');
    await esperarDados(page);
    const kpis = page.getByRole('region', { name: 'Indicadores principais' });
    await expect(kpis).toContainText('R$ 1.621,00');
    await expect(kpis).toContainText('51,13');
    const consultas: string[] = [];
    page.on('request', (r) => APIS.test(r.url()) && consultas.push(r.url()));
    await page.getByRole('radio', { name: 'Tudo' }).click();
    await expect(page.getByRole('radio', { name: 'Tudo' })).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('main')).toContainText('1940');
    expect(consultas).toEqual([]);
  });
});
