import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Badge } from '../../ui/badge/badge';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { BlocoCodigo } from '../bloco-codigo/bloco-codigo';
import { PropriedadeDoc } from '../component-doc.model';
import { buscarDoc } from '../docs';

interface SecaoApi {
  readonly titulo: string;
  readonly propriedades: readonly PropriedadeDoc[];
}

/** Página de documentação de um componente, no formato das páginas de referência do angular.dev. */
@Component({
  selector: 'mi-pagina-componente',
  imports: [NgComponentOutlet, RouterLink, BlocoCodigo, Badge, EmptyState],
  templateUrl: './pagina-componente.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaComponente {
  /** Vem do parâmetro :slug da rota (withComponentInputBinding). */
  readonly slug = input.required<string>();

  protected readonly doc = computed(() => buscarDoc(this.slug()));

  protected readonly secoesApi = computed<readonly SecaoApi[]>(() => {
    const doc = this.doc();
    if (!doc) {
      return [];
    }
    return [
      { titulo: 'Entradas', propriedades: doc.entradas },
      { titulo: 'Saídas', propriedades: doc.saidas },
      { titulo: 'Conteúdo projetado', propriedades: doc.conteudo ?? [] },
    ].filter((secao) => secao.propriedades.length > 0);
  });
}
