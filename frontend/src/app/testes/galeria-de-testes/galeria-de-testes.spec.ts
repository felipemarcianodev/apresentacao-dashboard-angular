import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AREAS } from '../areas';
import { CATALOGO } from '../catalogo';
import { CATEGORIAS_PERSONA, PERSONAS } from '../personas';
import { GaleriaDeTestes } from './galeria-de-testes';

describe('GaleriaDeTestes', () => {
  async function montar() {
    TestBed.configureTestingModule({
      imports: [GaleriaDeTestes],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(GaleriaDeTestes);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('lista as personas por categoria, cada uma com link para a própria página', async () => {
    const html = await montar();
    const categorias = [...html.querySelectorAll('h2[id^="categoria-"]')].map((h) => h.textContent!.trim());
    expect(categorias).toEqual([...CATEGORIAS_PERSONA]);
    const links = [...html.querySelectorAll<HTMLAnchorElement>('ul a')].map((a) => a.getAttribute('href'));
    expect(links).toEqual(PERSONAS.map((p) => `/${p.id}`));
  });

  it('mostra quantos cenários cada persona tem', async () => {
    const html = await montar();
    const celular = CATALOGO.filter((c) => c.personas.includes('celular')).length;
    expect(html.textContent).toContain(`@celular · ${celular} cenários`);
    expect(html.textContent).toContain(`São ${CATALOGO.length} cenários`);
  });

  it('todo cenário do catálogo tem persona conhecida e arquivo com área', () => {
    const ids = PERSONAS.map((p) => p.id as string);
    for (const cenario of CATALOGO) {
      expect(cenario.personas.length, cenario.titulo).toBeGreaterThan(0);
      for (const persona of cenario.personas) expect(ids, cenario.titulo).toContain(persona);
      expect(Object.keys(AREAS), cenario.arquivo).toContain(cenario.arquivo);
    }
  });

  it('toda persona tem ao menos um cenário', () => {
    for (const persona of PERSONAS) {
      expect(CATALOGO.some((c) => c.personas.includes(persona.id)), persona.id).toBe(true);
    }
  });
});
