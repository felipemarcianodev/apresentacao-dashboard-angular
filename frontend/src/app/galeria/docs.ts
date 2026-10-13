import { BAR_LIST_DOC } from '../charts/bar-list/bar-list.doc';
import { KPI_CARD_DOC } from '../charts/kpi-card/kpi-card.doc';
import { LINE_CHART_DOC } from '../charts/line-chart/line-chart.doc';
import { MAPA_UF_DOC } from '../charts/mapa-uf/mapa-uf.doc';
import { SPARKLINE_DOC } from '../charts/sparkline/sparkline.doc';
import { DATA_TABLE_DOC } from '../table/data-table/data-table.doc';
import { BADGE_DOC } from '../ui/badge/badge.doc';
import { BUTTON_DOC } from '../ui/button/button.doc';
import { CARD_DOC } from '../ui/card/card.doc';
import { EMPTY_STATE_DOC } from '../ui/empty-state/empty-state.doc';
import { ERROR_STATE_DOC } from '../ui/error-state/error-state.doc';
import { MENU_HAMBURGUER_DOC } from '../ui/menu-hamburguer/menu-hamburguer.doc';
import { SEGMENTED_DOC } from '../ui/segmented/segmented.doc';
import { SKELETON_DOC } from '../ui/skeleton/skeleton.doc';
import { CategoriaDoc, ComponentDoc } from './component-doc.model';

/** Registro de todas as documentações. Componente novo do kit entra aqui no mesmo commit. */
export const DOCS: readonly ComponentDoc[] = [
  BUTTON_DOC,
  BADGE_DOC,
  CARD_DOC,
  SEGMENTED_DOC,
  SKELETON_DOC,
  EMPTY_STATE_DOC,
  ERROR_STATE_DOC,
  MENU_HAMBURGUER_DOC,
  KPI_CARD_DOC,
  SPARKLINE_DOC,
  LINE_CHART_DOC,
  BAR_LIST_DOC,
  MAPA_UF_DOC,
  DATA_TABLE_DOC,
];

export const CATEGORIAS: readonly CategoriaDoc[] = ['Primitivos', 'Gráficos', 'Dados'];

export function buscarDoc(slug: string): ComponentDoc | undefined {
  return DOCS.find((doc) => doc.slug === slug);
}
