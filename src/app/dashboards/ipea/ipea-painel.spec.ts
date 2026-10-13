import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BASE_IPEADATA } from './ipeadata';
import { IpeaPainel } from './ipea-painel';

function valores(pares: [string, number][]) {
  return { value: pares.map(([data, valor]) => ({ VALDATA: `${data}T00:00:00-03:00`, VALVALOR: valor })) };
}

const RESPOSTAS: Record<string, object> = {
  SCN10_PIBG10: valores([['1985-01-01', 7.9], ['2024-01-01', 3.4], ['2025-01-01', 2.285747]]),
  GAC_PIBCAPUSN: valores([['2023-01-01', 10.2], ['2024-01-01', 10.638467]]),
  GAC12_SALMINRE12: valores([['2025-09-01', 1500], ['2025-12-01', 1518], ['2026-09-01', 1621]]),
  PNADS_GINI: valores([['1995-01-01', 61.469031], ['2024-01-01', 51.6], ['2025-01-01', 51.12722]]),
};

function codigoDa(requisicao: TestRequest): string {
  return /SERCODIGO='([A-Z0-9_]+)'/.exec(requisicao.request.url)![1];
}

describe('IpeaPainel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function montar() {
    const fixture = TestBed.createComponent(IpeaPainel);
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    const requisicoes = http.match((r) => r.url.startsWith(BASE_IPEADATA));
    requisicoes.forEach((r) => r.flush(RESPOSTAS[codigoDa(r)]));
    await fixture.whenStable();
    return { fixture, http, requisicoes, html: fixture.nativeElement as HTMLElement };
  }

  it('consulta as quatro séries uma única vez', async () => {
    const { requisicoes } = await montar();
    expect(requisicoes.map(codigoDa).sort()).toEqual(['GAC12_SALMINRE12', 'GAC_PIBCAPUSN', 'PNADS_GINI', 'SCN10_PIBG10']);
  });

  it('mostra os indicadores com a unidade certa', async () => {
    const { html } = await montar();
    const texto = html.querySelector('[aria-label="Indicadores principais"]')!.textContent!;
    expect(texto).toContain('2,29%');
    expect(texto).toContain('US$ 10.638');
    expect(texto).toContain('R$ 1.621,00');
    expect(texto).toContain('51,13');
    expect(texto).toContain('set/2026');
  });

  it('recorta o período no navegador, sem nova consulta', async () => {
    const { fixture, http, html } = await montar();
    const linhasAntes = html.querySelectorAll('table tbody tr').length;
    const tudo = Array.from(html.querySelectorAll<HTMLButtonElement>('[role="radio"]')).find(
      (b) => b.textContent?.trim() === 'Tudo',
    )!;
    tudo.click();
    await fixture.whenStable();
    http.expectNone((r) => r.url.startsWith(BASE_IPEADATA));
    expect(html.querySelector('table tbody')!.textContent).toContain('1985');
    expect(html.querySelectorAll('table tbody tr').length).toBeGreaterThan(linhasAntes);
  });

  it('mostra erro com nova tentativa sem detalhe técnico', async () => {
    const fixture = TestBed.createComponent(IpeaPainel);
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .match((r) => r.url.startsWith(BASE_IPEADATA))
      .forEach((r) => r.flush('falha', { status: 502, statusText: 'Erro' }));
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Tentar de novo');
    expect(html.textContent).not.toContain('502');
  });
});
