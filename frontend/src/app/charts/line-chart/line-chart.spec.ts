import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LineChart, SerieGrafico } from './line-chart';

const SERIE: SerieGrafico = {
  nome: 'Índice',
  pontos: [
    { rotulo: 'jan', valor: 10 },
    { rotulo: 'fev', valor: 12 },
    { rotulo: 'mar', valor: null },
    { rotulo: 'abr', valor: 15 },
  ],
};

describe('LineChart', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  async function montar(series: SerieGrafico[] = [SERIE]) {
    const fixture = TestBed.createComponent(LineChart);
    fixture.componentRef.setInput('rotulo', 'Índice mensal');
    fixture.componentRef.setInput('series', series);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    return { fixture, html, svg: html.querySelector('svg')! };
  }

  it('interrompe a linha no ponto sem dado em vez de inventar valor', async () => {
    const { html } = await montar();
    const linha = html.querySelector('path[fill="none"]')!.getAttribute('d')!;
    expect(linha.match(/M/g)?.length).toBe(2);
  });

  it('desenha área só quando há uma única série', async () => {
    const uma = await montar();
    expect(uma.html.querySelector('path.opacity-10')).not.toBeNull();

    const duas = await montar([SERIE, { ...SERIE, nome: 'Outro' }]);
    expect(duas.html.querySelector('path.opacity-10')).toBeNull();
    expect(duas.html.querySelectorAll('ul li').length).toBe(2);
  });

  it('percorre os pontos pelo teclado e mostra o tooltip', async () => {
    const { fixture, svg, html } = await montar();
    svg.dispatchEvent(new FocusEvent('focus'));
    await fixture.whenStable();
    expect(html.querySelector('[aria-live]')?.textContent).toContain('abr');

    svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
    await fixture.whenStable();
    expect(html.querySelector('[aria-live]')?.textContent).toContain('jan');
    expect(html.querySelector('[aria-live]')?.textContent).toContain('10');
  });

  it('repete os dados numa tabela para leitores de tela', async () => {
    const { html } = await montar();
    const linhas = html.querySelectorAll('table tbody tr');
    expect(linhas.length).toBe(4);
    expect(linhas[2].textContent).toContain('sem dado');
  });
});
