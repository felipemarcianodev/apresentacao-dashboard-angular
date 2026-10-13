import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Card } from '../card/card';
import { Skeleton } from './skeleton';

const CARREGANDO = `<mi-card titulo="Carregando indicador">
  <div class="grid gap-4">
    <mi-skeleton class="h-8 w-32" />
    <mi-skeleton linhas="3" />
    <mi-skeleton class="h-32" />
  </div>
</mi-card>`;

@Component({
  selector: 'mi-exemplo-skeleton-card',
  imports: [Skeleton, Card],
  template: CARREGANDO,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploCarregando {}

export const SKELETON_DOC: ComponentDoc = {
  slug: 'skeleton',
  nome: 'Skeleton',
  seletor: 'mi-skeleton',
  categoria: 'Primitivos',
  resumo: 'Espaço reservado com o formato do conteúdo enquanto o dado carrega.',
  descricao: [
    'O tamanho é definido por classe no próprio elemento (h-32, w-40), assim o skeleton ocupa o mesmo espaço do conteúdo final e a página não pula quando o dado chega.',
    'Com o input linhas, desenha um bloco de texto com a última linha mais curta.',
  ],
  importacao: "import { Skeleton } from './ui/skeleton/skeleton';",
  entradas: [
    { nome: 'linhas', tipo: 'number', padrao: '0', descricao: 'Quantidade de linhas de texto. Zero desenha um bloco único.' },
  ],
  saidas: [],
  exemplos: [{ titulo: 'Card carregando', componente: ExemploCarregando, codigo: CARREGANDO }],
  acessibilidade: [
    'O skeleton é aria-hidden. Anuncie o carregamento no contêiner com aria-busy="true".',
    'A animação de pulso é desligada com prefers-reduced-motion.',
  ],
};
