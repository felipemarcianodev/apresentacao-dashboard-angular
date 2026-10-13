import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormatoNumero, formatar, formatarVariacao } from '../../core/formato/formato';
import { Sparkline } from '../sparkline/sparkline';

/** Qual direção da variação é boa: alta de PIB é boa, alta de desemprego não. */
export type SentidoBom = 'alta' | 'baixa' | 'neutro';

/**
 * Indicador em destaque: valor, variação com sinal e cor semântica, minigráfico e referência.
 * Cor nunca é a única pista: a seta e o texto da variação repetem a direção.
 */
@Component({
  selector: 'mi-kpi-card',
  imports: [Sparkline],
  templateUrl: './kpi-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex min-w-0 flex-col gap-2 rounded-xl border border-line bg-surface p-4' },
})
export class KpiCard {
  readonly rotulo = input.required<string>();
  readonly valor = input.required<number | null>();
  readonly formato = input<FormatoNumero>('numero');
  readonly unidade = input<string>('');
  readonly variacao = input<number | null>(null);
  readonly formatoVariacao = input<FormatoNumero | 'pontos'>('percentual');
  readonly rotuloVariacao = input<string>('');
  readonly sentidoBom = input<SentidoBom>('alta');
  readonly serie = input<readonly (number | null)[]>([]);
  readonly referencia = input<string>('');

  protected readonly valorFormatado = computed(() => formatar(this.valor(), this.formato()));

  protected readonly tendencia = computed(() => {
    const variacao = this.variacao();
    if (variacao === null || !Number.isFinite(variacao)) {
      return null;
    }
    const direcao = variacao > 0 ? 'alta' : variacao < 0 ? 'baixa' : 'estavel';
    const sentido = this.sentidoBom();
    const avaliacao =
      direcao === 'estavel' || sentido === 'neutro' ? 'neutra' : direcao === sentido ? 'boa' : 'ruim';
    return {
      texto: formatarVariacao(variacao, this.formatoVariacao()),
      icone: direcao === 'alta' ? 'fa-arrow-trend-up' : direcao === 'baixa' ? 'fa-arrow-trend-down' : 'fa-minus',
      leitura: direcao === 'alta' ? 'Alta de' : direcao === 'baixa' ? 'Queda de' : 'Estável,',
      avaliacao,
    };
  });
}
