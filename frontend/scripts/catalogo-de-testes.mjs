// Gera src/app/testes/catalogo.ts (a galeria /testes) a partir da listagem do Playwright: cada
// teste de ponta a ponta com arquivo, linha, grupo, título e personas (as tags do teste).
//   node scripts/catalogo-de-testes.mjs              regrava o catálogo
//   node scripts/catalogo-de-testes.mjs --verificar  falha se o catálogo estiver desatualizado, se
//                                                    algum teste não tiver persona ou usar uma
//                                                    persona que não existe em personas.ts
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'src', 'app', 'testes', 'catalogo.ts');
const PERSONAS = join(RAIZ, 'src', 'app', 'testes', 'personas.ts');

export function personasConhecidas(fonte) {
  return [...fonte.matchAll(/^\s+id: '([a-z-]+)',$/gm)].map((m) => m[1]);
}

/** Achata a listagem JSON do Playwright em cenários únicos (os projetos repetem cada teste). */
export function cenarios(listagem) {
  const vistos = new Map();
  const visitar = (suite, grupos) => {
    for (const spec of suite.specs ?? []) {
      const chave = `${spec.file}:${spec.line}:${grupos.join(' › ')}:${spec.title}`;
      if (vistos.has(chave)) continue;
      vistos.set(chave, {
        arquivo: spec.file.replace(/\\/g, '/').split('/').pop(),
        linha: spec.line,
        grupo: grupos.join(' › '),
        titulo: spec.title,
        personas: [...new Set(spec.tags)].sort(),
      });
    }
    for (const filha of suite.suites ?? []) visitar(filha, [...grupos, filha.title]);
  };
  for (const arquivo of listagem.suites) visitar(arquivo, []);
  return [...vistos.values()].sort((a, b) => a.arquivo.localeCompare(b.arquivo) || a.linha - b.linha);
}

export function problemas(lista, conhecidas) {
  const erros = [];
  for (const c of lista) {
    const onde = `${c.arquivo}:${c.linha} "${c.titulo}"`;
    if (c.personas.length === 0) erros.push(`${onde} sem persona (tag @...)`);
    for (const p of c.personas) if (!conhecidas.includes(p)) erros.push(`${onde} com persona desconhecida @${p}`);
  }
  return erros;
}

// Literal entre aspas simples: escapa barra, aspas e quebras de linha (inclusive U+2028 e U+2029).
const texto = (valor) =>
  `'${valor
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/[\u2028\u2029]/g, (c) => `\\u${c.charCodeAt(0).toString(16)}`)}'`;

export function gerarFonte(lista) {
  const linhas = lista.map(
    (c) =>
      `  {\n    arquivo: ${texto(c.arquivo)},\n    linha: ${c.linha},\n    grupo: ${texto(c.grupo)},\n` +
      `    titulo: ${texto(c.titulo)},\n    personas: [${c.personas.map(texto).join(', ')}],\n  },`,
  );
  return [
    '// Gerado por scripts/catalogo-de-testes.mjs a partir dos specs de e2e/. Não editar à mão:',
    '// rode `npm run testes:catalogo` depois de criar, renomear ou mudar a persona de um teste.',
    "import { CenarioDeTeste } from './cenario-de-teste.model';",
    '',
    'export const CATALOGO: readonly CenarioDeTeste[] = [',
    ...linhas,
    '];',
    '',
  ].join('\n');
}

function listar() {
  const cli = join(RAIZ, 'node_modules', '@playwright', 'test', 'cli.js');
  const saida = execFileSync(process.execPath, [cli, 'test', '--list', '--reporter=json'], {
    cwd: RAIZ,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    // Sem servidor: a listagem não abre o navegador, e assim o Playwright não tenta subir o ng serve.
    env: { ...process.env, E2E_BASE_URL: process.env['E2E_BASE_URL'] || 'http://localhost:4300' },
  });
  const listagem = JSON.parse(saida);
  if (listagem.errors?.length) throw new Error(listagem.errors.map((e) => e.message).join('\n'));
  return listagem;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const lista = cenarios(listar());
  const erros = problemas(lista, personasConhecidas(readFileSync(PERSONAS, 'utf8')));
  if (erros.length) {
    console.error(erros.join('\n'));
    process.exit(1);
  }
  const fonte = gerarFonte(lista);
  if (process.argv.includes('--verificar')) {
    const atual = readFileSync(DESTINO, 'utf8').replace(/\r\n/g, '\n');
    if (atual !== fonte) {
      console.error('src/app/testes/catalogo.ts desatualizado: rode npm run testes:catalogo');
      process.exit(1);
    }
    console.log(`catálogo de testes em dia: ${lista.length} cenários, todos com persona`);
  } else {
    writeFileSync(DESTINO, fonte);
    console.log(`catálogo de testes: ${lista.length} cenários`);
  }
}
