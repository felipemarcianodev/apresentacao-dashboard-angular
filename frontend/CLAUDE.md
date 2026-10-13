# Mirante: frontend (Angular 20 + Tailwind CSS v4)

Regras gerais (idioma, documentação viva, commits, segurança comum) no `CLAUDE.md` da raiz. Este arquivo vale para tudo em `frontend/`. Caminhos abaixo são relativos a `frontend/`; os comandos rodam de dentro dela.

> **Documentação viva:** mudou arquivo, rota, componente, comando ou contrato com a API nesta área, atualizar no mesmo commit o mapa abaixo e o `README.md` desta pasta. Componente novo do kit também entra na galeria `/ui`.

## Stack

Angular 20 (standalone, zoneless, signals), TypeScript, Tailwind CSS v4 (CSS-first, `@theme`), Font Awesome Free empacotado localmente, fonte Inter auto-hospedada. Testes: Karma + Jasmine (ChromeHeadless) para unidade; Playwright + axe-core para E2E, com as respostas gravadas em HAR.

## Contrato com a API

Os painéis chamam a API do Mirante na mesma origem, nos mesmos caminhos das fontes, sob `/api/`:

| Painel | Base no front | Fonte por trás |
|---|---|---|
| IBGE | `/api/ibge/agregados` | agregados v3 |
| Banco Central | `/api/bcb/serie/bcdata.sgs` (só janelas 1, 2 ou 5 anos até hoje) | SGS |
| Ipeadata | `/api/ipea/odata4` | OData v4 |

A resposta é o JSON da fonte, sem reinterpretar; o mapeamento fica nas funções puras de cada painel. Cabeçalhos: `X-Mirante-Origem` (`cache`, `fonte` ou `reserva`) e `X-Mirante-Obtido-Em`. Com `reserva`, o painel mostra o aviso "Dado guardado". Série ou agregado novo precisa entrar também na lista permitida do backend (senão a API responde 404).

## Mapa de arquivos

