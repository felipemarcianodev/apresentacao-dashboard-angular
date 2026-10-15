import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MALHA_DE_TESTE } from '../charts/mapa-uf/malha-de-teste';
import { URL_MALHA_UF } from '../charts/mapa-uf/mapa-uf';
import { DOCS } from './docs';
import { PaginaComponente } from './pagina-componente/pagina-componente';

describe('Documentação dos componentes', () => {
  it('tem slugs únicos', () => {
    const slugs = DOCS.map((doc) => doc.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('documenta importação, ao menos um exemplo e acessibilidade em cada componente', () => {
    for (const doc of DOCS) {
      expect(doc.importacao, doc.slug).toContain('import');
      expect(doc.exemplos.length, doc.slug).toBeGreaterThan(0);
      expect(doc.acessibilidade.length, doc.slug).toBeGreaterThan(0);
    }
  });

  describe('PaginaComponente', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      });
    });

    it('renderiza todos os exemplos de cada componente sem erro', async () => {
      for (const doc of DOCS) {
        const fixture = TestBed.createComponent(PaginaComponente);
        fixture.componentRef.setInput('slug', doc.slug);
        TestBed.tick();
        TestBed.inject(HttpTestingController)
          .match(URL_MALHA_UF)
          .forEach((requisicao) => requisicao.flush(MALHA_DE_TESTE));
        await fixture.whenStable();
        const html = fixture.nativeElement as HTMLElement;
        expect(html.querySelector('h2')?.textContent, doc.slug).toContain(doc.nome);
        expect(html.querySelectorAll('pre').length, doc.slug).toBe(doc.exemplos.length + 1);
        fixture.destroy();
      }
    });

    it('mostra o estado vazio para um slug desconhecido', async () => {
      const fixture = TestBed.createComponent(PaginaComponente);
      fixture.componentRef.setInput('slug', 'nao-existe');
      await fixture.whenStable();
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Componente não encontrado');
    });
  });
});
