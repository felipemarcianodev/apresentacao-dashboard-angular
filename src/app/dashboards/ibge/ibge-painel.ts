import { HttpResourceRef, httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BarList, ItemBarra } from '../../charts/bar-list/bar-list';
import { KpiCard } from '../../charts/kpi-card/kpi-card';
import { LineChart, SerieGrafico } from '../../charts/line-chart/line-chart';
import { MapaUf } from '../../charts/mapa-uf/mapa-uf';
import { UFS, Uf, ufPorSigla } from '../../core/brasil/ufs';
import { valorDe } from '../../core/dados/valor-de';
import { ColunaTabela } from '../../table/coluna-tabela.model';
import { DataTable } from '../../table/data-table/data-table';
import { Badge } from '../../ui/badge/badge';
import { Card } from '../../ui/card/card';
import { ErrorState } from '../../ui/error-state/error-state';
import { OpcaoSegmented, Segmented } from '../../ui/segmented/segmented';
import { Skeleton } from '../../ui/skeleton/skeleton';
import { ConsultaAgregado, RespostaVariavel, VariavelLida, lerAgregado, urlAgregado } from './agregados';
import { ID_BRASIL, INDICADORES_UF, IPCA, IdIndicadorUf, IndicadorUf, resumir, valoresPorUf } from './indicadores';

type Agregado = ReadonlyMap<string, VariavelLida>;

interface LinhaUf {
  readonly uf: Uf;
  readonly populacao: number | null;
  readonly desocupacao: number | null;
  readonly pib: number | null;
}

function recursoAgregado(consulta: ConsultaAgregado): HttpResourceRef<Agregado | undefined> {
  return httpResource<Agregado>(() => urlAgregado(consulta), {
    parse: (resposta) => lerAgregado(resposta as RespostaVariavel[]),
  });
}

const INDICADOR = Object.fromEntries(INDICADORES_UF.map((i) => [i.id, i])) as Record<IdIndicadorUf, IndicadorUf>;

/**
 * Painel do IBGE: indicadores do Brasil ou de uma UF, séries históricas, mapa, ranking e tabela.
 * A UF escolhida fica na URL (?uf=RJ), então o recorte pode ser compartilhado por link.
 */
