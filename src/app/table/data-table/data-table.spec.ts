import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ColunaTabela } from '../coluna-tabela.model';
import { DataTable } from './data-table';

interface Registro {
  id: number;
  nome: string;
}

const COLUNAS: ColunaTabela<Registro>[] = [
  { id: 'id', titulo: 'Código', valor: (r) => r.id },
  { id: 'nome', titulo: 'Nome', valor: (r) => r.nome },
];

const MIL_LINHAS: Registro[] = Array.from({ length: 1000 }, (_, i) => ({
  id: i + 1,
  nome: i === 500 ? 'Conceição' : `Registro ${i + 1}`,
}));

describe('DataTable', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
  });

  async function montar() {
    const fixture = TestBed.createComponent(DataTable<Registro>);
    fixture.componentRef.setInput('rotulo', 'Registros');
    fixture.componentRef.setInput('colunas', COLUNAS);
    fixture.componentRef.setInput('linhas', MIL_LINHAS);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    const corpo = () => Array.from(html.querySelectorAll('table tbody tr'));
    const resumo = () => html.querySelector('[aria-live]')?.textContent?.trim();
    return { fixture, html, corpo, resumo };
  }

  it('pagina 1.000 linhas mostrando só a página atual', async () => {
    const { corpo, resumo } = await montar();
    expect(corpo().length).toBe(10);
    expect(resumo()).toBe('1 a 10 de 1.000');
  });

  it('alterna ordenação crescente, decrescente e original, com aria-sort', async () => {
    const { fixture, html, corpo } = await montar();
    const botao = html.querySelector<HTMLButtonElement>('th button')!;
    const th = html.querySelector('th')!;

    botao.click();
    await fixture.whenStable();
    expect(th.getAttribute('aria-sort')).toBe('ascending');
    expect(corpo()[0].textContent).toContain('Registro 1');

    botao.click();
    await fixture.whenStable();
    expect(th.getAttribute('aria-sort')).toBe('descending');
    expect(corpo()[0].textContent).toContain('1.000');

    botao.click();
    await fixture.whenStable();
    expect(th.getAttribute('aria-sort')).toBe('none');
  });

  it('busca sem acento e volta para a primeira página', async () => {
    const { fixture, html, corpo, resumo } = await montar();
    const proxima = Array.from(html.querySelectorAll('nav button')).at(-1) as HTMLButtonElement;
    proxima.click();
    await fixture.whenStable();
    expect(resumo()).toBe('11 a 20 de 1.000');

    const campo = html.querySelector('input')!;
    campo.value = 'conceicao';
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(corpo().length).toBe(1);
    expect(resumo()).toBe('1 a 1 de 1');
  });

  it('mostra o estado vazio e limpa a busca', async () => {
    const { fixture, html, corpo } = await montar();
    const campo = html.querySelector('input')!;
    campo.value = 'inexistente';
    campo.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(html.textContent).toContain('Nenhum resultado para');

    (Array.from(html.querySelectorAll('button')).find((b) => b.textContent?.includes('Limpar busca')) as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(corpo().length).toBe(10);
  });
});
