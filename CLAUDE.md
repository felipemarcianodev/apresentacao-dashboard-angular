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
| Ipeadata (OData v4) | `http://www.ipeadata.gov.br/api/odata4/` | Séries históricas consolidadas |

Regra: **nenhum número inventado.** Toda tela mostra a fonte e a data de referência do dado. Dado ilustrativo na galeria é marcado como exemplo.

### Stack

- **Frontend:** Angular 20 (standalone, zoneless, signals), TypeScript, Tailwind CSS v4 (CSS-first, `@theme`), Font Awesome Free empacotado localmente, fonte Inter auto-hospedada.
- **Testes:** Karma + Jasmine (ChromeHeadless) para unidade; Playwright para E2E (a partir da fase de qualidade).
- **Futuro:** backend .NET 10 + EF Core 10, solução `.slnx`, testes de unidade e de integração (Testcontainers). Quando entrar, os portões da skill `executar-plano-faseado` ganham `dotnet build` e `dotnet test`.

### Ambientes

| Ambiente | Endereço |
|---|---|
| Local | `http://localhost:4200` (`npm start`) |
| Produção | a definir (sugestão: `mirante.felipemarcianodev.com`, mesma VPS do portfólio) |

## Mapa de arquivos

```
CLAUDE.md                      -> este arquivo (regras e mapa)
README.md                      -> apresentação pública do projeto
.gitignore                     -> padrão do Angular CLI + plano faseado local de docs/
.postcssrc.json                -> liga o Tailwind v4 (@tailwindcss/postcss) ao build do Angular
angular.json                   -> projeto "mirante", prefixo mi; estilos globais: Inter, Font Awesome e src/styles.css
package.json                   -> scripts start, build:deploy, test:ci
docs/                          -> documentação; plano-reconstrucao.md é local e não vai para o git
.claude/skills/executar-plano-faseado/ -> executa o plano fase a fase com os portões
.claude/agents/seguranca-angular.md    -> auditor de segurança Angular (angular.dev/best-practices/security)
public/
  favicon.ico
  geo/br-uf.json               -> malha das 27 UFs (API de malhas do IBGE, coordenadas com 2 casas), usada pelo MapaUf
  theme-init.js                -> aplica .dark antes do Angular subir (evita piscar); arquivo estático por causa da CSP
src/
  index.html                   -> documento base (lang pt-BR), carrega theme-init.js
  main.ts                      -> bootstrap da aplicação
  styles.css                   -> @import tailwindcss + @theme: escala primary do blog, tokens de superfície
                                  (bg, surface, sunken, fg, muted, line, grid), accent e semânticas (up, down,
                                  warn, violet); valores escuros em .dark; foco visível e reduced-motion
  app/
    app.ts                     -> componente raiz (mi-root), só monta o shell
    app.config.ts              -> providers: zoneless, router com withComponentInputBinding, HttpClient com fetch
    app.routes.ts              -> rotas lazy /ibge, /bcb, /ipea, /ui; data.titulo vira o título da topbar
    core/formato/formato.ts    -> formatar(valor, formato) pt-BR (numero, decimal, percentual em pontos, moeda,
                                  compacto) e formatarVariacao com sinal; SEM_DADO para nulo
    core/brasil/ufs.ts         -> UFS: 27 UFs com código IBGE, sigla, nome e região; ufPorCodigo, ufPorSigla
    core/theme/theme-preference.ts -> ThemePreference: signal tema (light, dark, system), classe .dark, localStorage
    layout/shell/              -> Shell: sidebar (drawer no mobile), topbar com título da rota, router-outlet
      navegacao.ts             -> NAVEGACAO: grupos Painéis e Kit com rota, rótulo e ícone Font Awesome
    layout/theme-toggle/       -> ThemeToggle: radiogroup claro, escuro e sistema
    dashboards/em-breve/       -> EmBreve: página provisória de painel ainda não construído
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
      largura-do-host.ts       -> larguraDoHost(): signal com a largura do elemento (ResizeObserver)
      sparkline/               -> Sparkline (mi-sparkline): tendência sem eixos, cor por currentColor
      kpi-card/                -> KpiCard (mi-kpi-card): valor, variação com sentidoBom, sparkline, referência
      line-chart/              -> LineChart (mi-line-chart): séries, eixo redondo, tooltip, setas, tabela sr-only
      bar-list/                -> BarList (mi-bar-list): ranking horizontal em HTML, ordenar e limite
      mapa-uf/                 -> MapaUf (mi-mapa-uf): coroplético por quantil, seleção por clique ou Enter
        projecao.ts            -> projetarMalha (equiretangular), limitesPorQuantil, classeDoValor
        malha-de-teste.ts      -> malha mínima para specs
    table/                     -> tabela de dados do kit
      coluna-tabela.model.ts   -> ColunaTabela<T> (id, titulo, valor, formato, alinhamento, ordenavel), Ordenacao
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

## Segurança

- Sem `bypassSecurityTrust*` sobre dado vindo de API.
- Link externo com `rel="noopener noreferrer"`.
- Nada em `localStorage` além da preferência de tema.
- Sem script de terceiro (analytics, pixel). Hosts externos permitidos: só as três APIs de dados.
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
- A `main` do GitHub (antes `master`) é protegida e só aceita pull request: trabalhar num branch (`feat/...`), dar push nele e integrar por PR.

## Comandos

```bash
npm start              # servidor local
npm run build:deploy   # build de produção (portão de toda fase)
npm run test:ci        # testes unitários em ChromeHeadless, sem watch (portão de toda fase)
```
