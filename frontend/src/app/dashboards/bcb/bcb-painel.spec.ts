import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BcbPainel } from './bcb-painel';
import { BASE_SGS, RespostaSgs } from './sgs';

/** Datas relativas a hoje, para o filtro de datas futuras não descartar a resposta de teste. */
function mesesAtras(meses: number, dia = 1): string {
  const data = new Date();
  data.setDate(1);
  data.setMonth(data.getMonth() - meses);
  data.setDate(dia);
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}

const RESPOSTAS: Record<string, RespostaSgs[]> = {
  '432': [
    { data: mesesAtras(13), valor: '15.00' },
    { data: mesesAtras(1), valor: '14.25' },
    { data: mesesAtras(-2), valor: '13.75' },
  ],
  '1': [
    { data: mesesAtras(12), valor: '5.40' },
    { data: mesesAtras(1), valor: '4.9892' },
  ],
  '21619': [{ data: mesesAtras(1), valor: '5.5844' }],
  '20539': [{ data: mesesAtras(2), valor: '7397669' }],
  '21082': [
    { data: mesesAtras(14), valor: '4.10' },
    { data: mesesAtras(2), valor: '5.04' },
  ],
  '24364': [{ data: mesesAtras(3), valor: '109.91611' }],
};

function codigoDa(requisicao: TestRequest): string {
  return requisicao.request.url.slice(BASE_SGS.length + 1).split('/')[0];
}

describe('BcbPainel', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
  });

  async function montar() {
    const fixture = TestBed.createComponent(BcbPainel);
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    const requisicoes = http.match((r) => r.url.startsWith(BASE_SGS));
    requisicoes.forEach((r) => r.flush(RESPOSTAS[codigoDa(r)]));
    await fixture.whenStable();
    return { fixture, http, requisicoes, html: fixture.nativeElement as HTMLElement };
  }

  it('consulta as seis séries por janela de datas de 2 anos', async () => {
    const { requisicoes } = await montar();
    expect(requisicoes.map(codigoDa).sort()).toEqual(['1', '20539', '21082', '21619', '24364', '432']);
    const ano = new Date().getFullYear();
    expect(requisicoes[0].request.url).toContain(`dataInicial=01/`);
    expect(requisicoes[0].request.url).toContain(`/${ano - 2}&dataFinal=`);
  });

  it('mostra os indicadores sem usar a meta Selic futura', async () => {
    const { html } = await montar();
    const texto = html.querySelector('[aria-label="Indicadores principais"]')!.textContent!;
    expect(texto).toContain('14,25%');
    expect(texto).not.toContain('13,75%');
    expect(texto).toContain('−0,75 p.p.');
    expect(texto).toContain('R$ 4,99');
    expect(texto).toContain('5,04%');
    expect(texto).toContain('109,92');
  });

  it('refaz as consultas com a nova janela ao trocar o período', async () => {
    const { fixture, http, html } = await montar();
    const botao5A = Array.from(html.querySelectorAll<HTMLButtonElement>('[role="radio"]')).find(
      (b) => b.textContent?.trim() === '5A',
    )!;
    botao5A.click();
    TestBed.tick();
    const novas = http.match((r) => r.url.startsWith(BASE_SGS));
    expect(novas.length).toBe(6);
    expect(novas[0].request.url).toContain(`/${new Date().getFullYear() - 5}&dataFinal=`);
    novas.forEach((r) => r.flush(RESPOSTAS[codigoDa(r)]));
    await fixture.whenStable();
  });

  it('mostra erro com nova tentativa sem detalhe técnico', async () => {
    const fixture = TestBed.createComponent(BcbPainel);
    TestBed.tick();
    TestBed.inject(HttpTestingController)
      .match((r) => r.url.startsWith(BASE_SGS))
      .forEach((r) => r.flush('falha', { status: 500, statusText: 'Erro' }));
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Tentar de novo');
    expect(html.textContent).not.toContain('500');
  });
});
