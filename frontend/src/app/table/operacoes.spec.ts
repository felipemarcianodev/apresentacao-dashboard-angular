import { ColunaTabela } from './coluna-tabela.model';
import { filtrarLinhas, gerarCsv, normalizar, ordenarLinhas } from './operacoes';

interface Cidade {
  nome: string;
  uf: string;
  populacao: number | null;
}

const LINHAS: Cidade[] = [
  { nome: 'São Paulo', uf: 'SP', populacao: 11451999 },
  { nome: 'Niterói', uf: 'RJ', populacao: 481758 },
  { nome: 'Belém', uf: 'PA', populacao: null },
  { nome: 'Rio de Janeiro', uf: 'RJ', populacao: 6211223 },
];

const COLUNAS: ColunaTabela<Cidade>[] = [
  { id: 'nome', titulo: 'Município', valor: (c) => c.nome },
  { id: 'uf', titulo: 'UF', valor: (c) => c.uf },
  { id: 'populacao', titulo: 'População', valor: (c) => c.populacao },
];

describe('operações da tabela', () => {
  it('normaliza acento e caixa', () => {
    expect(normalizar('  São Paulo ')).toBe('sao paulo');
  });

  it('busca em qualquer coluna, ignorando acento', () => {
    expect(filtrarLinhas(LINHAS, COLUNAS, 'niteroi').map((c) => c.nome)).toEqual(['Niterói']);
    expect(filtrarLinhas(LINHAS, COLUNAS, 'rj').length).toBe(2);
    expect(filtrarLinhas(LINHAS, COLUNAS, '').length).toBe(4);
  });

  it('busca também no número formatado', () => {
    expect(filtrarLinhas(LINHAS, COLUNAS, '481.758').map((c) => c.nome)).toEqual(['Niterói']);
  });

  it('ordena números como números e deixa vazios no fim nas duas direções', () => {
    const asc = ordenarLinhas(LINHAS, COLUNAS, { coluna: 'populacao', direcao: 'asc' });
    expect(asc.map((c) => c.nome)).toEqual(['Niterói', 'Rio de Janeiro', 'São Paulo', 'Belém']);
    const desc = ordenarLinhas(LINHAS, COLUNAS, { coluna: 'populacao', direcao: 'desc' });
    expect(desc.map((c) => c.nome)).toEqual(['São Paulo', 'Rio de Janeiro', 'Niterói', 'Belém']);
  });

  it('ordena texto pela regra do português', () => {
    const asc = ordenarLinhas(LINHAS, COLUNAS, { coluna: 'nome', direcao: 'asc' });
    expect(asc.map((c) => c.nome)).toEqual(['Belém', 'Niterói', 'Rio de Janeiro', 'São Paulo']);
  });

  it('ordena pela chave de ordenação quando a coluna define uma', () => {
    const meses = [{ mes: '2026-09', rotulo: 'set/26' }, { mes: '2026-04', rotulo: 'abr/26' }, { mes: '2025-12', rotulo: 'dez/25' }];
    const coluna = { id: 'mes', titulo: 'Mês', valor: (m: (typeof meses)[number]) => m.rotulo, chaveOrdenacao: (m: (typeof meses)[number]) => m.mes };
    expect(ordenarLinhas(meses, [coluna], { coluna: 'mes', direcao: 'asc' }).map((m) => m.rotulo)).toEqual(['dez/25', 'abr/26', 'set/26']);
  });

  it('não altera a lista original', () => {
    ordenarLinhas(LINHAS, COLUNAS, { coluna: 'nome', direcao: 'desc' });
    expect(LINHAS[0].nome).toBe('São Paulo');
  });

  it('neutraliza texto que o Excel executaria como fórmula', () => {
    const csv = gerarCsv(COLUNAS, [{ nome: '=HYPERLINK("http://x")', uf: '+1', populacao: -5 }]);
    expect(csv.split('\r\n')[1]).toBe(`"'=HYPERLINK(""http://x"")";'+1;-5`);
  });

  it('gera CSV para o Excel em português', () => {
    const csv = gerarCsv(COLUNAS, [LINHAS[1], { nome: 'Cidade "Nova"; teste', uf: 'XX', populacao: 1.5 }]);
    expect(csv.startsWith('﻿')).toBeTrue();
    expect(csv.slice(1).split('\r\n')).toEqual([
      'Município;UF;População',
      'Niterói;RJ;481758',
      '"Cidade ""Nova""; teste";XX;1,5',
    ]);
  });
});
