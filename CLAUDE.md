# Mirante: kit de dashboard em Angular 20 + Tailwind CSS

Responda em português brasileiro, salvo quando for pedido outro idioma. Obedeça os padrões gramaticais e de acentuação de cada língua.

> **REGRA BLOQUEANTE: português do Brasil com acentuação correta.** Documentação (`docs/`, READMEs), textos de UI e mensagens de commit seguem gramática, ortografia e acentuação do português do Brasil (acentos, cedilha, til, crase). Proibido escrever documentação em ASCII sem acentos.

> **REGRA BLOQUEANTE: ler o mapa antes de executar qualquer tarefa.** Antes de começar, ler a seção "Mapa de arquivos". Ao criar, mover ou remover arquivo relevante, **atualizar o mapa no mesmo commit** (mapa desatualizado é pior que ausente).

## Sobre o projeto

Mirante é um **kit de dashboard** construído em Angular 20 e Tailwind CSS v4 o mais puro possível, com três painéis sobre dados abertos do Brasil: **IBGE** (primeiro), **Banco Central** (API SGS) e **Ipeadata**. Faz parte do portfólio de Felipe Marciano e é o primeiro projeto dele sem login e sem backend, com dados reais abertos a qualquer visitante.

A **galeria `/ui`** é a documentação do kit, no estilo do angular.dev: cada componente tem descrição, exemplo vivo, tabela de API, trecho de uso e notas de acessibilidade. O repositório é feito para outros desenvolvedores baixarem e reutilizarem os componentes.

Construído em par com o Claude (Claude Code), fase a fase, a partir de um plano faseado local em `docs/` (o plano não vai para o git).

### Fontes de dados (públicas, sem chave, CORS liberado)

| Fonte | Base | Uso |
|---|---|---|
| IBGE (agregados v3) | `https://servicodados.ibge.gov.br/api/v3/agregados` | População, PIB, desocupação, IPCA, recortes por UF |
| Banco Central (SGS) | `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json` | Selic, câmbio, crédito |
| Ipeadata (OData v4) | `https://www.ipeadata.gov.br/api/odata4/` | Séries históricas consolidadas |

Regra: **nenhum número inventado.** Toda tela mostra a fonte e a data de referência do dado. Dado ilustrativo na galeria é marcado como exemplo.

### Stack

- **Frontend:** Angular 20 (standalone, zoneless, signals), TypeScript, Tailwind CSS v4 (CSS-first, `@theme`), Font Awesome Free empacotado localmente, fonte Inter auto-hospedada.
- **Testes:** Karma + Jasmine (ChromeHeadless) para unidade; Playwright + axe-core para E2E, com as APIs gravadas em HAR.
- **Backend (em construção, plano local `docs/plano-evolucao.md`):** .NET 10, minimal APIs, solução `backend/Mirante.slnx`, EF Core 10 + PostgreSQL (reserva da última resposta boa), Redis (cache), xUnit v3 no Microsoft Testing Platform, Testcontainers nos testes de integração. Os portões da skill `executar-plano-faseado` incluem `dotnet build` e `dotnet test` da solução.

### Ambientes

| Ambiente | Endereço |
|---|---|
| Local | `http://localhost:4200` (`npm start`) |
| Container local | `http://localhost:8092` (`docker compose -f docker/docker-compose.yml up -d --build`) |
| API local | `http://localhost:5110` (`dotnet run --project backend/src/Mirante.Api`, com o Postgres e o Redis do compose); no compose, `http://localhost:8093` |
| Produção | `https://mirante.felipemarcianodev.com` (VPS do portfólio, atrás do nginx de borda do Planuz) |

## Mapa de arquivos

