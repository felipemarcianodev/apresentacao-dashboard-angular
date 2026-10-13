import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { KpiCard, SentidoBom } from './kpi-card';

describe('KpiCard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  async function montar(variacao: number | null, sentidoBom: SentidoBom = 'alta') {
    const fixture = TestBed.createComponent(KpiCard);
    fixture.componentRef.setInput('rotulo', 'Taxa');
    fixture.componentRef.setInput('valor', 7.1);
    fixture.componentRef.setInput('formato', 'percentual');
    fixture.componentRef.setInput('variacao', variacao);
    fixture.componentRef.setInput('sentidoBom', sentidoBom);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('formata o valor', async () => {
    const html = await montar(null);
    expect(html.textContent).toContain('7,1%');
  });

  it('pinta de verde a alta quando alta é bom', async () => {
    const html = await montar(0.4);
    const variacao = html.querySelector('.text-up');
    expect(variacao?.textContent).toContain('+0,4%');
    expect(variacao?.textContent).toContain('Alta de');
  });

  it('pinta de vermelho a alta quando baixa é bom', async () => {
    const html = await montar(0.4, 'baixa');
    expect(html.querySelector('.text-down')).not.toBeNull();
    expect(html.querySelector('.text-up')).toBeNull();
  });

  it('não mostra variação quando ela não existe', async () => {
    const html = await montar(null);
    expect(html.querySelector('.fa-arrow-trend-up, .fa-arrow-trend-down')).toBeNull();
  });
});
