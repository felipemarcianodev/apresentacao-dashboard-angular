import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BarList } from './bar-list';

describe('BarList', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  it('ordena do maior para o menor, limita e dimensiona pela maior barra', async () => {
    const fixture = TestBed.createComponent(BarList);
    fixture.componentRef.setInput('itens', [
      { rotulo: 'B', valor: 50 },
      { rotulo: 'A', valor: 200 },
      { rotulo: 'C', valor: 100 },
    ]);
    fixture.componentRef.setInput('limite', 2);
    await fixture.whenStable();
    const linhas = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('li'));
    expect(linhas.map((li) => li.querySelector('span')?.textContent?.trim())).toEqual(['A', 'C']);
    const barras = linhas.map((li) => (li.querySelector('span span') as HTMLElement).style.width);
    expect(barras).toEqual(['100%', '50%']);
  });
});