```
CLAUDE.md                      -> este arquivo (regras e mapa)
README.md                      -> apresentação pública do projeto
.gitignore                     -> padrão do Angular CLI + planos faseados locais de docs/ (plano-*.md)
.github/dependabot.yml         -> atualizações semanais do npm (Angular, testes e Tailwind em grupos; versão maior do
                                  Angular e do TypeScript fica para o ng update) e das
                                  imagens base do docker/ (só digest novo; troca de versão do nginx e maior do
                                  Node fica manual), com PR contra a main
.postcssrc.json                -> liga o Tailwind v4 (@tailwindcss/postcss) ao build do Angular
angular.json                   -> projeto "mirante", prefixo mi; estilos globais: Inter, Font Awesome (só o core e
                                  o solid) e src/styles.css; produção sem CSS crítico inline (exigência da CSP)
VERSION                        -> versão semântica do Mirante; o build a embute no rodapé da barra lateral
azure-pipelines.yml            -> release/*: npm audit, unitários, build, imagem, E2E contra o container, envio
                                  da imagem por scp e troca do container na VPS (variable group mirante-producao)
backend/                       -> API .NET 10 (solução Mirante.slnx)
  global.json                  -> SDK 10 e executor de testes Microsoft Testing Platform
  Directory.Build.props        -> net10.0, nullable, avisos como erro, analisadores
  Directory.Packages.props     -> versões de pacote centralizadas
  src/Mirante.Api/             -> minimal API: Program, Configuracao/ (Conexoes validadas na subida, Postgres
                                  e Redis), Saude/ (/health vivo, /health/ready com Postgres e Redis, sem detalhe
                                  de erro no corpo), Fontes/ (FontesEndpoints: /api/ibge, /api/bcb e /api/ipea com
                                  os mesmos caminhos das fontes; 404 fora da lista, 400 malformada, 502 fonte fora)
  src/Mirante.Fontes/          -> ListaPermitida (o que os painéis consultam, espelho de indicadores.ts e series.ts:
                                  série nova entra nos dois), ConsultaIbge, ConsultaBcb e ConsultaIpea (validação e
                                  forma canônica), ClienteDasFontes (JSON como veio, recusa HTML), FontesExtensions
                                  (cliente por fonte com resiliência; Ipeadata com prazo maior)
  src/Mirante.Dados/           -> MiranteDb (EF Core 10, Npgsql): reserva das séries
  tests/Mirante.Testes.Unidade/    -> xUnit v3, sem rede nem banco
  tests/Mirante.Testes.Integracao/ -> API real (WebApplicationFactory) com Postgres e Redis em Testcontainers;
                                  FontesSimuladas responde no lugar das três fontes (teste nunca bate na rede)
docker/
  Dockerfile.api               -> build no SDK 10 alpine, execução no aspnet 10 alpine sem root, digests fixos
  Dockerfile.api.dockerignore  -> leva só o backend, sem bin, obj e testes
  Dockerfile.web               -> build no node:22-alpine, entrega no nginx:1.30-alpine (ambos fixados por digest),
                                  healthcheck em /health
  Dockerfile.web.dockerignore  -> evita levar node_modules, dist e e2e do host para a imagem
  nginx/nginx.conf             -> SPA com try_files, gzip (inclusive atrás da borda, HTTP/1.0), cache imutável
                                  para arquivos com hash e no-cache para o resto
  nginx/seguranca.conf         -> CSP estrita (sem unsafe-inline, Trusted Types, connect-src só nas 3 APIs) e
                                  headers; incluído em cada location
  docker-compose.yml           -> web (127.0.0.1:8092, 64 MB), api (127.0.0.1:8093, 128 MB), postgres (192 MB,
                                  volume) e redis (64 MB, sem persistência, LRU); só leitura e sem capacidades
                                  extras onde dá. O deploy atual troca só o web
  docker-compose.prod.yml      -> pluga o web na rede externa edge da VPS
  borda/site-mirante.conf      -> cópia de referência do server block do nginx de borda (vale o do repo planuz)
  setup-letsencrypt-mirante.sh -> emissão inicial do certificado na VPS (volumes do planuz-certbot)
package.json                   -> scripts start, build:deploy, test:ci, e2e
playwright.config.ts           -> E2E: projetos desktop (1366 px) e celular (360 px), pt-BR, fuso de São Paulo,
                                  sobe ng serve na porta 4300
e2e/                           -> testes de ponta a ponta (Playwright)
  apis.ts                      -> test com APIs gravadas (HAR), relógio fixo e falha em erro de console;
                                  ROTAS e esperarDados
  dados/apis.har               -> respostas reais das três APIs (só corpo e Content-Type, sem cookies)
  gravar-apis.spec.ts          -> regrava o HAR (GRAVAR=1); depois, atualizar DATA_DA_GRAVACAO em apis.ts
  navegacao.spec.ts            -> menu, título, tema (claro, escuro, sistema), atalho de teclado, gaveta no celular
  paineis.spec.ts              -> IBGE (UF por lista, URL e mapa; tabela; erro e Tentar de novo), BCB, Ipeadata
  galeria.spec.ts              -> todas as páginas de componente, slug inválido, botão de copiar
  acessibilidade.spec.ts       -> axe WCAG 2.2 AA nos dois temas e alvo de toque de 40 px
  responsivo.spec.ts           -> nenhuma rota rola para o lado nem vaza conteúdo da tela
  producao.spec.ts             -> só com E2E_BASE_URL: CSP, headers e cache do nginx da imagem
docs/                          -> documentação; plano-reconstrucao.md é local e não vai para o git
.claude/skills/executar-plano-faseado/ -> executa o plano fase a fase com os portões
.claude/agents/seguranca-angular.md    -> auditor de segurança Angular (angular.dev/best-practices/security)
public/
  favicon.svg                  -> ícone da marca (mountain-sun do Font Awesome em branco sobre o accent)
  favicon.ico                  -> o mesmo ícone em 16, 32 e 48 px, para navegador sem suporte a SVG
  apple-touch-icon.png         -> 180 px, atalho na tela inicial do celular
  robots.txt
  geo/br-uf.json               -> malha das 27 UFs (API de malhas do IBGE, coordenadas com 2 casas), usada pelo MapaUf
  theme-init.js                -> aplica .dark antes do Angular subir (evita piscar); arquivo estático por causa da CSP
src/
  arquivos-de-texto.d.ts       -> tipo dos arquivos importados como texto (VERSION)
  index.html                   -> documento base (lang pt-BR), carrega theme-init.js
  main.ts                      -> bootstrap da aplicação
  styles.css                   -> @import tailwindcss + @theme: escala primary do blog, tokens de superfície
                                  (bg, surface, sunken, fg, muted, line, grid), accent e semânticas (up, down,
                                  warn, violet); valores escuros em .dark; foco visível e reduced-motion
  app/
    app.ts                     -> componente raiz (mi-root), só monta o shell
    app.config.ts              -> providers: zoneless, router com withComponentInputBinding, HttpClient com fetch
    app.routes.ts              -> rotas lazy /ibge (IbgePainel), /bcb (BcbPainel), /ipea (IpeaPainel), /ui; data.titulo vira o título da topbar
    core/versao/versao.ts      -> VERSAO: lida do arquivo VERSION da raiz como texto (import com loader text)
    core/formato/formato.ts    -> formatar(valor, formato) pt-BR (numero, decimal, percentual em pontos, moeda,
                                  moeda-compacta, dolar, compacto) e formatarVariacao com sinal; SEM_DADO para nulo
    core/brasil/ufs.ts         -> UFS: 27 UFs com código IBGE, sigla, nome e região; ufPorCodigo, ufPorSigla
    core/dados/valor-de.ts     -> valorDe(resource): valor ou undefined, sem lançar no estado de erro
    core/theme/theme-preference.ts -> ThemePreference: signal tema (light, dark, system), classe .dark, localStorage
    layout/shell/              -> Shell: sidebar (drawer no mobile), topbar com título da rota, router-outlet;
                                  a gaveta fecha a cada navegação, menos a inicial (aparelho lento); rodapé fixo
                                  com o link do código e a versão (ligada à tag do GitHub)
      navegacao.ts             -> NAVEGACAO: grupos Painéis e Kit com rota, rótulo e ícone Font Awesome
      outros-projetos.ts       -> OUTROS_PROJETOS: Planuz, portfólio e blog, em "Conheça também" (abre em nova aba)
    layout/theme-toggle/       -> ThemeToggle: radiogroup claro, escuro e sistema
    dashboards/bcb/            -> painel do Banco Central em /bcb
      sgs.ts                   -> API do SGS: urlSerie por janela de datas (diária exige, até 10 anos), lerSerie
                                  (descarta datas futuras da meta Selic), mensalizar (fechamento), rotuloMes/Dia
      series.ts                -> SERIES_BCB: Selic 432, dólar 1, euro 21619, crédito 20539 (milhões),
                                  inadimplência 21082, IBC-Br 24364; resumirSerie (variação contra 12 meses antes)
      bcb-painel.ts            -> BcbPainel: período 1A/2A/5A refaz as consultas, KPIs, 4 gráficos, tabela mensal
    dashboards/ipea/           -> painel do Ipeadata em /ipea
      ipeadata.ts              -> API OData v4: urlValores (código validado por regex, vai entre aspas no OData),
                                  lerValores (descarta item malformado), anualizar (último valor de cada ano).
                                  O comentário da série nos metadados é HTML: não usar
      series.ts                -> SERIES_IPEA: crescimento do PIB, PIB per capita em US$ (mil), salário mínimo
                                  real (mensal), Gini; resumirIpea (variação contra o ano anterior)
      ipea-painel.ts           -> IpeaPainel: período Desde 1995 / 1980 / Tudo recorta no navegador (a API
                                  devolve a série inteira), KPIs, 4 gráficos e tabela anual
    dashboards/ibge/           -> painel do IBGE em /ibge (?uf=RJ filtra pela UF)
      agregados.ts             -> API de agregados v3: urlAgregado, lerValor (símbolos do IBGE viram null),
                                  lerAgregado (variável -> localidade -> pontos), rotuloPeriodo, ultimoValido
      indicadores.ts           -> INDICADORES_UF (população 6579, desocupação 4099, PIB 5938) e IPCA (1737, só
                                  Brasil); resumir (valor, variação, série) e valoresPorUf
      ibge-painel.ts           -> IbgePainel: httpResource por agregado (lidos com valorDe),
                                  KPIs, linhas de desocupação e IPCA, mapa com ranking e tabela das 27 UFs
    ui/                        -> primitivos do kit, um por pasta (componente, template, spec, doc)
      button/                  -> Button: seletor button[miButton], a[miButton]; variante, tamanho, icone, carregando
      badge/                   -> Badge (mi-badge): tom semântico e ícone
      card/                    -> Card (mi-card): título, descrição, slot [acoes], rodapé "Fonte:"
      segmented/               -> Segmented (mi-segmented): radiogroup com model() valor e navegação por setas
      skeleton/                -> Skeleton (mi-skeleton): bloco ou linhas de texto; tamanho por classe de quem usa
      empty-state/             -> EmptyState (mi-empty-state): ícone, título, descrição e ação projetada
      error-state/             -> ErrorState (mi-error-state): role alert e output tentarDeNovo
    charts/                    -> gráficos do kit (SVG próprio ou HTML), cada um com spec e doc
      escala.ts                -> funções puras: escalaLinear, passoAgradavel, eixoAgradavel, indicesDeRotulo
      largura-do-host.ts       -> larguraDoHost(): largura do elemento, começa em 0 e é medida após a primeira
                                  renderização (ResizeObserver depois); gráfico só desenha com largura > 0
      sparkline/               -> Sparkline (mi-sparkline): tendência sem eixos, cor por currentColor
      kpi-card/                -> KpiCard (mi-kpi-card): valor, variação com sentidoBom, sparkline, referência
      line-chart/              -> LineChart (mi-line-chart): séries, eixo redondo, tooltip, setas, tabela sr-only
      bar-list/                -> BarList (mi-bar-list): ranking horizontal em HTML, ordenar e limite
      mapa-uf/                 -> MapaUf (mi-mapa-uf): coroplético por quantil, seleção por clique ou Enter
        projecao.ts            -> projetarMalha (equiretangular), limitesPorQuantil, classeDoValor
        malha-de-teste.ts      -> malha mínima para specs
    table/                     -> tabela de dados do kit
      coluna-tabela.model.ts   -> ColunaTabela<T> (id, titulo, valor, formato, alinhamento, ordenavel,
                                  chaveOrdenacao), Ordenacao
      operacoes.ts             -> funções puras: textoDaCelula, normalizar (sem acento), filtrarLinhas,
                                  ordenarLinhas (pt-BR, vazios no fim), gerarCsv (Excel pt-BR com BOM)
      data-table/              -> DataTable (mi-data-table): busca, aria-sort, paginação com linkedSignal,
                                  CSV, densidade e cartões abaixo de 640 px
    galeria/                   -> documentação do kit em /ui (lazy, galeria.routes.ts)
      component-doc.model.ts   -> ComponentDoc, PropriedadeDoc, ExemploDoc
      docs.ts                  -> DOCS: registro de todas as documentações; buscarDoc(slug)
      galeria-indice/          -> /ui: primeiros passos e componentes por categoria
      pagina-componente/       -> /ui/:slug: descrição, importação, exemplos vivos, API e acessibilidade
      bloco-codigo/            -> BlocoCodigo: código como texto (nunca HTML) com botão de copiar
```

