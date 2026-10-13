import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UFS, Uf } from '../../core/brasil/ufs';
import { ComponentDoc } from '../../galeria/component-doc.model';
import { Card } from '../../ui/card/card';
import { ColunaTabela } from '../coluna-tabela.model';
import { DataTable } from './data-table';

const UNIDADES = `<mi-card titulo="Unidades da federação" fonte="IBGE, códigos de UF">
  <mi-data-table
    rotulo="Unidades da federação"
    [linhas]="ufs"
    [colunas]="colunas"
    [tamanhoPagina]="8"
    exportavel
    nomeArquivo="ufs"
  />
</mi-card>`;

@Component({
  selector: 'mi-exemplo-data-table',
  imports: [DataTable, Card],
  template: UNIDADES,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploUnidades {
  protected readonly ufs = UFS;
  protected readonly colunas: ColunaTabela<Uf>[] = [
    { id: 'sigla', titulo: 'Sigla', valor: (uf) => uf.sigla },
    { id: 'nome', titulo: 'Nome', valor: (uf) => uf.nome },
    { id: 'regiao', titulo: 'Região', valor: (uf) => uf.regiao },
    { id: 'codigo', titulo: 'Código IBGE', valor: (uf) => Number(uf.codigo), alinhamento: 'direita' },
  ];
}

const COMPACTA = `<mi-data-table
  rotulo="Primeiras UFs, sem busca"
  [linhas]="ufs"
  [colunas]="colunas"
  densidade="compacta"
  [buscavel]="false"
  [tamanhoPagina]="5"
/>`;

@Component({
  selector: 'mi-exemplo-data-table-compacta',
  imports: [DataTable],
  template: COMPACTA,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ExemploCompacta {
  protected readonly ufs = UFS.slice(0, 10);
  protected readonly colunas: ColunaTabela<Uf>[] = [
    { id: 'sigla', titulo: 'Sigla', valor: (uf) => uf.sigla },
    { id: 'nome', titulo: 'Nome', valor: (uf) => uf.nome, ordenavel: false },
  ];
}

export const DATA_TABLE_DOC: ComponentDoc = {
  slug: 'data-table',
  nome: 'DataTable',
  seletor: 'mi-data-table',
  categoria: 'Dados',
  resumo: 'Tabela com busca sem acento, ordenação, paginação, CSV e cartões no celular.',
  descricao: [
    'As colunas são declaradas em TypeScript: cada uma diz como extrair o valor da linha. Número é ordenado como número, alinhado à direita e formatado em pt-BR; texto é ordenado pela regra do português (Belém antes de Niterói).',
    'A busca ignora acento e caixa e procura também no número formatado. Clicar no cabeçalho alterna entre crescente, decrescente e a ordem original; vazios ficam sempre no fim.',
    'A exportação gera CSV no formato do Excel em português (ponto e vírgula, vírgula decimal, acentos preservados) com todas as linhas filtradas, não só a página visível.',
    'Abaixo de 640 px cada linha vira um cartão com rótulo e valor, sem rolagem lateral.',
  ],
  importacao:
    "import { DataTable } from './table/data-table/data-table';\nimport { ColunaTabela } from './table/coluna-tabela.model';",
  entradas: [
    { nome: 'linhas', tipo: 'readonly T[]', obrigatoria: true, descricao: 'Dados da tabela.' },
    { nome: 'colunas', tipo: 'readonly ColunaTabela<T>[]', obrigatoria: true, descricao: '{ id, titulo, valor(linha), formato?, alinhamento?, ordenavel?, chaveOrdenacao? }. Use chaveOrdenacao quando o texto exibido não ordena certo (mês "set/26").' },
    { nome: 'rotulo', tipo: 'string', obrigatoria: true, descricao: 'Legenda da tabela para leitor de tela.' },
    { nome: 'tamanhoPagina', tipo: 'number', padrao: '10', descricao: 'Linhas por página.' },
    { nome: 'densidade', tipo: "'confortavel' | 'compacta'", padrao: "'confortavel'", descricao: 'Altura das linhas.' },
    { nome: 'buscavel', tipo: 'boolean', padrao: 'true', descricao: 'Mostra o campo de busca.' },
    { nome: 'exportavel', tipo: 'boolean', padrao: 'false', descricao: 'Mostra o botão Exportar CSV.' },
    { nome: 'nomeArquivo', tipo: 'string', padrao: "'dados'", descricao: 'Nome do CSV, sem extensão.' },
  ],
  saidas: [],
  exemplos: [
    { titulo: 'Busca, ordenação, paginação e CSV', componente: ExemploUnidades, codigo: UNIDADES },
    { titulo: 'Compacta e sem busca', componente: ExemploCompacta, codigo: COMPACTA },
  ],
  acessibilidade: [
    'Cabeçalhos ordenáveis são botões e o th informa o estado com aria-sort.',
    'O resumo da paginação ("1 a 10 de 27") é anunciado a cada troca (aria-live).',
    'O campo de busca tem rótulo oculto com o nome da tabela.',
    'No celular, cada cartão é uma lista de definição (dl) com rótulo e valor.',
  ],
};
