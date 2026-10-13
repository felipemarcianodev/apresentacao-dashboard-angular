import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Button } from './button';

const VARIANTES = `<div class="flex flex-wrap gap-3">
  <button miButton>Primário</button>
  <button miButton variante="secundario">Secundário</button>
  <button miButton variante="fantasma">Fantasma</button>
  <button miButton variante="perigo">Perigo</button>
</div>`;

@Component({
  selector: 'mi-exemplo-button-variantes',
  imports: [Button],
  template: VARIANTES,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploVariantes {}

const ICONE_E_CARREGANDO = `<div class="flex flex-wrap items-center gap-3">
  <button miButton variante="secundario" tamanho="sm" icone="fa-download">Exportar CSV</button>
  <button miButton [carregando]="carregando()" (click)="atualizar()">
    {{ carregando() ? 'Atualizando' : 'Atualizar dados' }}
  </button>
  <a miButton variante="fantasma" href="https://www.ibge.gov.br" target="_blank" rel="noopener noreferrer">
    Link com cara de botão
  </a>
</div>`;

@Component({
  selector: 'mi-exemplo-button-icone',
  imports: [Button],
  template: ICONE_E_CARREGANDO,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploIcone {
  protected readonly carregando = signal(false);

  protected atualizar(): void {
    this.carregando.set(true);
    setTimeout(() => this.carregando.set(false), 1500);
  }
}

export const BUTTON_DOC: ComponentDoc = {
  slug: 'button',
  nome: 'Button',
  seletor: 'button[miButton], a[miButton]',
  categoria: 'Primitivos',
  resumo: 'Botão e link de ação com variantes, tamanhos, ícone e estado de carregamento.',
  descricao: [
    'É um seletor de atributo: o elemento continua sendo um button ou um a nativo, com teclado, foco, submit de formulário e leitor de tela funcionando sem código extra.',
    'Use primário para a ação principal da tela (uma por área), secundário para as demais, fantasma para ações de baixa ênfase e perigo só para o que apaga ou desfaz.',
  ],
  importacao: "import { Button } from './ui/button/button';",
  entradas: [
    { nome: 'variante', tipo: "'primario' | 'secundario' | 'fantasma' | 'perigo'", padrao: "'primario'", descricao: 'Peso visual da ação.' },
    { nome: 'tamanho', tipo: "'sm' | 'md'", padrao: "'md'", descricao: 'sm tem 40 px de altura, o mínimo confortável para o toque; md tem 44 px.' },
    { nome: 'icone', tipo: 'string', padrao: "''", descricao: 'Classe de ícone do Font Awesome (fa-download), exibida antes do texto.' },
    { nome: 'carregando', tipo: 'boolean', padrao: 'false', descricao: 'Troca o ícone por um spinner e marca aria-busy. Desabilite o botão junto se a ação não puder repetir.' },
  ],
  saidas: [],
  conteudo: [{ nome: 'padrão', tipo: 'texto', descricao: 'Rótulo do botão.' }],
  exemplos: [
    { titulo: 'Variantes', componente: ExemploVariantes, codigo: VARIANTES },
    {
      titulo: 'Ícone, carregamento e link',
      descricao: 'Clique em "Atualizar dados" para ver o estado de carregamento.',
      componente: ExemploIcone,
      codigo: ICONE_E_CARREGANDO,
    },
  ],
  acessibilidade: [
    'Botão só com ícone precisa de aria-label descrevendo a ação.',
    'O ícone é decorativo (aria-hidden); o texto é que nomeia a ação.',
    'Em link com target="_blank", mantenha rel="noopener noreferrer".',
  ],
};
