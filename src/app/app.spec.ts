import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();
  });

  it('monta o shell com a marca e a navegação dos painéis', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Mirante');
    const rotulos = Array.from(html.querySelectorAll('nav a')).map((a) => a.textContent?.trim());
    expect(rotulos).toEqual(['IBGE', 'Banco Central', 'Ipeadata', 'Componentes']);
  });
});
