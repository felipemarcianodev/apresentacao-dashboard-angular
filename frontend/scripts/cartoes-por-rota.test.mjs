// Testes do cartão por rota (node --test, dentro do npm run test:ci).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cartaoDaRota } from './cartoes-por-rota.mjs';
import { ORIGEM, ROTAS_PUBLICAS } from './rotas-publicas.mjs';

const BASE = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const ibge = ROTAS_PUBLICAS.find((r) => r.caminho === 'ibge');

const conteudo = (html, atributo, nome) =>
  [...html.matchAll(new RegExp(`<meta ${atributo}="${nome}" content="([^"]*)">`, 'g'))].map((m) => m[1]);

test('troca título, descrição e cartão pelos da rota, sem duplicar', () => {
  const html = cartaoDaRota(BASE, ibge);
  assert.deepEqual([...html.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]), ['IBGE · Mirante']);
  assert.equal(conteudo(html, 'name', 'description').length, 1);
  assert.deepEqual(conteudo(html, 'property', 'og:url'), [`${ORIGEM}/ibge`]);
  assert.deepEqual(conteudo(html, 'property', 'og:image'), [`${ORIGEM}/og/ibge.png`]);
  assert.deepEqual(conteudo(html, 'name', 'twitter:card'), ['summary_large_image']);
  assert.equal([...html.matchAll(/rel="canonical"/g)].length, 1);
});

test('mantém o resto do documento', () => {
  const html = cartaoDaRota(BASE, ibge);
  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /<script src="theme-init.js"><\/script>/);
  assert.match(html, /<mi-root><\/mi-root>/);
});

test('o index.html do código já traz o cartão geral, igual ao que o script gera', () => {
  const geral = ROTAS_PUBLICAS.find((r) => r.caminho === '');
  assert.equal(cartaoDaRota(BASE, geral), BASE);
});

test('preserva CRLF do arquivo', () => {
  const crlf = BASE.replace(/\r?\n/g, '\r\n');
  const geral = ROTAS_PUBLICAS.find((r) => r.caminho === '');
  assert.equal(cartaoDaRota(crlf, geral), crlf);
});

test('escapa aspas e sinais no texto', () => {
  const html = cartaoDaRota(BASE, { ...ibge, titulo: 'A "B" <c>', descricao: 'x & y' });
  assert.match(html, /<title>A &quot;B&quot; &lt;c&gt;<\/title>/);
  assert.match(html, /content="x &amp; y"/);
});

test('recusa HTML sem charset', () => {
  assert.throws(() => cartaoDaRota('<html><head></head></html>', ibge), /charset/);
});

test('toda rota pública tem capa em public/og', () => {
  for (const rota of ROTAS_PUBLICAS) {
    const png = readFileSync(new URL(`../public/og/${rota.capa.arquivo}.png`, import.meta.url));
    assert.equal(png.readUInt32BE(16), 1200, rota.capa.arquivo);
    assert.equal(png.readUInt32BE(20), 630, rota.capa.arquivo);
  }
});
