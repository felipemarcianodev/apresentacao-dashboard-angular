// Gera as imagens do cartão do link (1200x630 PNG) em public/og/, uma por rota pública.
// Uso manual, de dentro de frontend/: node scripts/gerar-capas.mjs. As imagens vão para o git; o
// script fica para regerar quando a identidade ou os títulos mudarem. Sem número nenhum na imagem:
// dado só aparece no painel, com fonte e data.
import { chromium } from '@playwright/test';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { ROTAS_PUBLICAS } from './rotas-publicas.mjs';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = join(RAIZ, 'public', 'og');
const modulo = (caminho) => pathToFileURL(join(RAIZ, 'node_modules', caminho)).href;
const marca = readFileSync(join(RAIZ, 'public', 'favicon.svg'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');

function html({ titulo, descricao, capa }) {
  const destaque = capa.arquivo === 'mirante' ? 'Mirante' : capa.chamada;
  const linha = capa.arquivo === 'mirante' ? capa.chamada : descricao;
  const rodape = capa.arquivo === 'mirante' ? 'IBGE · Banco Central · Ipeadata' : 'mirante.felipemarcianodev.com';
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link rel="stylesheet" href="${modulo('@fontsource-variable/inter/index.css')}">
<link rel="stylesheet" href="${modulo('@fortawesome/fontawesome-free/css/fontawesome.min.css')}">
<link rel="stylesheet" href="${modulo('@fortawesome/fontawesome-free/css/solid.min.css')}">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; font-family: 'Inter Variable', sans-serif; color: #e5eaf3; overflow: hidden;
    background: radial-gradient(circle at 85% 20%, #1e3a8a 0, transparent 45%), #0b1220; }
  .grade { position: absolute; inset: 0; opacity: .35;
    background-image: linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px);
    background-size: 60px 60px; mask-image: linear-gradient(90deg, transparent, #000 70%); }
  main { position: relative; height: 100%; padding: 72px 80px; display: flex; flex-direction: column; }
  .topo { display: flex; align-items: center; gap: 20px; font-size: 34px; font-weight: 700; letter-spacing: -.02em; }
  .topo svg { width: 64px; height: 64px; }
  .icone { position: absolute; right: 90px; top: 210px; font-size: 190px; color: #60a5fa; opacity: .9; }
  h1 { margin-top: auto; font-size: 92px; line-height: 1; font-weight: 800; letter-spacing: -.035em; max-width: 820px; }
  p { margin-top: 28px; font-size: 32px; line-height: 1.3; color: #bfdbfe; max-width: 820px; }
  footer { margin-top: 44px; font-size: 24px; color: #94a3b8; }
</style></head><body><div class="grade"></div>
<i class="icone fa-solid ${capa.icone}" aria-hidden="true"></i>
<main>
  <div class="topo">${marca}<span>Mirante</span></div>
  <h1>${destaque}</h1>
  <p>${linha}</p>
  <footer>${rodape}</footer>
</main><title>${titulo}</title></body></html>`;
}

mkdirSync(DESTINO, { recursive: true });
const pasta = mkdtempSync(join(tmpdir(), 'mirante-capas-'));
const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1200, height: 630 } });
for (const rota of ROTAS_PUBLICAS) {
  const arquivo = join(pasta, `${rota.capa.arquivo}.html`);
  writeFileSync(arquivo, html(rota));
  await pagina.goto(pathToFileURL(arquivo).href);
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.screenshot({ path: join(DESTINO, `${rota.capa.arquivo}.png`) });
  console.log(`capa: og/${rota.capa.arquivo}.png`);
}
await navegador.close();
