import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  numberAttribute,
  signal,
} from '@angular/core';
import { formatar } from '../../core/formato/formato';
import { Button } from '../../ui/button/button';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { ColunaTabela, Ordenacao } from '../coluna-tabela.model';
import { filtrarLinhas, gerarCsv, ordenarLinhas, textoDaCelula } from '../operacoes';

export type DensidadeTabela = 'confortavel' | 'compacta';

/**
 * Tabela de dados com busca sem acento, ordenação por coluna, paginação e exportação CSV.
 * Abaixo de 640 px cada linha vira um cartão com rótulo e valor.
 */
@Component({
  selector: 'mi-data-table',
  imports: [Button, EmptyState],
  templateUrl: './data-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class DataTable<T> {
  private readonly document = inject(DOCUMENT);

  readonly linhas = input.required<readonly T[]>();
  readonly colunas = input.required<readonly ColunaTabela<T>[]>();
  readonly rotulo = input.required<string>();
  readonly tamanhoPagina = input(10, { transform: numberAttribute });
  readonly densidade = input<DensidadeTabela>('confortavel');
  readonly buscavel = input(true, { transform: booleanAttribute });
  readonly exportavel = input(false, { transform: booleanAttribute });
  readonly nomeArquivo = input('dados');

  protected readonly busca = signal('');
  protected readonly ordenacao = signal<Ordenacao | null>(null);

  private readonly filtradas = computed(() => filtrarLinhas(this.linhas(), this.colunas(), this.busca()));
  private readonly ordenadas = computed(() =>
    ordenarLinhas(this.filtradas(), this.colunas(), this.ordenacao()),
  );

  /** Volta à primeira página sempre que dados, busca ou ordenação mudam. */
  protected readonly pagina = linkedSignal(() => {
    this.ordenadas();
    return 0;
  });

  protected readonly totalPaginas = computed(() =>
    Math.max(1, Math.ceil(this.ordenadas().length / this.tamanhoPagina())),
  );

  protected readonly visiveis = computed(() => {
    const inicio = this.pagina() * this.tamanhoPagina();
    return this.ordenadas()
      .slice(inicio, inicio + this.tamanhoPagina())
      .map((linha) => ({
        celulas: this.colunas().map((coluna) => ({
          id: coluna.id,
          titulo: coluna.titulo,
          texto: textoDaCelula(coluna, linha),
          direita: this.alinhaADireita(coluna, linha),
        })),
      }));
  });

  protected readonly cabecalhos = computed(() =>
    this.colunas().map((coluna) => {
      const ordenacao = this.ordenacao();
      const ativa = ordenacao?.coluna === coluna.id;
      const primeira = this.linhas()[0];
      return {
        id: coluna.id,
        titulo: coluna.titulo,
        ordenavel: coluna.ordenavel !== false,
        direita: primeira !== undefined && this.alinhaADireita(coluna, primeira),
        ariaSort: ativa ? (ordenacao.direcao === 'asc' ? 'ascending' : 'descending') : 'none',
        icone: !ativa ? 'fa-sort' : ordenacao.direcao === 'asc' ? 'fa-sort-up' : 'fa-sort-down',
        ativa,
      };
    }),
  );

  protected readonly resumo = computed(() => {
    const total = this.ordenadas().length;
    if (total === 0) {
      return 'Nenhuma linha';
    }
    const inicio = this.pagina() * this.tamanhoPagina() + 1;
    const fim = Math.min(inicio + this.tamanhoPagina() - 1, total);
    return `${formatar(inicio)} a ${formatar(fim)} de ${formatar(total)}`;
  });

  protected readonly compacta = computed(() => this.densidade() === 'compacta');

  /** Asc, desc e de volta à ordem original. */
  protected alternarOrdenacao(coluna: string): void {
    const atual = this.ordenacao();
    if (atual?.coluna !== coluna) {
      this.ordenacao.set({ coluna, direcao: 'asc' });
    } else if (atual.direcao === 'asc') {
      this.ordenacao.set({ coluna, direcao: 'desc' });
    } else {
      this.ordenacao.set(null);
    }
  }

  protected atualizarBusca(evento: Event): void {
    this.busca.set((evento.target as HTMLInputElement).value);
  }

  protected limparBusca(): void {
    this.busca.set('');
  }

  protected irParaPagina(pagina: number): void {
    this.pagina.set(Math.min(Math.max(pagina, 0), this.totalPaginas() - 1));
  }

  protected exportarCsv(): void {
    const csv = gerarCsv(this.colunas(), this.ordenadas());
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = this.document.createElement('a');
    link.href = url;
    link.download = `${this.nomeArquivo()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private alinhaADireita(coluna: ColunaTabela<T>, linha: T): boolean {
    return coluna.alinhamento ? coluna.alinhamento === 'direita' : typeof coluna.valor(linha) === 'number';
  }
}
