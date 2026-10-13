import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Card } from '../card/card';
import { ErrorState } from './error-state';

const FALHA = `<mi-card>
  <mi-error-state (tentarDeNovo)="tentativas.set(tentativas() + 1)" />
  <p class="text-center text-xs text-muted">Tentativas: {{ tentativas() }}</p>
</mi-card>`;

@Component({
  selector: 'mi-exemplo-error-state',
  imports: [ErrorState, Card],
  template: FALHA,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploFalha {
  protected readonly tentativas = signal(0);
}

export const ERROR_STATE_DOC: ComponentDoc = {
  slug: 'error-state',
  nome: 'ErrorState',
  seletor: 'mi-error-state',
  categoria: 'Primitivos',
  resumo: 'Estado de erro com mensagem clara e o botão "Tentar de novo".',
  descricao: [
    'Usado quando a fonte de dados não responde. Com httpResource, ligue a saída tentarDeNovo ao método reload() do resource.',
    'A mensagem nunca mostra detalhe técnico (status, URL, stack).',
  ],
  importacao: "import { ErrorState } from './ui/error-state/error-state';",
  entradas: [
    { nome: 'titulo', tipo: 'string', padrao: "'Não foi possível carregar os dados'", descricao: 'O que falhou.' },
    { nome: 'descricao', tipo: 'string', padrao: "'A fonte não respondeu...'", descricao: 'O que o usuário pode fazer.' },
  ],
  saidas: [{ nome: 'tentarDeNovo', tipo: 'void', descricao: 'Emitido no clique do botão.' }],
  exemplos: [{ titulo: 'Fonte fora do ar', componente: ExemploFalha, codigo: FALHA }],
  acessibilidade: ['O componente tem role="alert": o leitor de tela anuncia o erro assim que ele aparece.'],
};
