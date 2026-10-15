import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemePreference } from './theme-preference';

describe('ThemePreference', () => {
  let html: HTMLElement;

  beforeEach(() => {
    localStorage.removeItem('mirante.tema');
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    html = TestBed.inject(DOCUMENT).documentElement;
  });

  afterEach(() => {
    html.classList.remove('dark');
    localStorage.removeItem('mirante.tema');
  });

  it('começa seguindo o sistema quando não há preferência salva', () => {
    expect(TestBed.inject(ThemePreference).tema()).toBe('system');
  });

  it('aplica a classe dark e guarda a escolha', () => {
    const preferencia = TestBed.inject(ThemePreference);
    preferencia.definir('dark');
    TestBed.tick();
    expect(html.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('mirante.tema')).toBe('dark');
  });

  it('remove a classe dark no tema claro', () => {
    const preferencia = TestBed.inject(ThemePreference);
    preferencia.definir('light');
    TestBed.tick();
    expect(html.classList.contains('dark')).toBe(false);
  });
});
