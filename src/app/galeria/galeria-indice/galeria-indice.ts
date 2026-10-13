import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlocoCodigo } from '../bloco-codigo/bloco-codigo';
import { CATEGORIAS, DOCS } from '../docs';

const PRIMEIROS_PASSOS = `// 1. Copie a pasta do componente (ex.: src/app/ui/card) para o seu projeto.
// 2. Traga os tokens de src/styles.css (bloco @theme e a classe .dark).
// 3. Instale o Font Awesome: npm i @fortawesome/fontawesome-free
// 4. Importe o componente standalone onde for usar:
import { Card } from './ui/card/card';

@Component({
  imports: [Card],
  template: \`<mi-card titulo="Meu indicador" fonte="Minha fonte">...</mi-card>\`,
})
export class MinhaTela {}`;

/** Página inicial da galeria: como reaproveitar o kit e a lista de componentes por categoria. */
@Component({
  selector: 'mi-galeria-indice',
  imports: [RouterLink, BlocoCodigo],
  templateUrl: './galeria-indice.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GaleriaIndice {
  protected readonly primeirosPassos = PRIMEIROS_PASSOS;
  protected readonly grupos = CATEGORIAS.map((categoria) => ({
    categoria,
    docs: DOCS.filter((doc) => doc.categoria === categoria),
  })).filter((grupo) => grupo.docs.length > 0);
}
