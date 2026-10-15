import { VERSAO } from '../core/versao/versao';
import { CenarioDeTeste } from './cenario-de-teste.model';

const REPOSITORIO = 'https://github.com/felipemarcianodev/apresentacao-dashboard-angular';

/** Endereço do teste no GitHub, na tag da versão no ar (as linhas batem com o código publicado). */
export function codigoDoTeste(cenario: CenarioDeTeste, versao = VERSAO): string {
  return `${REPOSITORIO}/blob/v${versao}/frontend/e2e/${cenario.arquivo}#L${cenario.linha}`;
}
