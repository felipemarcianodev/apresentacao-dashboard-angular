import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { ufPorCodigo } from '../../core/brasil/ufs';
import { FormatoNumero, SEM_DADO, formatar } from '../../core/formato/formato';
import { Skeleton } from '../../ui/skeleton/skeleton';
import { MalhaUf, classeDoValor, limitesPorQuantil, projetarMalha } from './projecao';

export interface ValorUf {
  readonly sigla: string;
  readonly valor: number | null;
}

/** Cinco classes, do claro ao escuro no tema claro, invertidas no escuro para manter o contraste. */
const CLASSES_COR = [
  'fill-primary-100 dark:fill-primary-900',
  'fill-primary-200 dark:fill-primary-800',
  'fill-primary-400 dark:fill-primary-600',
  'fill-primary-600 dark:fill-primary-400',
  'fill-primary-800 dark:fill-primary-200',
] as const;

const SEM_VALOR = 'fill-sunken';

/** Endereço da malha de UFs empacotada no kit (gerada a partir da API de malhas do IBGE). */
export const URL_MALHA_UF = 'geo/br-uf.json';

/**
 * Mapa coroplético do Brasil por UF. Classes por quantil, legenda com as faixas,
 * UF focável por teclado e selecionável por clique ou Enter.
 */
@Component({
  selector: 'mi-mapa-uf',
  imports: [Skeleton],
  templateUrl: './mapa-uf.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block' },
})
export class MapaUf {
  readonly valores = input.required<readonly ValorUf[]>();
  readonly rotulo = input.required<string>();
  readonly formato = input<FormatoNumero>('numero');
  readonly selecionada = input<string | null>(null);

  readonly selecionar = output<string>();

  protected readonly malha = httpResource<MalhaUf>(() => URL_MALHA_UF);
  protected readonly ufEmFoco = signal<string | null>(null);

  protected readonly mapa = computed(() => (this.malha.hasValue() ? projetarMalha(this.malha.value()) : null));

  private readonly valorPorSigla = computed(
    () => new Map(this.valores().map((item) => [item.sigla.toUpperCase(), item.valor])),
  );

  private readonly limites = computed(() =>
    limitesPorQuantil(
      this.valores().map((item) => item.valor ?? Number.NaN),
      CLASSES_COR.length,
    ),
  );

  protected readonly ufs = computed(() => {
    const mapa = this.mapa();
    if (!mapa) {
      return [];
    }
    return mapa.ufs.flatMap((projetada) => {
      const uf = ufPorCodigo(projetada.codigo);
      if (!uf) {
        return [];
      }
      const valor = this.valorPorSigla().get(uf.sigla) ?? null;
      const cor = valor === null ? SEM_VALOR : CLASSES_COR[classeDoValor(valor, this.limites())];
      return [{ ...uf, caminho: projetada.caminho, valor, texto: formatar(valor, this.formato()), cor }];
    });
  });

  protected readonly legenda = computed(() => {
    const finitos = this.valores()
      .map((item) => item.valor)
      .filter((valor): valor is number => valor !== null && Number.isFinite(valor));
    if (finitos.length === 0) {
      return [];
    }
    const pontos = [Math.min(...finitos), ...this.limites(), Math.max(...finitos)];
    return CLASSES_COR.map((cor, i) => ({
      cor,
      texto: `${formatar(pontos[i], this.formato())} a ${formatar(pontos[i + 1], this.formato())}`,
    }));
  });

  protected readonly detalhe = computed(() => {
    const sigla = this.ufEmFoco() ?? this.selecionada();
    return this.ufs().find((uf) => uf.sigla === sigla) ?? null;
  });

  protected readonly semDado = SEM_DADO;

  protected escolher(sigla: string): void {
    this.selecionar.emit(sigla);
  }

  protected escolherComTeclado(evento: KeyboardEvent, sigla: string): void {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      this.selecionar.emit(sigla);
    }
  }
}
