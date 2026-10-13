import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Badge } from './badge';

const TONS = `<div class="flex flex-wrap gap-2">
  <mi-badge>Neutro</mi-badge>
  <mi-badge tom="info">IBGE</mi-badge>
  <mi-badge tom="sucesso" icone="fa-arrow-up">Alta de 0,4%</mi-badge>
  <mi-badge tom="alerta">Dado preliminar</mi-badge>
  <mi-badge tom="perigo" icone="fa-arrow-down">Queda de 1,2%</mi-badge>
  <mi-badge tom="violeta">Estimativa</mi-badge>
</div>`;

@Component({
  selector: 'mi-exemplo-badge-tons',
  imports: [Badge],
  template: TONS,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploTons {}

export const BADGE_DOC: ComponentDoc = {
  slug: 'badge',
  nome: 'Badge',
  seletor: 'mi-badge',
  categoria: 'Primitivos',
  resumo: 'Selo curto para status, variação ou categoria.',
  descricao: [
    'Os tons seguem as cores semânticas do tema e funcionam no claro e no escuro.',
    'Use para informação que precisa ser vista de relance: variação de um indicador, dado preliminar, fonte.',
  ],
  importacao: "import { Badge } from './ui/badge/badge';",
  entradas: [
    { nome: 'tom', tipo: "'neutro' | 'info' | 'sucesso' | 'alerta' | 'perigo' | 'violeta'", padrao: "'neutro'", descricao: 'Cor semântica do selo.' },
    { nome: 'icone', tipo: 'string', padrao: "''", descricao: 'Classe de ícone do Font Awesome, exibida antes do texto.' },
  ],
  saidas: [],
  conteudo: [{ nome: 'padrão', tipo: 'texto', descricao: 'Texto do selo. Curto, de uma a três palavras.' }],
  exemplos: [{ titulo: 'Tons', componente: ExemploTons, codigo: TONS }],
  acessibilidade: [
    'A cor nunca é a única pista: o texto repete o significado ("Alta", "Queda").',
    'Contraste AA verificado nos dois temas para todos os tons.',
  ],
};
