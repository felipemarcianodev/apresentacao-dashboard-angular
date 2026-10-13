import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OpcaoSegmented, Segmented } from './segmented';

@Component({
  imports: [Segmented],
  template: `<mi-segmented rotulo="Período" [opcoes]="opcoes" [(valor)]="valor" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Hospedeiro {
  readonly opcoes: OpcaoSegmented[] = [
    { valor: '1A', rotulo: '1A' },
    { valor: '5A', rotulo: '5A' },
    { valor: '10A', rotulo: '10A' },
  ];
  readonly valor = signal('1A');
}

describe('Segmented', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  async function montar() {
    const fixture = TestBed.createComponent(Hospedeiro);
    await fixture.whenStable();
    const botoes = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    );
    return { fixture, botoes };
  }

  it('marca a opção atual e deixa só ela na ordem do Tab', async () => {
    const { botoes } = await montar();
    expect(botoes.map((b) => b.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    expect(botoes.map((b) => b.tabIndex)).toEqual([0, -1, -1]);
  });

  it('atualiza o signal do pai no clique (two-way binding)', async () => {
    const { fixture, botoes } = await montar();
    botoes[2].click();
    await fixture.whenStable();
    expect(fixture.componentInstance.valor()).toBe('10A');
  });

  it('anda com as setas e dá a volta no fim da lista', async () => {
    const { fixture, botoes } = await montar();
    botoes[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.valor()).toBe('10A');

    botoes[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    await fixture.whenStable();
    expect(fixture.componentInstance.valor()).toBe('1A');
  });
});
