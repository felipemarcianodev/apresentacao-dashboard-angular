import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, numberAttribute, signal } from '@angular/core';
import { FormatoNumero, formatar } from '../../core/formato/formato';
import { eixoAgradavel, escalaLinear, indicesDeRotulo } from '../escala';
import { larguraDoHost } from '../largura-do-host';

export interface PontoSerie {
  readonly rotulo: string;
  readonly valor: number | null;
}

export interface SerieGrafico {
  readonly nome: string;
  readonly pontos: readonly PontoSerie[];
}

/** Cores das séries, na ordem. São classes de texto: o SVG desenha com currentColor. */
export const CORES_SERIE = ['text-accent', 'text-violet', 'text-warn', 'text-up'] as const;

const MARGEM = { topo: 12, direita: 14, base: 28 };

/**
 * Gráfico de linha para séries temporais. Com uma série, desenha área; com várias, legenda.
 * Passe o mouse ou use as setas com o gráfico em foco para ler cada ponto.
 */
@Component({
  selector: 'mi-line-chart',
  templateUrl: './line-chart.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
})
export class LineChart {
  readonly series = input.required<readonly SerieGrafico[]>();
  readonly rotulo = input.required<string>();
  readonly formato = input<FormatoNumero>('numero');
  readonly altura = input(260, { transform: numberAttribute });
  readonly incluirZero = input(false, { transform: booleanAttribute });

  protected readonly largura = larguraDoHost();
  protected readonly cores = CORES_SERIE;
  protected readonly indiceAtivo = signal<number | null>(null);

  private readonly rotulos = computed(() => this.series()[0]?.pontos.map((p) => p.rotulo) ?? []);

  private readonly eixo = computed(() => {
    const valores = this.series().flatMap((s) => s.pontos.map((p) => p.valor ?? Number.NaN));
    return eixoAgradavel(valores, 4, this.incluirZero());
  });

  protected readonly marcasY = computed(() =>
    this.eixo().marcas.map((valor) => ({ y: this.escalaY()(valor), texto: formatar(valor, this.formato()) })),
  );

  private readonly margemEsquerda = computed(
    () => Math.max(...this.marcasY().map((m) => m.texto.length), 1) * 7 + 12,
  );

  private readonly escalaX = computed(() =>
    escalaLinear(
      [0, Math.max(this.rotulos().length - 1, 1)],
      [this.margemEsquerda(), this.largura() - MARGEM.direita],
    ),
  );

  private readonly escalaY = computed(() =>
    escalaLinear(this.eixo().dominio, [this.altura() - MARGEM.base, MARGEM.topo]),
  );

  protected readonly area = computed(() => ({
    x0: this.margemEsquerda(),
    x1: this.largura() - MARGEM.direita,
    y0: MARGEM.topo,
    y1: this.altura() - MARGEM.base,
  }));

  protected readonly rotulosX = computed(() => {
    const largura = this.area().x1 - this.area().x0;
    const ultimo = this.rotulos().length - 1;
    return indicesDeRotulo(this.rotulos().length, Math.max(2, Math.floor(largura / 90))).map((i) => ({
      x: this.escalaX()(i),
      texto: this.rotulos()[i],
      ancora: i === 0 ? 'start' : i === ultimo ? 'end' : 'middle',
    }));
  });

  protected readonly tracados = computed(() => {
    const x = this.escalaX();
    const y = this.escalaY();
    const base = this.area().y1;
    return this.series().map((serie, indice) => {
      let linha = '';
      let emTrecho = false;
      const validos: { x: number; y: number }[] = [];
      serie.pontos.forEach((ponto, i) => {
        if (ponto.valor === null || !Number.isFinite(ponto.valor)) {
          emTrecho = false;
          return;
        }
        const px = x(i);
        const py = y(ponto.valor);
        linha += `${emTrecho ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`;
        emTrecho = true;
        validos.push({ x: px, y: py });
      });
      const preenchimento =
        this.series().length === 1 && validos.length > 1
          ? `M${validos[0].x.toFixed(1)},${base}` +
            validos.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('') +
            `L${validos[validos.length - 1].x.toFixed(1)},${base}Z`
          : '';
      return { nome: serie.nome, linha, preenchimento, cor: CORES_SERIE[indice % CORES_SERIE.length] };
    });
  });

  protected readonly destaque = computed(() => {
    const indice = this.indiceAtivo();
    if (indice === null) {
      return null;
    }
    const x = this.escalaX()(indice);
    const itens = this.series().map((serie, i) => {
      const valor = serie.pontos[indice]?.valor ?? null;
      return {
        nome: serie.nome,
        texto: formatar(valor, this.formato()),
        y: valor === null ? null : this.escalaY()(valor),
        cor: CORES_SERIE[i % CORES_SERIE.length],
      };
    });
    const larguraTooltip = 168;
    const esquerda = Math.min(Math.max(x - larguraTooltip / 2, 0), this.largura() - larguraTooltip);
    return { x, rotulo: this.rotulos()[indice], itens, esquerda, larguraTooltip };
  });

  /** Linhas da tabela oculta que leitores de tela leem no lugar do desenho. */
  protected readonly tabela = computed(() =>
    this.rotulos().map((rotulo, i) => ({
      rotulo,
      valores: this.series().map((s) => formatar(s.pontos[i]?.valor, this.formato())),
    })),
  );

  protected acompanharPonteiro(evento: PointerEvent): void {
    const total = this.rotulos().length;
    if (total === 0) {
      return;
    }
    const { x0, x1 } = this.area();
    const passo = total > 1 ? (x1 - x0) / (total - 1) : 1;
    const indice = Math.round((evento.offsetX - x0) / passo);
    this.indiceAtivo.set(Math.min(Math.max(indice, 0), total - 1));
  }

  protected navegarComTeclado(evento: KeyboardEvent): void {
    const total = this.rotulos().length;
    const atual = this.indiceAtivo() ?? total - 1;
    const destinos: Record<string, number> = {
      ArrowLeft: atual - 1,
      ArrowRight: atual + 1,
      Home: 0,
      End: total - 1,
    };
    const destino = destinos[evento.key];
    if (destino === undefined || total === 0) {
      return;
    }
    evento.preventDefault();
    this.indiceAtivo.set(Math.min(Math.max(destino, 0), total - 1));
  }

  protected focarUltimoPonto(): void {
    if (this.indiceAtivo() === null && this.rotulos().length > 0) {
      this.indiceAtivo.set(this.rotulos().length - 1);
    }
  }

  protected limparDestaque(): void {
    this.indiceAtivo.set(null);
  }
}
