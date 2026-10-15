// Documentação viva (CLAUDE.md da raiz): mudança estrutural numa área exige o CLAUDE.md e o README.md
// dela no mesmo diff. Compara o branch atual (commits e árvore de trabalho) com a base.
//   node scripts/verificar-documentacao.mjs [--base origin/main] [--hook]
// Sem --hook: lista o que falta e sai com 1. Com --hook (Stop do Claude Code): lê o JSON do hook na
// entrada e, se faltar documentação, devolve { decision: 'block', reason } para o Claude completar.
// Não julga texto: só cobra que o arquivo foi tocado. O que dizer fica com o subagente
// revisor-de-documentacao.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Arquivo mudado com o status do git: A (novo), D (removido), R (renomeado) ou M (alterado). */
const AREAS = [
  {
    nome: 'frontend',
    docs: ['frontend/CLAUDE.md', 'frontend/README.md'],
    // Comando, rota, build ou dependência: muda o que o README e o mapa dizem.
    sempre: [
      /^frontend\/package\.json$/,
      /^frontend\/angular\.json$/,
      /^frontend\/playwright\.config\.ts$/,
      /^frontend\/proxy\.conf\.json$/,
      /^frontend\/src\/app\/app\.routes\.ts$/,
      /^frontend\/src\/app\/app\.config\.ts$/,
      /^frontend\/src\/index\.html$/,
    ],
    // Arquivo novo, removido ou renomeado entra no mapa (spec de unidade fica ao lado do componente).
    estrutura: /^frontend\/(src|e2e|scripts|public)\//,
    ignorar: /^frontend\/src\/.*\.spec\.ts$|^frontend\/src\/app\/testes\/catalogo\.ts$|^frontend\/public\/og\//,
  },
  {
    nome: 'backend',
    docs: ['backend/CLAUDE.md', 'backend/README.md'],
    sempre: [
      /^backend\/src\/Mirante\.Api\/Program\.cs$/,
      /^backend\/src\/Mirante\.Fontes\/ListaPermitida\.cs$/,
      /^backend\/src\/Mirante\.Api\/appsettings[^/]*\.json$/,
      /\.csproj$/,
      /^backend\/Mirante\.slnx$/,
      /^backend\/global\.json$/,
    ],
    estrutura: /^backend\/(src|tests)\//,
    ignorar: /\/(bin|obj)\//,
  },
  {
    nome: 'docker',
    docs: ['docker/CLAUDE.md', 'docker/README.md'],
    // Infra inteira é contrato de operação: qualquer mudança cobra o runbook.
    sempre: [/^docker\//, /^azure-pipelines\.yml$/],
    estrutura: /^docker\//,
    ignorar: /^docker\/\.env$/,
  },
];

const ROTULO_STATUS = { A: 'novo', D: 'removido', R: 'renomeado' };

const DOCS = new Set(['README.md', 'CLAUDE.md', ...AREAS.flatMap((a) => a.docs)]);

export function exigencias(mudancas) {
  const tocados = new Set(mudancas.map((m) => m.caminho));
  const faltas = [];
  const relevantes = [];
  for (const area of AREAS) {
    const motivos = mudancas
      .filter((m) => !DOCS.has(m.caminho) && !(area.ignorar && area.ignorar.test(m.caminho)))
      .filter(
        (m) => area.sempre.some((re) => re.test(m.caminho)) || (m.status !== 'M' && area.estrutura.test(m.caminho)),
      )
      .map((m) => (m.status === 'M' ? m.caminho : `${m.caminho} (${ROTULO_STATUS[m.status]})`));
    if (motivos.length === 0) continue;
    relevantes.push(area.nome);
    for (const doc of area.docs) if (!tocados.has(doc)) faltas.push({ doc, motivos });
  }
  // Mudou algo que atravessa áreas: o README da raiz conta a arquitetura.
  if (relevantes.length > 1 && !tocados.has('README.md')) {
    faltas.push({ doc: 'README.md', motivos: [`mudança em ${relevantes.join(' e ')}`] });
  }
  return faltas;
}

function git(...args) {
  return execFileSync('git', args, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

/** Status das linhas do git diff --name-status (R100 vira R, com o caminho novo). */
export function lerNameStatus(saida) {
  return saida
    .split('\n')
    .filter(Boolean)
    .map((linha) => {
      const partes = linha.split('\t');
      return { status: partes[0][0], caminho: partes[partes.length - 1] };
    });
}

function mudancas(base) {
  let ponto = base;
  try {
    ponto = git('merge-base', base, 'HEAD').trim();
  } catch {
    // Sem a base (clone raso, branch órfão): compara só a árvore de trabalho com o HEAD.
    ponto = 'HEAD';
  }
  const lista = [
    ...lerNameStatus(git('diff', '--name-status', '-M', ponto)),
    ...git('ls-files', '--others', '--exclude-standard')
      .split('\n')
      .filter(Boolean)
      .map((caminho) => ({ status: 'A', caminho })),
  ];
  const porCaminho = new Map();
  for (const m of lista) if (!porCaminho.has(m.caminho) || m.status !== 'M') porCaminho.set(m.caminho, m);
  return [...porCaminho.values()];
}

export function mensagem(faltas) {
  const linhas = faltas.map((f) => {
    const resto = f.motivos.length > 4 ? ` e mais ${f.motivos.length - 4}` : '';
    return `- ${f.doc}: ${f.motivos.slice(0, 4).join(', ')}${resto}`;
  });
  return (
    'Documentação viva: estas mudanças pedem atualização no mesmo diff (CLAUDE.md da raiz).\n' +
    `${linhas.join('\n')}\n` +
    'Atualize o mapa e as regras do CLAUDE.md e o README.md da área (o subagente revisor-de-documentacao ' +
    'aponta o que mudou). Se a mudança realmente não altera nada documentado, diga isso ao usuário.'
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const indice = process.argv.indexOf('--base');
  const base = indice > 0 ? process.argv[indice + 1] : 'origin/main';
  const hook = process.argv.includes('--hook');
  let entrada = {};
  if (hook) {
    try {
      entrada = JSON.parse(readFileSync(0, 'utf8') || '{}');
    } catch {
      entrada = {};
    }
  }
  let faltas = [];
  try {
    faltas = exigencias(mudancas(base));
  } catch (erro) {
    // Fora de um repositório git, ou git indisponível: no hook não trava o encerramento.
    if (hook) process.exit(0);
    throw erro;
  }
  if (hook) {
    // Já bloqueado uma vez nesta parada: devolve a palavra ao Claude sem prender em laço.
    if (faltas.length && !entrada.stop_hook_active) {
      process.stdout.write(JSON.stringify({ decision: 'block', reason: mensagem(faltas) }));
    }
    process.exit(0);
  }
  if (faltas.length) {
    console.error(mensagem(faltas));
    process.exit(1);
  }
  console.log('documentação em dia com o diff');
}
