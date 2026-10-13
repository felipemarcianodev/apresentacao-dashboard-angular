import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Button } from '../button/button';
import { Card } from '../card/card';
import { EmptyState } from './empty-state';

const SEM_RESULTADO = `<mi-card>
  <mi-empty-state
    icone="fa-filter-circle-xmark"
    titulo="Nenhuma UF encontrada"
    descricao="Nenhuma unidade da federação corresponde ao filtro aplicado."
  >
    <button miButton variante="secundario" tamanho="sm">Limpar filtro</button>
  </mi-empty-state>
</mi-card>`;

@Component({
  selector: 'mi-exemplo-empty-state',
  imports: [EmptyState, Button, Card],
  template: SEM_RESULTADO,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploSemResultado {}

export const EMPTY_STATE_DOC: ComponentDoc = {
  slug: 'empty-state',
  nome: 'EmptyState',
  seletor: 'mi-empty-state',
  categoria: 'Primitivos',
  resumo: 'Estado vazio que explica o que apareceria ali e como chegar lá.',
  descricao: [
    'Toda lista, tabela e gráfico do Mirante trata o vazio com este componente: nada de área em branco.',
    'O conteúdo projetado vira a ação (limpar filtro, mudar período).',
  ],
  importacao: "import { EmptyState } from './ui/empty-state/empty-state';",
  entradas: [
    { nome: 'titulo', tipo: 'string', obrigatoria: true, descricao: 'O que está vazio, dito do jeito do usuário.' },
    { nome: 'descricao', tipo: 'string', padrao: "''", descricao: 'Por que está vazio ou o que fazer.' },
    { nome: 'icone', tipo: 'string', padrao: "'fa-inbox'", descricao: 'Classe de ícone do Font Awesome.' },
  ],
  saidas: [],
  conteudo: [{ nome: 'padrão', tipo: 'conteúdo', descricao: 'Ações sugeridas, em geral um botão.' }],
  exemplos: [{ titulo: 'Filtro sem resultado', componente: ExemploSemResultado, codigo: SEM_RESULTADO }],
  acessibilidade: ['O ícone é decorativo; título e descrição carregam a mensagem.'],
};
