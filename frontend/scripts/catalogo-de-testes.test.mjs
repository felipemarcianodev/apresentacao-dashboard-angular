// Testes do gerador do catálogo de testes (node --test, dentro do npm run test:ci).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cenarios, gerarFonte, personasConhecidas, problemas } from './catalogo-de-testes.mjs';

const spec = (title, line, tags, file = 'paineis.spec.ts') => ({ title, line, tags, file, tests: [] });
const LISTAGEM = {
  suites: [
    {
      title: 'paineis.spec.ts',
      specs: [spec('solto', 3, ['visitante'])],
      suites: [
        {
          title: 'painel do IBGE',
          specs: [spec('mostra', 10, ['visitante', 'celular']), spec('mostra', 10, ['visitante', 'celular'])],
          suites: [{ title: 'interno', specs: [spec("com 'aspas'", 20, [])] }],
        },
      ],
    },
  ],
};

test('achata a listagem com o grupo e tira a repetição dos projetos', () => {
  const lista = cenarios(LISTAGEM);
  assert.deepEqual(
    lista.map((c) => [c.grupo, c.titulo, c.personas]),
    [
      ['', 'solto', ['visitante']],
      ['painel do IBGE', 'mostra', ['celular', 'visitante']],
      ['painel do IBGE › interno', "com 'aspas'", []],
    ],
  );
});

test('mesmo título e linha em grupos diferentes são cenários diferentes', () => {
  const dois = {
    suites: [
      { title: 'a.spec.ts', suites: [1, 2].map((n) => ({ title: `tema ${n}`, specs: [spec('igual', 5, ['x'])] })) },
    ],
  };
  assert.equal(cenarios(dois).length, 2);
});

test('acusa teste sem persona e persona desconhecida', () => {
  const erros = problemas(cenarios(LISTAGEM), ['visitante']);
  assert.equal(erros.length, 2);
  assert.match(erros[0], /celular/);
  assert.match(erros[1], /sem persona/);
});

test('gera TypeScript com aspas escapadas', () => {
  const fonte = gerarFonte(cenarios(LISTAGEM));
  assert.match(fonte, /titulo: 'com \\'aspas\\'',/);
  assert.match(fonte, /export const CATALOGO: readonly CenarioDeTeste\[\] = \[/);
});

test('título estranho vira literal válido, com o mesmo texto', () => {
  const titulo = "linha 1\nlinha 2\r 'aspas' \\ ${x} \u2028 fim";
  const fonte = gerarFonte([{ arquivo: 'a.spec.ts', linha: 1, grupo: '', titulo, personas: ['x'] }]);
  const literal = /titulo: ('.*'),\n/.exec(fonte)[1];
  assert.equal(new Function(`return ${literal};`)(), titulo);
});

test('lê as personas de personas.ts', () => {
  const fonte = readFileSync(new URL('../src/app/testes/personas.ts', import.meta.url), 'utf8');
  const ids = personasConhecidas(fonte);
  assert.equal(ids.length, 9);
  assert.ok(ids.includes('leitor-de-tela'));
});
