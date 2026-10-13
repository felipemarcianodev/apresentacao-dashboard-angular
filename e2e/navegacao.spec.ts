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
        await page.getByRole('button', { name: 'Abrir menu' }).click();
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
    const abrir = page.getByRole('button', { name: 'Abrir menu' });
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
