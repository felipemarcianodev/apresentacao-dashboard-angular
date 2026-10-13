import { ChangeDetectionStrategy, Component, provideZonelessChangeDetection, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button, VarianteBotao } from './button';

@Component({
  imports: [Button],
  template: `<button miButton class="mt-4" [variante]="variante()" [carregando]="carregando()" icone="fa-download">
    Exportar
  </button>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class Hospedeiro {
  readonly variante = signal<VarianteBotao>('primario');
  readonly carregando = signal(false);
}

describe('Button', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  async function montar() {
    const fixture = TestBed.createComponent(Hospedeiro);
    await fixture.whenStable();
    const botao = (fixture.nativeElement as HTMLElement).querySelector('button')!;
    return { fixture, botao };
  }

  it('aplica a variante e preserva a classe de quem usa', async () => {
    const { fixture, botao } = await montar();
    expect(botao.classList).toContain('bg-primary-600');
    expect(botao.classList).toContain('mt-4');

    fixture.componentInstance.variante.set('secundario');
    await fixture.whenStable();
    expect(botao.classList).not.toContain('bg-primary-600');
    expect(botao.classList).toContain('border-line');
    expect(botao.classList).toContain('mt-4');
  });

  it('troca o ícone por spinner e marca aria-busy ao carregar', async () => {
    const { fixture, botao } = await montar();
    expect(botao.querySelector('.fa-download')).not.toBeNull();
    expect(botao.getAttribute('aria-busy')).toBeNull();

    fixture.componentInstance.carregando.set(true);
    await fixture.whenStable();
    expect(botao.querySelector('.fa-spinner')).not.toBeNull();
    expect(botao.querySelector('.fa-download')).toBeNull();
    expect(botao.getAttribute('aria-busy')).toBe('true');
  });
});
