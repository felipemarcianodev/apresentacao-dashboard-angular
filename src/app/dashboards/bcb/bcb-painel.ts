import { HttpResourceRef, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Signal, computed, signal } from '@angular/core';
import { KpiCard } from '../../charts/kpi-card/kpi-card';
import { LineChart, SerieGrafico } from '../../charts/line-chart/line-chart';
import { valorDe } from '../../core/dados/valor-de';
import { FormatoNumero } from '../../core/formato/formato';
import { ColunaTabela } from '../../table/coluna-tabela.model';
import { DataTable } from '../../table/data-table/data-table';
import { Card } from '../../ui/card/card';
import { ErrorState } from '../../ui/error-state/error-state';
import { OpcaoSegmented, Segmented } from '../../ui/segmented/segmented';
import { Skeleton } from '../../ui/skeleton/skeleton';
import { IdSerieBcb, ResumoSerie, SERIES_BCB, SERIE_BCB, resumirSerie } from './series';
import { PontoDiario, inicioDoPeriodo, lerSerie, rotuloMes, urlSerie } from './sgs';
import { obtidoNaReserva } from '../../core/dados/origem';
import { AvisoDeReserva } from '../aviso-de-reserva/aviso-de-reserva';

type Recurso = HttpResourceRef<PontoDiario[] | undefined>;

interface LinhaMes {
  readonly mes: string;
  readonly valores: Partial<Record<IdSerieBcb, number | null>>;
}

interface GraficoBcb {
  readonly id: string;
  readonly titulo: string;
  readonly descricao: string;
  readonly fonte: string;
  readonly formato: FormatoNumero;
  readonly ids: readonly IdSerieBcb[];
}

const KPIS: readonly IdSerieBcb[] = ['selic', 'dolar', 'inadimplencia', 'ibcbr'];

const GRAFICOS: readonly GraficoBcb[] = [
  {
    id: 'selic',
    titulo: 'Meta Selic',
    descricao: 'Taxa definida pelo Copom no fim de cada mês, em % ao ano',
    fonte: SERIE_BCB.selic.fonte,
    formato: 'percentual',
    ids: ['selic'],
  },
  {
    id: 'cambio',
    titulo: 'Câmbio',
    descricao: 'PTAX de venda no último dia útil de cada mês, em reais',
    fonte: 'Banco Central, SGS séries 1 e 21619',
    formato: 'moeda',
    ids: ['dolar', 'euro'],
  },
  {
    id: 'credito',
    titulo: 'Saldo de crédito',
    descricao: 'Carteira total do Sistema Financeiro Nacional, em reais',
    fonte: SERIE_BCB.credito.fonte,
    formato: 'moeda-compacta',
    ids: ['credito'],
  },
  {
    id: 'inadimplencia',
    titulo: 'Inadimplência',
    descricao: 'Parcela da carteira com atraso acima de 90 dias, em %',
    fonte: SERIE_BCB.inadimplencia.fonte,
    formato: 'percentual',
    ids: ['inadimplencia'],
  },
];

/**
 * Painel do Banco Central sobre a API do SGS: juros, câmbio, crédito e atividade.
 * Trocar o período refaz as consultas, porque o SGS só entrega série diária por janela de datas.
 */
@Component({
  selector: 'mi-bcb-painel',
  imports: [AvisoDeReserva, KpiCard, LineChart, DataTable, Card, Segmented, Skeleton, ErrorState],
  templateUrl: './bcb-painel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BcbPainel {
  private readonly hoje = new Date();

  protected readonly opcoesPeriodo: OpcaoSegmented<'1' | '2' | '5'>[] = [
    { valor: '1', rotulo: '1A' },
    { valor: '2', rotulo: '2A' },
    { valor: '5', rotulo: '5A' },
  ];
  protected readonly periodo = signal<'1' | '2' | '5'>('2');

  protected readonly recursos = Object.fromEntries(
    SERIES_BCB.map((serie) => [
      serie.id,
      httpResource<PontoDiario[]>(
        () => urlSerie(serie.codigo, inicioDoPeriodo(this.hoje, Number(this.periodo())), this.hoje),
        { parse: (resposta) => lerSerie(resposta, this.hoje) },
      ),
    ]),
  ) as Record<IdSerieBcb, Recurso>;
  protected readonly obtidoNaReserva = computed(() => obtidoNaReserva(Object.values(this.recursos)));

  private readonly resumos = Object.fromEntries(
    SERIES_BCB.map((serie) => [serie.id, computed(() => resumirSerie(valorDe(this.recursos[serie.id]), serie))]),
  ) as Record<IdSerieBcb, Signal<ResumoSerie | null>>;

  protected readonly kpis = computed(() =>
    KPIS.map((id) => ({ serie: SERIE_BCB[id], recurso: this.recursos[id], resumo: this.resumos[id]() })),
  );

  protected readonly graficos = computed(() =>
    GRAFICOS.map((grafico) => {
      const recursos = grafico.ids.map((id) => this.recursos[id]);
      const base = this.resumos[grafico.ids[0]]();
      // Alinha todas as séries do gráfico pelos meses da primeira.
      const series: SerieGrafico[] = base
        ? grafico.ids.map((id) => {
            const porMes = new Map(this.resumos[id]()?.pontos.map((p) => [p.mes, p.valor]) ?? []);
            return {
              nome: SERIE_BCB[id].nome,
              pontos: base.pontos.map((p) => ({ rotulo: p.rotulo, valor: porMes.get(p.mes) ?? null })),
            };
          })
        : [];
      return {
        ...grafico,
        series,
        erro: recursos.some((r) => r.error()),
        recarregar: () => recursos.forEach((r) => r.reload()),
      };
    }),
  );

  protected readonly linhasTabela = computed<LinhaMes[]>(() => {
    const meses = new Set<string>();
    for (const serie of SERIES_BCB) {
      this.resumos[serie.id]()?.pontos.forEach((p) => meses.add(p.mes));
    }
    const porSerie = Object.fromEntries(
      SERIES_BCB.map((serie) => [serie.id, new Map(this.resumos[serie.id]()?.pontos.map((p) => [p.mes, p.valor]) ?? [])]),
    ) as Record<IdSerieBcb, Map<string, number | null>>;
    return [...meses]
      .sort()
      .reverse()
      .map((mes) => ({
        mes,
        valores: Object.fromEntries(SERIES_BCB.map((s) => [s.id, porSerie[s.id].get(mes) ?? null])),
      }));
  });

  protected readonly colunasTabela: ColunaTabela<LinhaMes>[] = [
    { id: 'mes', titulo: 'Mês', valor: (l) => rotuloMes(l.mes), chaveOrdenacao: (l) => l.mes },
    ...SERIES_BCB.map(
      (serie): ColunaTabela<LinhaMes> => ({
        id: serie.id,
        titulo: serie.nome,
        valor: (l) => l.valores[serie.id] ?? null,
        formato: serie.formato,
      }),
    ),
  ];

  protected readonly fonteTabela = `Banco Central, SGS séries ${SERIES_BCB.map((s) => s.codigo).join(', ')}`;
}