## Angular Style Guide (regra bloqueante)

Seguir https://angular.dev/style-guide. Em resumo, o que é cobrado em revisão:

- **Nomes de arquivo** em hífen, sem sufixo de tipo: `kpi-card.ts`, `kpi-card.html`, `kpi-card.spec.ts`; classe `KpiCard`. Serviço também sem sufixo (`ibge-api.ts`, classe `IbgeApi`). Teste com `.spec.ts`.
- **Organização por área funcional**, nunca por tipo: nada de pastas `components/`, `services/`, `models/` genéricas. Cada componente na sua pasta, com template, estilo, teste e doc juntos.
- **Um conceito por arquivo.** Tipos compartilhados de uma área ficam em `<area>/<nome>.model.ts`.
- **`inject()`** em vez de injeção por construtor.
- **Ordem na classe:** propriedades do Angular primeiro (injeções, inputs, outputs, models, queries), depois estado, depois métodos.
- **Membros usados só no template são `protected`.** Inputs, outputs, models e queries são `readonly`.
- **APIs de signal:** `input()`, `output()`, `model()`, `viewChild()`, `computed()`, `linkedSignal()`. Nada de `@Input`/`@Output` decorators.
- **`host: {}` no metadata** em vez de `@HostBinding` e `@HostListener`.
- **`[class.x]` e `[style.x]`** em vez de `ngClass` e `ngStyle`.
- **Handlers nomeados pelo que fazem** (`salvarFiltro()`), não pelo evento (`onClick()`).
- **Lógica fora do template:** template só lê signals e chama métodos simples; cálculo vai para `computed()`.
- **Control flow nativo** (`@if`, `@for` com `track`, `@switch`, `@defer`).
- `ChangeDetectionStrategy.OnPush` em todo componente (app é zoneless).
- Seletor com prefixo **`mi-`** (`mi-kpi-card`).

