import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlocoCodigo } from '../../galeria/bloco-codigo/bloco-codigo';

interface Passo {
  readonly titulo: string;
  readonly descricao: string;
  readonly codigo: string;
}

const PASSOS: readonly Passo[] = [
  {
    titulo: 'Preparar',
    descricao: 'Node 24 e o Chromium do Playwright, que roda tanto os unitários quanto os de ponta a ponta.',
    codigo: `cd frontend
npm install
npx playwright install chromium`,
  },
  {
    titulo: 'Unitários',
    descricao: 'Vitest em modo navegador, mais os testes dos scripts de build e a conferência deste catálogo.',
    codigo: 'npm run test:ci',
  },
  {
    titulo: 'Ponta a ponta',
    descricao:
      'Sobe o servidor de desenvolvimento e roda tudo no desktop e no celular, sem rede: as respostas das ' +
      'fontes vêm de uma gravação e o relógio do navegador fica parado no dia dela.',
    codigo: 'npm run e2e',
  },
  {
    titulo: 'Só uma persona',
    descricao: 'Cada teste carrega as personas como tag; o filtro do Playwright usa a mesma tag desta página.',
    codigo: `npx playwright test --grep @celular
npx playwright test --grep @leitor-de-tela --project=desktop`,
  },
  {
    titulo: 'Contra a imagem de produção',
    descricao: 'Com a CSP e os headers reais do nginx. É assim que o pipeline roda antes de publicar.',
    codigo: `docker compose -f ../docker/docker-compose.yml up -d --build
E2E_BASE_URL=http://localhost:8092 npx playwright test`,
  },
  {
    titulo: 'Atualizar este catálogo',
    descricao: 'Depois de criar, renomear ou mudar a persona de um teste. Teste sem persona faz o comando falhar.',
    codigo: 'npm run testes:catalogo',
  },
];

/** /testes/como-rodar: os comandos para rodar cada camada de teste. */
@Component({
  selector: 'mi-como-rodar',
  imports: [RouterLink, BlocoCodigo],
  template: `
    <div class="grid grid-cols-1 gap-10">
      <section class="grid grid-cols-1 max-w-3xl gap-3">
        <p class="text-xs font-semibold tracking-wider text-accent uppercase">Qualidade</p>
        <h2 class="text-2xl font-bold tracking-tight text-balance sm:text-3xl">Como rodar os testes</h2>
        <p class="text-muted">
          Comandos de dentro da pasta
          <code class="rounded bg-sunken px-1.5 py-0.5 font-mono text-[0.85em]">frontend/</code>.
        </p>
        <p>
          <a routerLink="/testes" class="inline-flex items-center gap-2 font-semibold text-accent hover:underline">
            <i class="fa-solid fa-arrow-left text-xs" aria-hidden="true"></i>
            Voltar aos testes por persona
          </a>
        </p>
      </section>
      <ol class="grid grid-cols-1 gap-8">
        @for (passo of passos; track passo.titulo) {
          <li class="grid grid-cols-1 gap-3">
            <h3 class="text-lg font-semibold">{{ passo.titulo }}</h3>
            <p class="max-w-3xl text-sm text-muted">{{ passo.descricao }}</p>
            <mi-bloco-codigo [codigo]="passo.codigo" linguagem="bash" />
          </li>
        }
      </ol>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComoRodar {
  protected readonly passos = PASSOS;
}
