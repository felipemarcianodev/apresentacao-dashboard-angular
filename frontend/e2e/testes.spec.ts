import { expect, test } from './apis';

test.describe('galeria /testes', () => {
  test('o índice lista as personas por categoria e abre cada uma', { tag: ['@desenvolvedor'] }, async ({ page }) => {
    await page.goto('/testes');
    await expect(page).toHaveTitle('Testes · Mirante');
    await expect(page.getByRole('heading', { level: 2, name: 'Testes por persona' })).toBeVisible();
    for (const categoria of ['Quem usa o site', 'Situações', 'Quem constrói']) {
      await expect(page.getByRole('heading', { level: 2, name: categoria })).toBeVisible();
    }
    const personas = page.locator('main a[href^="/testes/"]').filter({ hasText: 'cenários' });
    await expect(personas).toHaveCount(9);

    await page.getByRole('link', { name: /Só com teclado/ }).click();
    await expect(page).toHaveURL(/\/testes\/teclado$/);
    await expect(page).toHaveTitle('Só com teclado · Testes · Mirante');
    await expect(page.getByRole('banner').getByRole('heading', { level: 1 })).toHaveText('Testes');
    await expect(page.getByRole('heading', { level: 2, name: /Navegação e tema/ })).toBeVisible();
  });

  const link = { tag: ['@desenvolvedor', '@link-compartilhado'] };
  test('a página da persona abre direto pelo link e aponta o código de cada cenário', link, async ({ page }) => {
    await page.goto('/testes/celular');
    await expect(page.getByRole('heading', { level: 2, name: 'No celular' })).toBeVisible();
    await expect(page.getByText('npx playwright test --grep @celular')).toBeVisible();
    const codigo = page.getByRole('link', { name: /linha \d+ de responsivo\.spec\.ts/ }).first();
    const fonte = /github\.com\/.+\/blob\/v[\d.]+\/frontend\/e2e\/responsivo\.spec\.ts#L\d+$/;
    await expect(codigo).toHaveAttribute('href', fonte);
    await expect(codigo).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('persona desconhecida mostra estado vazio com volta', { tag: ['@link-compartilhado'] }, async ({ page }) => {
    await page.goto('/testes/nao-existe');
    await expect(page.getByText('Persona não encontrada')).toBeVisible();
    await page.getByRole('link', { name: 'Ver todas as personas' }).click();
    await expect(page).toHaveURL(/\/testes$/);
  });

  test('"Como rodar" mostra os comandos e volta', { tag: ['@desenvolvedor'] }, async ({ page }) => {
    await page.goto('/testes');
    await page.getByRole('link', { name: 'Como rodar os testes' }).click();
    await expect(page).toHaveURL(/\/testes\/como-rodar$/);
    await expect(page).toHaveTitle('Como rodar os testes · Mirante');
    await expect(page.getByText('npm run testes:catalogo')).toBeVisible();
    await page.getByRole('link', { name: 'Voltar aos testes por persona' }).click();
    await expect(page).toHaveURL(/\/testes$/);
  });
});