@Component({
  selector: 'mi-ibge-painel',
  imports: [KpiCard, LineChart, MapaUf, BarList, DataTable, Card, Badge, Segmented, Skeleton, ErrorState],
  templateUrl: './ibge-painel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IbgePainel {
  private readonly router = inject(Router);

  /**
   * Parâmetro de consulta ?uf=, ligado pelo router (withComponentInputBinding). Vem da URL, então é
   * tratado como não confiável: ?uf=RJ&uf=SP chega como lista e vira vazio (Brasil).
   */
  readonly uf = input('', { transform: (valor: unknown) => (typeof valor === 'string' ? valor : '') });

  protected readonly ufs = UFS;
  protected readonly recursos: Record<IdIndicadorUf, HttpResourceRef<Agregado | undefined>> = {
    populacao: recursoAgregado(INDICADOR.populacao.consulta),
    desocupacao: recursoAgregado(INDICADOR.desocupacao.consulta),
    pib: recursoAgregado(INDICADOR.pib.consulta),
  };
  protected readonly ipca = recursoAgregado(IPCA.consulta);

  protected readonly ufSelecionada = computed(() => ufPorSigla(this.uf()) ?? null);
  private readonly localidade = computed(() => this.ufSelecionada()?.codigo ?? ID_BRASIL);
  protected readonly nomeLocal = computed(() => this.ufSelecionada()?.nome ?? 'Brasil');

  protected readonly kpis = computed(() => [
    ...INDICADORES_UF.map((indicador) => {
      const recurso = this.recursos[indicador.id];
      return {
        id: indicador.id,
        rotulo: indicador.nome,
        recurso,
        resumo: resumir(valorDe(recurso)?.get(indicador.variavel), this.localidade(), indicador),
        formato: indicador.formato,
        formatoVariacao: indicador.formatoVariacao,
        sentidoBom: indicador.sentidoBom,
      };
    }),
    {
      id: 'ipca',
      rotulo: 'IPCA em 12 meses',
      recurso: this.ipca,
      resumo: resumir(valorDe(this.ipca)?.get(IPCA.acumulado12Meses), ID_BRASIL, {
        periodicidade: 'mensal',
        multiplicador: 1,
        formatoVariacao: 'pontos',
        comparacao: 1,
      }),
      formato: 'percentual' as const,
      formatoVariacao: 'pontos' as const,
      sentidoBom: 'baixa' as const,
    },
  ]);

  protected readonly seriesDesocupacao = computed<SerieGrafico[]>(() => {
    const variavel = valorDe(this.recursos.desocupacao)?.get(INDICADOR.desocupacao.variavel);
    const brasil = resumir(variavel, ID_BRASIL, INDICADOR.desocupacao);
    const uf = this.ufSelecionada();
    const daUf = uf && resumir(variavel, uf.codigo, INDICADOR.desocupacao);
    return [
      ...(brasil ? [{ nome: 'Brasil', pontos: brasil.pontos }] : []),
      ...(uf && daUf ? [{ nome: uf.nome, pontos: daUf.pontos }] : []),
    ];
  });

  protected readonly seriesIpca = computed<SerieGrafico[]>(() => {
    const resumo = resumir(valorDe(this.ipca)?.get(IPCA.acumulado12Meses), ID_BRASIL, {
      periodicidade: 'mensal',
      multiplicador: 1,
      formatoVariacao: 'pontos',
      comparacao: 1,
    });
    return resumo ? [{ nome: 'IPCA acumulado em 12 meses', pontos: resumo.pontos }] : [];
  });

  protected readonly fonteIpca = IPCA.fonte;
  protected readonly fonteDesocupacao = INDICADOR.desocupacao.fonte;

  protected readonly opcoesMapa: OpcaoSegmented<IdIndicadorUf>[] = [
    { valor: 'populacao', rotulo: 'População' },
    { valor: 'desocupacao', rotulo: 'Desocupação' },
    { valor: 'pib', rotulo: 'PIB' },
  ];
  protected readonly indicadorMapa = signal<IdIndicadorUf>('populacao');
  protected readonly definicaoMapa = computed(() => INDICADOR[this.indicadorMapa()]);
  protected readonly recursoMapa = computed(() => this.recursos[this.indicadorMapa()]);

  protected readonly valoresMapa = computed(() => {
    const definicao = this.definicaoMapa();
    return valoresPorUf(valorDe(this.recursoMapa())?.get(definicao.variavel), definicao.multiplicador);
  });

  protected readonly referenciaMapa = computed(() => {
    const definicao = this.definicaoMapa();
    return resumir(valorDe(this.recursoMapa())?.get(definicao.variavel), ID_BRASIL, definicao)?.referencia ?? '';
  });

  protected readonly ranking = computed<ItemBarra[]>(() =>
    this.valoresMapa().flatMap((item) =>
      item.valor === null
        ? []
        : [{ rotulo: ufPorSigla(item.sigla)!.nome, valor: item.valor, destaque: item.sigla === this.ufSelecionada()?.sigla }],
    ),
  );

  protected readonly linhasTabela = computed<LinhaUf[]>(() => {
    const valores = (id: IdIndicadorUf) =>
      new Map(
        valoresPorUf(valorDe(this.recursos[id])?.get(INDICADOR[id].variavel), INDICADOR[id].multiplicador).map(
          (v) => [v.sigla, v.valor],
        ),
      );
    const populacao = valores('populacao');
    const desocupacao = valores('desocupacao');
    const pib = valores('pib');
    return UFS.map((uf) => ({
      uf,
      populacao: populacao.get(uf.sigla) ?? null,
      desocupacao: desocupacao.get(uf.sigla) ?? null,
      pib: pib.get(uf.sigla) ?? null,
    }));
  });

  protected readonly colunasTabela: ColunaTabela<LinhaUf>[] = [
    { id: 'uf', titulo: 'UF', valor: (l) => l.uf.nome },
    { id: 'regiao', titulo: 'Região', valor: (l) => l.uf.regiao },
    { id: 'populacao', titulo: 'População estimada', valor: (l) => l.populacao, formato: 'numero' },
    { id: 'desocupacao', titulo: 'Desocupação', valor: (l) => l.desocupacao, formato: 'percentual' },
    { id: 'pib', titulo: 'PIB', valor: (l) => l.pib, formato: 'moeda-compacta' },
  ];

  protected readonly fontesTabela = INDICADORES_UF.map((i) => i.fonte.replace('IBGE, ', '')).join('; ');

  protected selecionarUf(sigla: string | null): void {
    void this.router.navigate([], {
      queryParams: { uf: sigla || null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected alternarUfNoMapa(sigla: string): void {
    this.selecionarUf(this.ufSelecionada()?.sigla === sigla ? null : sigla);
  }

  protected escolherUfNaLista(evento: Event): void {
    this.selecionarUf((evento.target as HTMLSelectElement).value || null);
  }
}