```
CLAUDE.md                      -> este arquivo (regras e mapa do front)
README.md                      -> como rodar, testar e reaproveitar o kit
.postcssrc.json                -> liga o Tailwind v4 (@tailwindcss/postcss) ao build do Angular
angular.json                   -> projeto "mirante", prefixo mi; estilos globais: Inter, Font Awesome (só o core e
                                  o solid) e src/styles.css; produção sem CSS crítico inline (exigência da CSP);
                                  ng serve com proxy.conf.json
proxy.conf.json                -> npm start encaminha /api para a API local (localhost:5110)
package.json                   -> scripts start, build:deploy, test:ci, e2e
playwright.config.ts           -> E2E: projetos desktop (1366 px) e celular (360 px), pt-BR, fuso de São Paulo,
                                  sobe ng serve na porta 4300
e2e/                           -> testes de ponta a ponta (Playwright)
  apis.ts                      -> test com a API do Mirante respondida pelo HAR (endereços das fontes reescritos
                                  para /api da origem testada), relógio fixo, tudo fora da origem bloqueado e falha
                                  em erro de console; API, ROTAS e esperarDados
  dados/apis.har               -> respostas reais das três fontes (só corpo e Content-Type, sem cookies), com os
                                  endereços das fontes
  gravar-apis.spec.ts          -> regrava o HAR pela API do Mirante (GRAVAR=1, compose de pé); depois, atualizar
                                  DATA_DA_GRAVACAO em apis.ts
  navegacao.spec.ts            -> menu, título, tema (claro, escuro, sistema), atalho de teclado, gaveta no celular
  paineis.spec.ts              -> IBGE (UF por lista, URL e mapa; tabela; erro e Tentar de novo), BCB, Ipeadata
                                  (inclusive o aviso de dado guardado, com axe nos dois temas)
  galeria.spec.ts              -> todas as páginas de componente, slug inválido, botão de copiar
  acessibilidade.spec.ts       -> axe WCAG 2.2 AA nos dois temas e alvo de toque de 40 px
  responsivo.spec.ts           -> nenhuma rota rola para o lado nem vaza conteúdo da tela
  producao.spec.ts             -> só com E2E_BASE_URL: CSP, headers e cache do nginx da imagem
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
    core/versao/versao.ts      -> VERSAO: lida do VERSION da raiz do repositório como texto (import com loader text)
    core/formato/formato.ts    -> formatar(valor, formato) pt-BR (numero, decimal, percentual em pontos, moeda,
                                  moeda-compacta, dolar, compacto) e formatarVariacao com sinal; SEM_DADO para nulo
    core/brasil/ufs.ts         -> UFS: 27 UFs com código IBGE, sigla, nome e região; ufPorCodigo, ufPorSigla
    core/dados/valor-de.ts     -> valorDe(resource): valor ou undefined, sem lançar no estado de erro
    core/dados/origem.ts       -> obtidoNaReserva(recursos): quando a API serviu dado guardado (X-Mirante-Origem
                                  reserva), o momento mais antigo entre eles; null se nenhum
    core/theme/theme-preference.ts -> ThemePreference: signal tema (light, dark, system), classe .dark, localStorage
    layout/shell/              -> Shell: sidebar (drawer no mobile), topbar com título da rota, router-outlet;
                                  a gaveta fecha a cada navegação, menos a inicial (aparelho lento); rodapé fixo
                                  com o link do código e a versão (ligada à tag do GitHub)
      navegacao.ts             -> NAVEGACAO: grupos Painéis e Kit com rota, rótulo e ícone Font Awesome
      outros-projetos.ts       -> OUTROS_PROJETOS: Planuz, portfólio e blog, em "Conheça também" (abre em nova aba)
    layout/theme-toggle/       -> ThemeToggle: radiogroup claro, escuro e sistema
    dashboards/aviso-de-reserva/ -> AvisoDeReserva (mi-aviso-de-reserva): "Dado guardado" com a data, quando a
                                  fonte está fora; específico dos painéis, fora do kit
    dashboards/bcb/            -> painel do Banco Central em /bcb
      sgs.ts                   -> SGS pela API do Mirante: urlSerie por janela de datas, lerSerie (descarta datas
                                  futuras da meta Selic), mensalizar (fechamento), rotuloMes/Dia
      series.ts                -> SERIES_BCB: Selic 432, dólar 1, euro 21619, crédito 20539 (milhões),
                                  inadimplência 21082, IBC-Br 24364; resumirSerie (variação contra 12 meses antes)
      bcb-painel.ts            -> BcbPainel: período 1A/2A/5A refaz as consultas, KPIs, 4 gráficos, tabela mensal
    dashboards/ipea/           -> painel do Ipeadata em /ipea
      ipeadata.ts              -> OData v4 pela API do Mirante: urlValores (código validado por regex, vai entre
                                  aspas no OData), lerValores (descarta item malformado), anualizar (último valor
                                  de cada ano). O comentário da série nos metadados é HTML: não usar
      series.ts                -> SERIES_IPEA: crescimento do PIB, PIB per capita em US$ (mil), salário mínimo
                                  real (mensal), Gini; resumirIpea (variação contra o ano anterior)
      ipea-painel.ts           -> IpeaPainel: período Desde 1995 / 1980 / Tudo recorta no navegador (a API
                                  devolve a série inteira), KPIs, 4 gráficos e tabela anual
    dashboards/ibge/           -> painel do IBGE em /ibge (?uf=RJ filtra pela UF)
      agregados.ts             -> agregados v3 pela API do Mirante: urlAgregado, lerValor (símbolos do IBGE viram
                                  null), lerAgregado (variável -> localidade -> pontos), rotuloPeriodo, ultimoValido
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
- **Não rodar o Prettier** nos arquivos existentes: a base usa linhas de até 120 colunas e o Prettier reformataria tudo.

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

- Toda tela trata os três estados: **carregando (skeleton), vazio e erro com "Tentar de novo"**. Nada de tela em branco. Dado servido da reserva mostra o aviso "Dado guardado".
- Foco visível só no teclado (`:focus-visible`), contraste AA nos dois temas, alvo de toque mínimo de 40 px.
- Números com `tabular-nums` e formatação pt-BR (`Intl.NumberFormat('pt-BR')`).
- `prefers-reduced-motion` respeitado em toda animação.
- Copy sem travessão como separador estilístico (usar vírgula, ponto, dois-pontos ou reescrever).

## Dados

- Consumo por `httpResource` com `parse` que já devolve o modelo tipado; o mapeamento fica em funções puras testadas.
- **Nunca ler `.value()` de um resource sem `hasValue()`**: em estado de erro ele lança exceção e derruba a tela. Use `valorDe()` de `core/dados/valor-de.ts`.
- Símbolos de dado ausente das fontes ("-", "...", "X") viram `null` e aparecem como "sem dado", nunca como zero.
- Cada card com dado preenche `fonte` com o órgão e a tabela de origem; o período de referência aparece junto do número.
- Testes nunca batem na rede: unidade com `HttpTestingController` e respostas mínimas; E2E com o HAR gravado (tudo fora da origem é bloqueado).

## Segurança do front

- Sem `bypassSecurityTrust*` sobre dado vindo de API; cabeçalho da resposta só é comparado ou formatado, nunca vai para o DOM como HTML.
- Link externo com `rel="noopener noreferrer"`.
- Nada em `localStorage` além da preferência de tema.
- Nada de script ou estilo inline no `index.html`: a CSP não tem `unsafe-inline` e usa Trusted Types.
- Sem `console.*` com objeto de resposta em código de produção.
- Antes de release, rodar o agente `seguranca-angular`.

## Comandos (de dentro de frontend/)

```bash
npm start              # servidor local; /api vai para a API local (proxy.conf.json)
npm run build:deploy   # build de produção (portão de toda fase)
npm run test:ci        # testes unitários em ChromeHeadless, sem watch (portão de toda fase)
npm run e2e            # Playwright, desktop e celular (portão das telas tocadas; suíte inteira antes de release)
E2E_BASE_URL=http://localhost:8092 npx playwright test       # E2E contra a imagem de produção (CSP real)
GRAVAR=1 E2E_BASE_URL=http://localhost:8092 npx playwright test gravar-apis --project=desktop   # regrava o HAR (compose de pé)
```

Armadilhas de layout que o E2E pega: `sr-only` direto em `<table>` não funciona (a tabela ignora a largura de 1 px e alarga a página; envolver numa `div.sr-only`), e `grid` sem `grid-cols-1` deixa um `<pre>` largo esticar a coluna. Área com `overflow-x-auto` precisa de `tabindex="0"` para rolar pelo teclado.
