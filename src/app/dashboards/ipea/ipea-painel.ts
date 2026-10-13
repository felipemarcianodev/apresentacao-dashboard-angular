import { HttpResourceRef, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Signal, computed, signal } from '@angular/core';
import { KpiCard } from '../../charts/kpi-card/kpi-card';
import { LineChart, SerieGrafico } from '../../charts/line-chart/line-chart';
import { valorDe } from '../../core/dados/valor-de';
import { ColunaTabela } from '../../table/coluna-tabela.model';
import { DataTable } from '../../table/data-table/data-table';
import { Card } from '../../ui/card/card';
import { ErrorState } from '../../ui/error-state/error-state';
import { OpcaoSegmented, Segmented } from '../../ui/segmented/segmented';
import { Skeleton } from '../../ui/skeleton/skeleton';
import { PontoIpea, lerValores, urlValores } from './ipeadata';
import { IdSerieIpea, ResumoIpea, SERIES_IPEA, resumirIpea } from './series';
import { obtidoNaReserva } from '../../core/dados/origem';
import { AvisoDeReserva } from '../aviso-de-reserva/aviso-de-reserva';

type Desde = '1995' | '1980' | '1900';

interface LinhaAno {
  readonly ano: string;
  readonly valores: Partial<Record<IdSerieIpea, number | null>>;
}

/**
 * Painel do Ipeadata: séries longas da economia brasileira. A API devolve a série inteira, então
 * trocar o período só recorta no navegador, sem nova consulta.
 */
@Component({
  selector: 'mi-ipea-painel',
  imports: [AvisoDeReserva, KpiCard, LineChart, DataTable, Card, Segmented, Skeleton, ErrorState],
  templateUrl: './ipea-painel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpeaPainel {
  protected readonly opcoesPeriodo: OpcaoSegmented<Desde>[] = [
    { valor: '1995', rotulo: 'Desde 1995' },
    { valor: '1980', rotulo: 'Desde 1980' },
    { valor: '1900', rotulo: 'Tudo' },
  ];
  protected readonly desde = signal<Desde>('1995');

  protected readonly recursos = Object.fromEntries(
    SERIES_IPEA.map((serie) => [
      serie.id,
      httpResource<PontoIpea[]>(() => urlValores(serie.codigo), { parse: lerValores }),
    ]),
  ) as Record<IdSerieIpea, HttpResourceRef<PontoIpea[] | undefined>>;
  protected readonly obtidoNaReserva = computed(() => obtidoNaReserva(Object.values(this.recursos)));

  private readonly resumos = Object.fromEntries(
    SERIES_IPEA.map((serie) => [
      serie.id,
      computed(() => resumirIpea(valorDe(this.recursos[serie.id]), serie, this.desde())),
    ]),
  ) as Record<IdSerieIpea, Signal<ResumoIpea | null>>;

  protected readonly paineis = computed(() =>
    SERIES_IPEA.map((serie) => {
      const resumo = this.resumos[serie.id]();
      const grafico: SerieGrafico[] = resumo
        ? [{ nome: serie.nome, pontos: resumo.anos.map((a) => ({ rotulo: a.ano, valor: a.valor })) }]
        : [];
      return { serie, resumo, grafico, recurso: this.recursos[serie.id] };
    }),
  );

  protected readonly linhasTabela = computed<LinhaAno[]>(() => {
    const anos = new Set<string>();
    const porSerie = Object.fromEntries(
      SERIES_IPEA.map((serie) => {
        const pontos = this.resumos[serie.id]()?.anos ?? [];
        pontos.forEach((p) => anos.add(p.ano));
        return [serie.id, new Map(pontos.map((p) => [p.ano, p.valor]))];
      }),
    ) as Record<IdSerieIpea, Map<string, number | null>>;
    return [...anos]
      .sort()
      .reverse()
      .map((ano) => ({
        ano,
        valores: Object.fromEntries(SERIES_IPEA.map((s) => [s.id, porSerie[s.id].get(ano) ?? null])),
      }));
  });

  protected readonly colunasTabela: ColunaTabela<LinhaAno>[] = [
    { id: 'ano', titulo: 'Ano', valor: (l) => l.ano },
    ...SERIES_IPEA.map(
      (serie): ColunaTabela<LinhaAno> => ({
        id: serie.id,
        titulo: serie.nome,
        valor: (l) => l.valores[serie.id] ?? null,
        formato: serie.formato,
      }),
    ),
  ];

  protected readonly fonteTabela = `Ipeadata, séries ${SERIES_IPEA.map((s) => s.codigo).join(', ')}`;
}
