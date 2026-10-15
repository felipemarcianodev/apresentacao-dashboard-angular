import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlocoCodigo } from '../../galeria/bloco-codigo/bloco-codigo';
import { Badge } from '../../ui/badge/badge';
import { EmptyState } from '../../ui/empty-state/empty-state';
import { areaDoArquivo, ordemDaArea } from '../areas';
import { CATALOGO } from '../catalogo';
import { codigoDoTeste } from '../codigo-do-teste';
import { buscarPersona } from '../personas';

/** /testes/:persona: os cenários de uma persona, agrupados pela área do site que cada arquivo cobre. */
@Component({
  selector: 'mi-pagina-persona',
  imports: [RouterLink, BlocoCodigo, Badge, EmptyState],
  templateUrl: './pagina-persona.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginaPersona {
  /** Vem do parâmetro :persona da rota (withComponentInputBinding). */
  readonly persona = input.required<string>();

  protected readonly dados = computed(() => buscarPersona(this.persona()));

  protected readonly comando = computed(() => `npx playwright test --grep @${this.dados()?.id ?? ''}`);

  protected readonly areas = computed(() => {
    const persona = this.dados();
    if (!persona) {
      return [];
    }
    const cenarios = CATALOGO.filter((cenario) => cenario.personas.includes(persona.id));
    const arquivos = [...new Set(cenarios.map((cenario) => cenario.arquivo))].sort(
      (a, b) => ordemDaArea(a) - ordemDaArea(b),
    );
    return arquivos.map((arquivo) => ({
      arquivo,
      nome: areaDoArquivo(arquivo),
      cenarios: cenarios
        .filter((cenario) => cenario.arquivo === arquivo)
        .map((cenario) => ({
          ...cenario,
          codigo: codigoDoTeste(cenario),
          outras: cenario.personas.filter((id) => id !== persona.id).map((id) => buscarPersona(id)?.nome ?? id),
        })),
    }));
  });

  protected readonly total = computed(() => this.areas().reduce((soma, area) => soma + area.cenarios.length, 0));
}
