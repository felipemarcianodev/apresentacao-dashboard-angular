import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MALHA_DE_TESTE } from '../../charts/mapa-uf/malha-de-teste';
import { URL_MALHA_UF } from '../../charts/mapa-uf/mapa-uf';
import { BASE_AGREGADOS, RespostaVariavel } from './agregados';
import { IbgePainel } from './ibge-painel';

function resposta(id: string, nome: string, series: Record<string, Record<string, string>>): RespostaVariavel {
  return {
    id,
    variavel: nome,
    unidade: '',
    resultados: [
      {
        series: Object.entries(series).map(([local, serie]) => ({
          localidade: { id: local, nome: local, nivel: { id: local === '1' ? 'N1' : 'N3' } },
          serie,
        })),
      },
    ],
  };
}

const RESPOSTAS: Record<string, RespostaVariavel[]> = {
  '6579': [resposta('9324', 'População', { '1': { '2025': '213000000', '2026': '214211951' }, '33': { '2025': '17000000', '2026': '17100000' } })],
  '4099': [resposta('4099', 'Desocupação', { '1': { '202601': '6.1', '202602': '5.4' }, '33': { '202601': '8.0', '202602': '7.9' } })],
  '5938': [resposta('37', 'PIB', { '1': { '2022': '10000000000', '2023': '10943345439' }, '33': { '2023': '1200000000' } })],
  '1737': [
    resposta('2265', 'IPCA 12 meses', { '1': { '202608': '4.22', '202609': '4.58' } }),
    resposta('63', 'IPCA mensal', { '1': { '202608': '-0.32', '202609': '0.82' } }),
  ],
};

/** O mapa só pede a malha depois que os dados chegam e ele é renderizado. */
async function responderMalha(http: HttpTestingController): Promise<void> {
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    TestBed.tick();
    await new Promise((resolver) => setTimeout(resolver));
    http.match(URL_MALHA_UF).forEach((r) => r.flush(MALHA_DE_TESTE));
  }
}

describe('IbgePainel', () => {
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

  async function montar(uf?: unknown) {
    const fixture = TestBed.createComponent(IbgePainel);
    if (uf) {
      fixture.componentRef.setInput('uf', uf);
    }
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    for (const requisicao of http.match((r) => r.url.startsWith(BASE_AGREGADOS))) {
      const agregado = requisicao.request.url.slice(BASE_AGREGADOS.length + 1).split('/')[0];
      requisicao.flush(RESPOSTAS[agregado]);
    }
    await responderMalha(http);
    await fixture.whenStable();
    return { fixture, html: fixture.nativeElement as HTMLElement, http };
  }

  it('consulta os quatro agregados do IBGE', async () => {
    const { http } = await montar();
    http.verify();
  });

  it('mostra os indicadores do Brasil com valor e período', async () => {
    const { html } = await montar();
    const texto = html.querySelector('[aria-label="Indicadores principais"]')!.textContent!;
    expect(texto).toContain('214,2 mi');
    expect(texto).toContain('5,4%');
    expect(texto).toContain('R$ 10,94 tri');
    expect(texto).toContain('4,58%');
    expect(texto).toContain('2º tri 26');
    expect(html.querySelector('h2')!.textContent).toContain('Brasil em números');
  });

  it('mostra o recorte da UF escolhida pela URL', async () => {
    const { html } = await montar('RJ');
    expect(html.querySelector('h2')!.textContent).toContain('Rio de Janeiro em números');
    const texto = html.querySelector('[aria-label="Indicadores principais"]')!.textContent!;
    expect(texto).toContain('7,9%');
    expect(texto).toContain('índice nacional');
    expect(html.querySelector('select')!.selectedOptions[0].textContent).toBe('Rio de Janeiro');
  });

  it('ignora ?uf= malformado ou desconhecido e mostra o Brasil', async () => {
    for (const uf of [['RJ', 'SP'], { x: 1 }, 'ZZ']) {
      const { html, fixture } = await montar(uf);
      expect(html.querySelector('h2')!.textContent).withContext(JSON.stringify(uf)).toContain('Brasil em números');
      fixture.destroy();
    }
  });

  it('mostra erro com nova tentativa quando o IBGE não responde', async () => {
    const fixture = TestBed.createComponent(IbgePainel);
    TestBed.tick();
    const http = TestBed.inject(HttpTestingController);
    for (const requisicao of http.match((r) => r.url.startsWith(BASE_AGREGADOS))) {
      requisicao.flush('falha', { status: 503, statusText: 'Indisponível' });
    }
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelectorAll('mi-error-state').length).toBeGreaterThan(0);
    expect(html.textContent).toContain('Tentar de novo');
    expect(html.textContent).not.toContain('503');
  });

  it('grava a UF escolhida na URL', async () => {
    const { html } = await montar();
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    const select = html.querySelector('select')!;
    select.value = 'SP';
    select.dispatchEvent(new Event('change'));
    expect(navegar).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: { uf: 'SP' } }));
  });
});
