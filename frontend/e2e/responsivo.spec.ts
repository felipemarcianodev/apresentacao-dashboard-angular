import { ROTAS, esperarDados, expect, test } from './apis';

/**
 * Nada pode passar da largura da tela: nem a página, nem um elemento dentro de card. No celular
 * (360 px), é o portão que os unitários não alcançam.
 */
for (const rota of ROTAS) {
  test(`${rota} cabe na largura da tela`, async ({ page }) => {
    await page.goto(rota);
    await esperarDados(page);
    const larguras = await page.evaluate(() => ({
      pagina: document.documentElement.scrollWidth,
      tela: document.documentElement.clientWidth,
    }));
    expect(larguras.pagina).toBeLessThanOrEqual(larguras.tela);

    const vazados = await page.locator('main svg, main table, main mi-kpi-card').evaluateAll((elementos) =>
      elementos
        .filter((el) => !el.closest('.overflow-x-auto, .sr-only'))
        .filter((el) => {
          const caixa = el.getBoundingClientRect();
          return caixa.width > 0 && caixa.right > document.documentElement.clientWidth + 1;
        })
        .map((el) => el.tagName.toLowerCase() + (el.getAttribute('aria-label') ? ` ${el.getAttribute('aria-label')}` : '')),
    );
    expect(vazados).toEqual([]);
  });
}
