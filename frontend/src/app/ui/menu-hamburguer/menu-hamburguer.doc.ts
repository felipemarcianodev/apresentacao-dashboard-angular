import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { MenuHamburguer } from './menu-hamburguer';

const GAVETA = `<div class="grid gap-3">
  <button miMenuHamburguer controla="exemplo-menu" [aberto]="aberto()" (click)="aberto.set(!aberto())"></button>
  @if (aberto()) {
    <nav id="exemplo-menu" aria-label="Exemplo" class="grid w-56 gap-1 rounded-lg border border-line bg-surface p-2 text-sm">
      <a class="rounded-md px-3 py-2 hover:bg-sunken" href="#">Painel do IBGE</a>
      <a class="rounded-md px-3 py-2 hover:bg-sunken" href="#">Painel do Banco Central</a>
    </nav>
  }
</div>`;

@Component({
  selector: 'mi-exemplo-menu-hamburguer',
  imports: [MenuHamburguer],
  template: GAVETA,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploGaveta {
  protected readonly aberto = signal(false);
}

const ROTULO = `<div class="flex items-center gap-3">
  <button miMenuHamburguer rotulo="Filtros" [aberto]="filtros()" (click)="filtros.set(!filtros())"></button>
  <span class="text-sm text-muted">Filtros {{ filtros() ? 'abertos' : 'fechados' }}</span>
</div>`;

@Component({
  selector: 'mi-exemplo-menu-hamburguer-rotulo',
  imports: [MenuHamburguer],
  template: ROTULO,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploRotulo {
  protected readonly filtros = signal(true);
}

export const MENU_HAMBURGUER_DOC: ComponentDoc = {
  slug: 'menu-hamburguer',
  nome: 'MenuHamburguer',
  seletor: 'button[miMenuHamburguer]',
  categoria: 'Primitivos',
  resumo: 'Botão de menu: três barras que viram um X, com aria-expanded e aria-controls.',
  descricao: [
    'É um seletor de atributo sobre o button nativo: teclado e foco funcionam sem código extra. Quem usa guarda o estado (um signal), liga o clique e informa se o menu está aberto; o componente desenha o ícone e mantém os atributos de acessibilidade.',
    'No Mirante, ele abre a gaveta da barra lateral no celular (com o X) e, no desktop, recolhe a barra para uma faixa de ícones (com virarX desligado, as barras ficam).',
  ],
  importacao: "import { MenuHamburguer } from './ui/menu-hamburguer/menu-hamburguer';",
  entradas: [
    { nome: 'aberto', tipo: 'boolean', padrao: 'false', descricao: 'Se o menu controlado está aberto. Vira aria-expanded e troca as barras pelo X.' },
    { nome: 'controla', tipo: 'string', padrao: "''", descricao: 'id do elemento que o botão abre e fecha, ligado por aria-controls.' },
    { nome: 'rotulo', tipo: 'string', padrao: "'Menu'", descricao: 'Nome acessível do botão. Não muda com o estado: quem informa aberto ou fechado é o aria-expanded.' },
    { nome: 'virarX', tipo: 'boolean', padrao: 'true', descricao: 'Troca as barras pelo X quando aberto. Desligue quando o menu aberto não cobre a tela, como uma barra lateral fixa no desktop.' },
  ],
  saidas: [],
  conteudo: [],
  exemplos: [
    {
      titulo: 'Abrindo um menu',
      descricao: 'Clique para abrir e fechar. O botão aponta para o menu por aria-controls.',
      componente: ExemploGaveta,
      codigo: GAVETA,
    },
    { titulo: 'Outro nome acessível', componente: ExemploRotulo, codigo: ROTULO },
  ],
  acessibilidade: [
    'O botão tem 40 px, o alvo de toque mínimo do kit, e foco visível pelo teclado.',
    'aria-expanded acompanha o estado; o nome acessível fica fixo, para o leitor de tela não anunciar duas coisas diferentes.',
    'O desenho das barras é aria-hidden e a animação respeita prefers-reduced-motion.',
    'Fica com quem usa: dar um id ao elemento controlado e devolver o foco a um lugar sensato quando o menu fechar.',
  ],
};
