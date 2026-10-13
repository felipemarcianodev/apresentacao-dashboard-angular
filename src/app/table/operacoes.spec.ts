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

  it('não altera a lista original', () => {
    ordenarLinhas(LINHAS, COLUNAS, { coluna: 'nome', direcao: 'desc' });
    expect(LINHAS[0].nome).toBe('São Paulo');
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
