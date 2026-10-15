import AxeBuilder from '@axe-core/playwright';
import { ROTAS, esperarDados, expect, test } from './apis';

/** WCAG 2.2 níveis A e AA nos dois temas, com os dados já carregados. */
for (const tema of ['light', 'dark'] as const) {
  test.describe(`acessibilidade no tema ${tema === 'light' ? 'claro' : 'escuro'}`, () => {
    test.use({ colorScheme: tema });
    const tag = tema === 'dark' ? ['@leitor-de-tela', '@tema-escuro'] : ['@leitor-de-tela'];

    for (const rota of ROTAS) {
      test(`${rota} sem violações do axe`, { tag }, async ({ page }) => {
        await page.goto(rota);
        await esperarDados(page);
        const resultado = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const resumo = resultado.violations.map(
          (v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 5).join(' | ')}`,
        );
        expect(resumo).toEqual([]);
      });
    }
  });
}

/** Regra do projeto: alvo de toque de no mínimo 40 px (o mapa tem a lista de UFs como alternativa). */
for (const rota of ROTAS) {
  test(`${rota} com alvos de toque de 40 px`, { tag: ['@celular'] }, async ({ page }) => {
    await page.goto(rota);
    await esperarDados(page);
    const pequenos = await page
      .locator('button:visible, [role="radio"]:visible, select:visible, input:visible')
      .evaluateAll((alvos) =>
        alvos
          .filter((el) => !el.closest('svg'))
          .map((el) => ({ el, caixa: el.getBoundingClientRect() }))
          .filter(({ caixa }) => caixa.width > 0 && (caixa.height < 39.5 || caixa.width < 39.5))
          .map(({ el, caixa }) => `${el.getAttribute('aria-label') ?? el.textContent?.trim()} (${Math.round(caixa.width)}x${Math.round(caixa.height)})`),
      );
    expect(pequenos).toEqual([]);
  });
}