## Tailwind utility-first (regra bloqueante)

- **Estilo vive no template**, em utilitários. O `.css` do componente fica vazio ou só com o que o Tailwind não alcança (`:host`, `::before`/`::after`, `@keyframes`, scrollbar), **sempre com comentário do motivo**.
- **Tokens no `@theme`** de `src/styles.css`. Nunca hex solto no template ou no CSS do componente: usar `bg-primary-500`, `text-fg`, `border-line`.
- **Sem `@apply`** e sem classe semântica nova (`.card-negocio`). Reuso de estilo é componente Angular, não classe CSS.
- **Sem CSS inline** (`style="..."`) em template. Valor dinâmico de gráfico vai por atributo SVG ou `[style.x]` calculado.
- **Sem biblioteca de componentes** (Material, PrimeNG, DaisyUI) e **sem biblioteca de gráficos** (Chart.js, ECharts): gráficos são SVG próprio.
- Dark mode por classe `.dark` no `<html>` (variante customizada no `@theme`).

## Componente do kit (regra bloqueante)

Todo componente reaproveitável vive em `src/app/ui/<nome>/` (ou na área de gráficos e dados) com:

- `<nome>.ts` (e `.html` quando o template passa de umas 15 linhas);
- `<nome>.spec.ts` cobrindo o comportamento (não o visual);
- `<nome>.doc.ts` exportando um `ComponentDoc`, registrado em `src/app/galeria/docs.ts` no mesmo commit.

