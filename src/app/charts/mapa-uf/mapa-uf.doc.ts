import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { UFS } from '../../core/brasil/ufs';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Card } from '../../ui/card/card';
import { MapaUf, ValorUf } from './mapa-uf';

const MAPA = `<mi-card titulo="Índice por UF" descricao="Exemplo ilustrativo; clique numa UF">
  <mi-mapa-uf
    rotulo="Índice ilustrativo por UF"
    formato="decimal"
    [valores]="valores"
    [selecionada]="uf()"
    (selecionar)="uf.set($event)"
  />
  <p class="mt-3 text-sm text-muted">UF selecionada: {{ uf() ?? 'nenhuma' }}</p>
</mi-card>`;

@Component({
  selector: 'mi-exemplo-mapa-uf',
  imports: [MapaUf, Card],
  template: MAPA,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploMapa {
  /** Valores fictícios e determinísticos, só para mostrar a escala de cor. */
  protected readonly valores: ValorUf[] = UFS.map((uf, i) => ({
    sigla: uf.sigla,
    valor: uf.sigla === 'RR' ? null : Math.round(((Number(uf.codigo) * 37) % 100) + i) / 10,
  }));
  protected readonly uf = signal<string | null>(null);
}

export const MAPA_UF_DOC: ComponentDoc = {
  slug: 'mapa-uf',
  nome: 'MapaUf',
  seletor: 'mi-mapa-uf',
  categoria: 'Gráficos',
  resumo: 'Mapa coroplético do Brasil por UF, com legenda, detalhe e seleção.',
  descricao: [
    'A malha vem de public/geo/br-uf.json, gerada a partir da API de malhas do IBGE com coordenadas arredondadas. Ela é empacotada com o app: o mapa não depende de rede externa nem injeta SVG de fora.',
    'As cores são cinco classes por quantil (cada faixa recebe um número parecido de UFs), o que dá contraste mesmo quando um estado concentra o valor. UF sem dado aparece neutra e na legenda.',
    'A projeção é uma equiretangular corrigida pela latitude, calculada em projecao.ts sem biblioteca.',
  ],
  importacao: "import { MapaUf, ValorUf } from './charts/mapa-uf/mapa-uf';",
  entradas: [
    { nome: 'valores', tipo: 'readonly ValorUf[]', obrigatoria: true, descricao: 'Lista de { sigla, valor }. UF ausente ou null fica sem dado.' },
    { nome: 'rotulo', tipo: 'string', obrigatoria: true, descricao: 'Nome do mapa para leitor de tela.' },
    { nome: 'formato', tipo: 'FormatoNumero', padrao: "'numero'", descricao: 'Formato dos valores no detalhe e na legenda.' },
    { nome: 'selecionada', tipo: 'string | null', padrao: 'null', descricao: 'Sigla da UF com contorno de seleção.' },
  ],
  saidas: [{ nome: 'selecionar', tipo: 'string', descricao: 'Sigla da UF clicada ou acionada com Enter.' }],
  exemplos: [{ titulo: 'Seleção de UF', componente: ExemploMapa, codigo: MAPA }],
  acessibilidade: [
    'Cada UF é um botão focável com nome e valor (aria-label) e estado aria-pressed.',
    'O painel de detalhe é aria-live: o valor da UF em foco é anunciado.',
    'A escala de cor inverte no tema escuro para manter o contraste com o fundo.',
  ],
};
