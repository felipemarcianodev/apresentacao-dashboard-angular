// node --test (dentro do npm run test:ci): o que muda num lugar e precisa mudar junto em outro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROTAS_PUBLICAS } from './rotas-publicas.mjs';

const ler = (caminho) => readFileSync(new URL(caminho, import.meta.url), 'utf8');

// Rotas de primeiro nível de app.routes.ts, sem a raiz e o curinga.
const rotas = [...ler('../src/app/app.routes.ts').matchAll(/^\s{4}path: '([^']+)',$/gm)].map((m) => m[1]);

test('lê as rotas do app', () => {
  assert.ok(rotas.includes('ibge') && rotas.includes('testes'), rotas.join(', '));
});

test('toda rota do app tem cartão do link (scripts/rotas-publicas.mjs)', () => {
  const comCartao = ROTAS_PUBLICAS.map((r) => r.caminho);
  for (const rota of rotas) assert.ok(comCartao.includes(rota), `/${rota} sem cartão do link`);
});

test('toda rota do app passa pelas suítes de acessibilidade e responsividade (e2e/apis.ts)', () => {
  const lista = /export const ROTAS = \[([\s\S]*?)\] as const;/.exec(ler('../e2e/apis.ts'))[1];
  const cobertas = [...lista.matchAll(/'([^']+)'/g)].map((m) => m[1]);
  for (const rota of rotas) assert.ok(cobertas.includes(`/${rota}`), `/${rota} fora de ROTAS em e2e/apis.ts`);
});

test('a CSP da imagem é a mesma da cópia da borda', () => {
  const csp = (texto) => /add_header Content-Security-Policy "([^"]+)"/.exec(texto)?.[1];
  const imagem = csp(ler('../../docker/nginx/seguranca.conf'));
  const borda = csp(ler('../../docker/borda/site-mirante.conf'));
  assert.ok(imagem, 'CSP não encontrada em docker/nginx/seguranca.conf');
  // A borda termina o TLS e acrescenta só o upgrade-insecure-requests; o resto é idêntico.
  assert.equal(borda, `${imagem}; upgrade-insecure-requests`, 'docker/borda/site-mirante.conf diverge da imagem');
});
