import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Shell } from './shell';

@Component({ template: '' })
class PaginaVazia {}

describe('Shell', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: 'ibge', component: PaginaVazia, data: { titulo: 'IBGE' } },
          { path: 'bcb', component: PaginaVazia, data: { titulo: 'Banco Central' } },
        ]),
      ],
    });
  });

  function montar() {
    const fixture = TestBed.createComponent(Shell);
    const html = fixture.nativeElement as HTMLElement;
    const botaoMenu = () => html.querySelector<HTMLButtonElement>('[aria-controls="menu-lateral"]')!;
    return { fixture, html, botaoMenu, router: TestBed.inject(Router) };
  }

  it('mostra o título da rota na barra superior', async () => {
    const { fixture, html, router } = montar();
    await router.navigateByUrl('/bcb');
    await fixture.whenStable();
    expect(html.querySelector('h1')!.textContent!.trim()).toBe('Banco Central');
  });

  it('não fecha o menu aberto antes de a navegação inicial terminar', async () => {
    const { fixture, botaoMenu, router } = montar();
    await fixture.whenStable();
    botaoMenu().click();
    // Primeira navegação do app (id 1), terminando com o menu já aberto.
    await router.navigateByUrl('/ibge');
    await fixture.whenStable();
    expect(router.navigated).toBeTrue();
    expect(botaoMenu().getAttribute('aria-expanded')).toBe('true');
  });

  it('fecha o menu quando a pessoa navega depois', async () => {
    const { fixture, botaoMenu, router } = montar();
    await router.navigateByUrl('/ibge');
    await fixture.whenStable();
    botaoMenu().click();
    await fixture.whenStable();
    expect(botaoMenu().getAttribute('aria-expanded')).toBe('true');
    await router.navigateByUrl('/bcb');
    await fixture.whenStable();
    expect(botaoMenu().getAttribute('aria-expanded')).toBe('false');
  });
});
