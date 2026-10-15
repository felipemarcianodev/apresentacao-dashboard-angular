import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ComoRodar } from './como-rodar';

describe('ComoRodar', () => {
  it('lista os passos com o comando de cada um, como texto', async () => {
    TestBed.configureTestingModule({
      imports: [ComoRodar],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(ComoRodar);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelectorAll('ol > li').length).toBe(6);
    expect(html.querySelectorAll('pre').length).toBe(6);
    expect(html.textContent).toContain('npm run testes:catalogo');
    expect(html.textContent).toContain('npx playwright test --grep @celular');
  });
});
