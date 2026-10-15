// Roda depois do ng build (npm run build:deploy). Os robôs que montam a prévia do link não rodam
// JavaScript: cada rota pública ganha uma cópia do index.html com o próprio título, descrição,
// Open Graph e Twitter (ibge/index.html e assim por diante), e o nginx serve $uri/index.html.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ORIGEM, ROTAS_PUBLICAS } from './rotas-publicas.mjs';

const SAIDA = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'mirante', 'browser');

const escapar = (texto) =>
  texto.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Tudo o que o cartão define sai do HTML base antes de entrar o bloco da rota.
const TAGS_DO_CARTAO = [
  /\s*<title>[^<]*<\/title>/g,
  /\s*<meta name="description"[^>]*>/g,
  /\s*<meta (?:property|name)="(?:og|twitter):[^"]*"[^>]*>/g,
  /\s*<link rel="canonical"[^>]*>/g,
];

export function metadados(rota, eol = '\n') {
  const url = `${ORIGEM}/${rota.caminho}`;
  const imagem = `${ORIGEM}/og/${rota.capa.arquivo}.png`;
  const t = escapar(rota.titulo);
  const d = escapar(rota.descricao);
  return [
    `<title>${t}</title>`,
    `<meta name="description" content="${d}">`,
    `<link rel="canonical" href="${url}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="Mirante">`,
    `<meta property="og:locale" content="pt_BR">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:title" content="${t}">`,
    `<meta property="og:description" content="${d}">`,
    `<meta property="og:image" content="${imagem}">`,
    `<meta property="og:image:type" content="image/png">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:image:alt" content="${t}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${t}">`,
    `<meta name="twitter:description" content="${d}">`,
    `<meta name="twitter:image" content="${imagem}">`,
  ].join(`${eol}  `);
}

export function cartaoDaRota(htmlBase, rota) {
  // Mesma quebra de linha do arquivo (o checkout no Windows pode trazer CRLF).
  const eol = htmlBase.includes('\r\n') ? '\r\n' : '\n';
  let html = TAGS_DO_CARTAO.reduce((h, re) => h.replace(re, ''), htmlBase);
  const charset = /<meta charset="utf-8">/i;
  if (!charset.test(html)) throw new Error('index.html sem <meta charset="utf-8">: não há onde inserir o cartão');
  html = html.replace(charset, (m) => `${m}${eol}  ${metadados(rota, eol)}`);
  return html;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const base = readFileSync(join(SAIDA, 'index.html'), 'utf8');
  for (const rota of ROTAS_PUBLICAS) {
    const destino = rota.caminho ? join(SAIDA, rota.caminho, 'index.html') : join(SAIDA, 'index.html');
    mkdirSync(dirname(destino), { recursive: true });
    writeFileSync(destino, cartaoDaRota(base, rota));
    console.log(`cartão: /${rota.caminho}`);
  }
}
