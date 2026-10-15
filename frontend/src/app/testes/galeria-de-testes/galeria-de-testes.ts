import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlocoCodigo } from '../../galeria/bloco-codigo/bloco-codigo';
import { CATALOGO } from '../catalogo';
import { CATEGORIAS_PERSONA, PERSONAS } from '../personas';

const PRIMEIRO_COMANDO = `cd frontend
npx playwright install chromium
npx playwright test --grep @celular   # só os cenários de uma persona`;

/**
 * /testes: índice da galeria de testes, no formato da galeria /ui. Personas por categoria, cada
 * uma com a própria página (/testes/:persona), a partir do catálogo gerado dos specs.
 */
@Component({
  selector: 'mi-galeria-de-testes',
  imports: [RouterLink, BlocoCodigo],
  templateUrl: './galeria-de-testes.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaleriaDeTestes {
  protected readonly total = CATALOGO.length;
  protected readonly arquivos = new Set(CATALOGO.map((cenario) => cenario.arquivo)).size;
  protected readonly primeiroComando = PRIMEIRO_COMANDO;
  protected readonly grupos = CATEGORIAS_PERSONA.map((categoria) => ({
    categoria,
    personas: PERSONAS.filter((persona) => persona.categoria === categoria).map((persona) => ({
      ...persona,
      quantidade: CATALOGO.filter((cenario) => cenario.personas.includes(persona.id)).length,
    })),
  }));
}
