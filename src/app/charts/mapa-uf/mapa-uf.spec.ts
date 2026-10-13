import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MALHA_DE_TESTE } from './malha-de-teste';
import { MapaUf, URL_MALHA_UF } from './mapa-uf';

describe('MapaUf', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function montar() {
    const fixture = TestBed.createComponent(MapaUf);
    fixture.componentRef.setInput('rotulo', 'População por UF');
    fixture.componentRef.setInput('valores', [
      { sigla: 'SP', valor: 46000000 },
      { sigla: 'RJ', valor: null },
    ]);
    TestBed.tick();
    TestBed.inject(HttpTestingController).expectOne(URL_MALHA_UF).flush(MALHA_DE_TESTE);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    return { fixture, html, caminhos: Array.from(html.querySelectorAll<SVGPathElement>('path')) };
  }

  it('desenha uma UF por feição, com nome e valor acessíveis', async () => {
    const { caminhos } = await montar();
    expect(caminhos.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Rio de Janeiro: sem dado',
      'São Paulo: 46.000.000',
    ]);
  });

  it('pinta UF sem dado com a cor neutra', async () => {
    const { caminhos } = await montar();
    expect(caminhos[0].classList).toContain('fill-sunken');
    expect(caminhos[1].classList).not.toContain('fill-sunken');
  });

  it('emite a sigla ao clicar e ao apertar Enter', async () => {
    const { fixture, caminhos } = await montar();
    const emitidas: string[] = [];
    fixture.componentInstance.selecionar.subscribe((sigla) => emitidas.push(sigla));
    caminhos[1].dispatchEvent(new MouseEvent('click'));
    caminhos[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(emitidas).toEqual(['SP', 'RJ']);
  });
});
