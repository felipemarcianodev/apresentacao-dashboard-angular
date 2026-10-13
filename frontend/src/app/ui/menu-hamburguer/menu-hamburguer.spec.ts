import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MenuHamburguer } from './menu-hamburguer';

@Component({
  imports: [MenuHamburguer],
  template: `<button miMenuHamburguer class="ml-2" controla="painel" [aberto]="aberto()" (click)="aberto.set(!aberto())"></button>
    <nav id="painel">menu</nav>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Hospedeiro {
  readonly aberto = signal(false);
}

@Component({
  imports: [MenuHamburguer],
  template: `<button miMenuHamburguer aberto [virarX]="false"></button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class HospedeiroSemX {}

describe('MenuHamburguer', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  async function montar() {
    const fixture = TestBed.createComponent(Hospedeiro);
    await fixture.whenStable();
    const botao = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    return { fixture, botao };
  }

  it('é um botão comum com nome acessível e o elemento que controla', async () => {
    const { botao } = await montar();
    expect(botao.type).toBe('button');
    expect(botao.getAttribute('aria-label')).toBe('Menu');
    expect(botao.getAttribute('aria-controls')).toBe('painel');
    expect(botao.classList).toContain('ml-2');
  });

  it('reflete o estado em aria-expanded a cada clique, sem trocar o nome', async () => {
    const { fixture, botao } = await montar();
    expect(botao.getAttribute('aria-expanded')).toBe('false');
    botao.click();
    await fixture.whenStable();
    expect(botao.getAttribute('aria-expanded')).toBe('true');
    expect(botao.getAttribute('aria-label')).toBe('Menu');
    botao.click();
    await fixture.whenStable();
    expect(botao.getAttribute('aria-expanded')).toBe('false');
  });

  it('desenha o X quando aberto e esconde o desenho do leitor de tela', async () => {
    const { fixture, botao } = await montar();
    const barras = () => Array.from(botao.querySelectorAll('span > span'));
    expect(barras()[1].classList).not.toContain('opacity-0');
    botao.click();
    await fixture.whenStable();
    expect(barras()[0].classList).toContain('rotate-45');
    expect(barras()[1].classList).toContain('opacity-0');
    expect(barras()[2].classList).toContain('-rotate-45');
    expect(botao.firstElementChild!.getAttribute('aria-hidden')).toBe('true');
  });

  it('com virarX desligado, mantém as barras e só muda o aria-expanded', async () => {
    const fixture = TestBed.createComponent(HospedeiroSemX);
    await fixture.whenStable();
    const botao = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    expect(botao.getAttribute('aria-expanded')).toBe('true');
    expect(botao.querySelectorAll('span > span')[0].classList).not.toContain('rotate-45');
  });
});
