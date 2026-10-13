import AxeBuilder from '@axe-core/playwright';
import { esperarDados, expect, test } from './apis';

test.describe('navegação e tema', () => {
  test('a raiz abre o painel do IBGE', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/ibge$/);
    await expect(page).toHaveTitle('IBGE · Mirante');
    await expect(page.getByRole('banner').getByRole('heading', { level: 1 })).toHaveText('IBGE');
  });

  test('o menu leva a cada painel e marca a página atual', async ({ page, isMobile }) => {
    await page.goto('/ibge');
    const destinos = [
      { link: 'Banco Central', url: /\/bcb$/, titulo: 'Banco Central' },
      { link: 'Ipeadata', url: /\/ipea$/, titulo: 'Ipeadata' },
      { link: 'Componentes', url: /\/ui$/, titulo: 'Componentes' },
      { link: 'IBGE', url: /\/ibge$/, titulo: 'IBGE' },
    ];
    const menu = page.getByRole('complementary', { name: 'Navegação principal' });
    for (const destino of destinos) {
      if (isMobile) {
        await page.getByRole('button', { name: 'Menu de navegação' }).click();
      }
      await menu.getByRole('link', { name: destino.link, exact: true }).click();
      await expect(page).toHaveURL(destino.url);
      await expect(page.getByRole('banner').getByRole('heading', { level: 1 })).toHaveText(destino.titulo);
      await expect(menu.getByRole('link', { name: destino.link, exact: true })).toHaveAttribute('aria-current', 'page');
    }
  });

  test('o tema escuro vale para a página toda e sobrevive ao recarregar', async ({ page }) => {
    await page.goto('/ibge');
    const html = page.locator('html');
    await page.getByRole('radio', { name: 'Tema escuro' }).click();
    await expect(html).toHaveClass(/\bdark\b/);
    await page.reload();
    await expect(html).toHaveClass(/\bdark\b/);
    await expect(page.getByRole('radio', { name: 'Tema escuro' })).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('radio', { name: 'Tema claro' }).click();
    await expect(html).not.toHaveClass(/\bdark\b/);
  });

  test('o tema do sistema segue a preferência do aparelho', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/ibge');
    await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/);
  });

  test('o atalho de teclado pula para o conteúdo', async ({ page }) => {
    await page.goto('/ibge');
    await esperarDados(page);
    await page.keyboard.press('Tab');
    const atalho = page.getByRole('link', { name: 'Pular para o conteúdo' });
    await expect(atalho).toBeFocused();
    await expect(atalho).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#conteudo$/);
  });

  test('rota desconhecida volta para o IBGE', async ({ page }) => {
    await page.goto('/nao-existe');
    await expect(page).toHaveURL(/\/ibge$/);
  });
});

test.describe('menu no celular', () => {
  test.skip(({ isMobile }) => !isMobile, 'só no celular');

  test('abre como gaveta e fecha pelo fundo', async ({ page }) => {
    await page.goto('/ibge');
    const abrir = page.getByRole('button', { name: 'Menu de navegação' });
    const menu = page.getByRole('complementary', { name: 'Navegação principal' });
    await expect(menu).not.toBeInViewport();
    await abrir.click();
    await expect(abrir).toHaveAttribute('aria-expanded', 'true');
    await expect(menu).toBeInViewport();
    await page.getByRole('button', { name: 'Fechar menu' }).click({ position: { x: 340, y: 400 } });
    await expect(abrir).toHaveAttribute('aria-expanded', 'false');
    await expect(menu).not.toBeInViewport();
  });
});

test.describe('menu no desktop', () => {
  test.skip(({ isMobile }) => !!isMobile, 'só no desktop');

  test('a barra lateral cabe na altura de um notebook sem rolar', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/ibge');
    const rola = await page
      .getByRole('complementary', { name: 'Navegação principal' })
      .locator('nav')
      .evaluate((nav) => nav.scrollHeight > nav.clientHeight);
    expect(rola).toBe(false);
  });

  test('o menu recolhe a barra em ícones, com nome e dica em cada link, e expande de volta', async ({ page }) => {
    await page.goto('/ibge');
    await esperarDados(page);
    const menuBotao = page.getByRole('button', { name: 'Menu de navegação' });
    const barra = page.getByRole('complementary', { name: 'Navegação principal' });
    await expect(menuBotao).toHaveAttribute('aria-expanded', 'true');
    const larguraAberta = (await barra.boundingBox())!.width;

    await menuBotao.click();
    await expect(menuBotao).toHaveAttribute('aria-expanded', 'false');
    await expect.poll(async () => (await barra.boundingBox())!.width).toBeLessThan(larguraAberta / 2);
    const bcb = barra.getByRole('link', { name: 'Banco Central', exact: true });
    await expect(bcb).toHaveAttribute('title', 'Banco Central');
    const resultado = await new AxeBuilder({ page }).include('aside').withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze();
    expect(resultado.violations.map((v) => v.id)).toEqual([]);
    await bcb.click();
    await expect(page).toHaveURL(/\/bcb$/);

    await menuBotao.click();
    await expect.poll(async () => (await barra.boundingBox())!.width).toBe(larguraAberta);
  });
});
