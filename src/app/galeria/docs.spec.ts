import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DOCS } from './docs';
import { PaginaComponente } from './pagina-componente/pagina-componente';

describe('Documentação dos componentes', () => {
  it('tem slugs únicos', () => {
    const slugs = DOCS.map((doc) => doc.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('documenta importação, ao menos um exemplo e acessibilidade em cada componente', () => {
    for (const doc of DOCS) {
      expect(doc.importacao).withContext(doc.slug).toContain('import');
      expect(doc.exemplos.length).withContext(doc.slug).toBeGreaterThan(0);
      expect(doc.acessibilidade.length).withContext(doc.slug).toBeGreaterThan(0);
    }
  });

  describe('PaginaComponente', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [provideZonelessChangeDetection(), provideRouter([])],
      });
    });

    it('renderiza todos os exemplos de cada componente sem erro', async () => {
      for (const doc of DOCS) {
        const fixture = TestBed.createComponent(PaginaComponente);
        fixture.componentRef.setInput('slug', doc.slug);
        await fixture.whenStable();
        const html = fixture.nativeElement as HTMLElement;
        expect(html.querySelector('h2')?.textContent).withContext(doc.slug).toContain(doc.nome);
        expect(html.querySelectorAll('pre').length).withContext(doc.slug).toBe(doc.exemplos.length + 1);
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