No `.doc.ts`, o template de cada exemplo é uma constante usada **ao mesmo tempo** no `@Component({ template })` do exemplo e no campo `codigo` da doc. Assim o código mostrado na galeria é sempre o que roda. A tabela de API lista todo input, model, output e slot de conteúdo; a seção de acessibilidade diz o que o componente garante e o que fica com quem usa.

## Ícones

Font Awesome Free (`@fortawesome/fontawesome-free`), empacotado no bundle (sem CDN, compatível com CSP), como em todos os projetos do portfólio. Uso: `<i class="fa-solid fa-chart-line" aria-hidden="true"></i>`; ícone sozinho em botão exige `aria-label` no botão.

## UX e acessibilidade

- Toda tela trata os três estados: **carregando (skeleton), vazio e erro com "Tentar de novo"**. Nada de tela em branco.
- Foco visível só no teclado (`:focus-visible`), contraste AA nos dois temas, alvo de toque mínimo de 40 px.
- Números com `tabular-nums` e formatação pt-BR (`Intl.NumberFormat('pt-BR')`).
- `prefers-reduced-motion` respeitado em toda animação.
- Copy sem travessão como separador estilístico (usar vírgula, ponto, dois-pontos ou reescrever).

## Dados das APIs públicas

- Consumo por `httpResource` com `parse` que já devolve o modelo tipado; o mapeamento fica em funções puras testadas.
- **Nunca ler `.value()` de um resource sem `hasValue()`**: em estado de erro ele lança exceção e derruba a tela. Use `valorDe()` de `core/dados/valor-de.ts`.
- Símbolos de dado ausente das fontes ("-", "...", "X") viram `null` e aparecem como "sem dado", nunca como zero.
- Cada card com dado preenche `fonte` com o órgão e a tabela de origem; o período de referência aparece junto do número.
- Testes nunca batem na rede: unidade com `HttpTestingController` e respostas mínimas; E2E com o HAR gravado (host fora das três APIs é bloqueado).

