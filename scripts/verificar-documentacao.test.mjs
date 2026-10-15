// node --test scripts/verificar-documentacao.test.mjs (da raiz). Regras do verificar-documentacao.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exigencias, lerNameStatus } from './verificar-documentacao.mjs';

const docs = (faltas) => faltas.map((f) => f.doc).sort();

test('alterar um componente existente não cobra documentação', () => {
  assert.deepEqual(exigencias([{ status: 'M', caminho: 'frontend/src/app/ui/card/card.ts' }]), []);
});

test('arquivo novo no front cobra o mapa e o README do front', () => {
  const faltas = exigencias([{ status: 'A', caminho: 'frontend/src/app/ui/tag/tag.ts' }]);
  assert.deepEqual(docs(faltas), ['frontend/CLAUDE.md', 'frontend/README.md']);
  assert.match(faltas[0].motivos[0], /tag\.ts \(novo\)/);
});

test('spec de unidade novo e catálogo gerado não cobram nada', () => {
  assert.deepEqual(
    exigencias([
      { status: 'A', caminho: 'frontend/src/app/ui/card/card.spec.ts' },
      { status: 'M', caminho: 'frontend/src/app/testes/catalogo.ts' },
    ]),
    [],
  );
});

test('rota, script do npm e pipeline cobram mesmo sendo só alteração', () => {
  assert.deepEqual(docs(exigencias([{ status: 'M', caminho: 'frontend/src/app/app.routes.ts' }])), [
    'frontend/CLAUDE.md',
    'frontend/README.md',
  ]);
  assert.deepEqual(docs(exigencias([{ status: 'M', caminho: 'azure-pipelines.yml' }])), [
    'docker/CLAUDE.md',
    'docker/README.md',
  ]);
  assert.deepEqual(docs(exigencias([{ status: 'M', caminho: 'backend/src/Mirante.Fontes/ListaPermitida.cs' }])), [
    'backend/CLAUDE.md',
    'backend/README.md',
  ]);
});

test('com a documentação da área no diff, passa', () => {
  const faltas = exigencias([
    { status: 'A', caminho: 'frontend/src/app/ui/tag/tag.ts' },
    { status: 'M', caminho: 'frontend/CLAUDE.md' },
    { status: 'M', caminho: 'frontend/README.md' },
  ]);
  assert.deepEqual(faltas, []);
});

test('mudança em duas áreas cobra também o README da raiz', () => {
  const faltas = exigencias([
    { status: 'M', caminho: 'frontend/package.json' },
    { status: 'M', caminho: 'frontend/CLAUDE.md' },
    { status: 'M', caminho: 'frontend/README.md' },
    { status: 'M', caminho: 'docker/Dockerfile.web' },
    { status: 'M', caminho: 'docker/CLAUDE.md' },
    { status: 'M', caminho: 'docker/README.md' },
  ]);
  assert.deepEqual(docs(faltas), ['README.md']);
});

test('lê o name-status do git, inclusive renomeação', () => {
  assert.deepEqual(lerNameStatus('M\ta.ts\nR100\tvelho.ts\tnovo.ts\nD\tx.ts\n'), [
    { status: 'M', caminho: 'a.ts' },
    { status: 'R', caminho: 'novo.ts' },
    { status: 'D', caminho: 'x.ts' },
  ]);
});
