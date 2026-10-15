import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CATALOGO } from '../catalogo';
import { PaginaPersona } from './pagina-persona';

describe('PaginaPersona', () => {
  async function montar(persona: string) {
    TestBed.configureTestingModule({
      imports: [PaginaPersona],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(PaginaPersona);
    fixture.componentRef.setInput('persona', persona);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('mostra os cenários da persona agrupados por área, na ordem das áreas', async () => {
    const html = await montar('celular');
    expect(html.querySelector('h2')!.textContent).toContain('No celular');
    const areas = [...html.querySelectorAll('h2[id^="area-"]')].map((h) => h.firstChild!.textContent!.trim());
    expect(areas[0]).toBe('Navegação e tema');
    const total = CATALOGO.filter((c) => c.personas.includes('celular')).length;
    expect(html.querySelectorAll('section ul > li').length).toBe(total);
  });

  it('dá o comando para rodar só a persona', async () => {
    const html = await montar('teclado');
    expect(html.querySelector('pre')!.textContent).toContain('npx playwright test --grep @teclado');
  });

  it('o link do código abre fora, sem dar acesso à janela de origem', async () => {
    const html = await montar('mantenedor');
    const link = html.querySelector<HTMLAnchorElement>('a[target="_blank"]')!;
    expect(link.rel).toBe('noopener noreferrer');
    expect(link.href).toMatch(/\/blob\/v[\d.]+\/frontend\/e2e\/[\w-]+\.spec\.ts#L\d+$/);
  });

  it('persona desconhecida mostra o estado vazio com volta ao índice', async () => {
    const html = await montar('nao-existe');
    expect(html.textContent).toContain('Persona não encontrada');
    expect(html.querySelector('a')!.getAttribute('href')).toBe('/testes');
  });
});
