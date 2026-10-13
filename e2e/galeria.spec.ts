import { expect, test } from './apis';

test.describe('galeria /ui', () => {
  test('cada componente do índice abre a própria página sem erro', async ({ page }) => {
    await page.goto('/ui');
    const links = page.locator('main a[href^="/ui/"]');
    const caminhos = await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
    expect(caminhos.length).toBe(13);
    for (const caminho of caminhos) {
      await page.goto(caminho);
      const nome = page.getByRole('heading', { level: 2 }).first();
      await expect(nome).toBeVisible();
      await expect(page).toHaveTitle(`${(await nome.textContent())!.trim()} · Mirante`);
      await expect(page.getByRole('table').first()).toBeVisible();
    }
  });

  test('slug desconhecido mostra estado vazio com volta ao índice', async ({ page }) => {
    await page.goto('/ui/nao-existe');
    await expect(page.getByRole('link', { name: /componentes/i }).last()).toBeVisible();
  });

  test('o botão de copiar copia o código do exemplo', async ({ page, context, isMobile }) => {
    test.skip(isMobile, 'área de transferência só no desktop');
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/ui/button');
    await page.getByRole('button', { name: /Copiar/ }).nth(1).click();
    const copiado = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiado).toContain('miButton');
  });
});