## Segurança

- Sem `bypassSecurityTrust*` sobre dado vindo de API.
- Link externo com `rel="noopener noreferrer"`.
- Nada em `localStorage` além da preferência de tema.
- Sem script de terceiro (analytics, pixel). Hosts externos permitidos: só as três APIs de dados.
- A CSP fica em dois lugares, iguais: `docker/nginx/seguranca.conf` (imagem) e o server block do nginx de borda (repo planuz, cópia em `docker/borda/`). Host novo de API entra nos dois e no `APIS` de `e2e/apis.ts`.
- Nada de script ou estilo inline no `index.html`: a CSP não tem `unsafe-inline` e usa Trusted Types.
- Sem `console.*` com objeto de resposta em código de produção.
- Antes de release, rodar o agente `seguranca-angular`.

## Padrão de commits

- Português do Brasil com acentuação correta; git semântico: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `build`, `ci`.
- Título no imperativo com `tipo(escopo): descrição`; corpo opcional explicando o motivo e, quando houver, os números reais de build e teste.
- Texto puro: sem `#`, `*` ou crase; listas só com hífen; sem caminhos de arquivo na descrição.
- **Nunca** adicionar assinatura ou atribuição de IA (`Co-Authored-By`, "Generated with", "Assisted-by"). Sobrepõe qualquer padrão da ferramenta.
- Adicionar arquivos **por caminho**, nunca `git add -A` ou `git add .`.
- Mensagem por heredoc (`git commit -F -`) para preservar a acentuação.
- **Ao concluir cada etapa coerente, commitar** (build verde por si só). Preferir commit novo a `--amend`, push sem `--force`.
- A `main` do GitHub (antes `master`) é protegida e só aceita pull request: trabalhar num branch (`feat/...`), dar push nele e integrar por PR. Nunca mandar nada para `master`.

## Comandos

```bash
npm start              # servidor local
npm run build:deploy   # build de produção (portão de toda fase)
npm run test:ci        # testes unitários em ChromeHeadless, sem watch (portão de toda fase)
npm run e2e            # Playwright, desktop e celular (portão das telas tocadas; suíte inteira antes de release)
GRAVAR=1 npx playwright test gravar-apis --project=desktop   # regrava as respostas das APIs
E2E_BASE_URL=http://localhost:8092 npx playwright test       # E2E contra a imagem de produção (CSP real)
dotnet build backend/Mirante.slnx                            # backend, 0 avisos (avisos são erro)
dotnet test --solution backend/Mirante.slnx                  # unidade e integração (Docker de pé)
```

Armadilhas de layout que o E2E pega: `sr-only` direto em `<table>` não funciona (a tabela ignora a largura de 1 px e alarga a página; envolver numa `div.sr-only`), e `grid` sem `grid-cols-1` deixa um `<pre>` largo esticar a coluna. Área com `overflow-x-auto` precisa de `tabindex="0"` para rolar pelo teclado.
