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
public/                        -> arquivos estáticos (favicon)
src/
  index.html                   -> documento base (lang pt-BR)
  main.ts                      -> bootstrap da aplicação
  styles.css                   -> @import tailwindcss + @theme (tokens de design)
  app/
    app.ts | app.html          -> componente raiz (mi-root)
    app.config.ts              -> providers: zoneless, router, erros globais
    app.routes.ts              -> rotas
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
- A `master` do GitHub é protegida e só aceita pull request: trabalhar num branch (`feat/...`), dar push nele e integrar por PR.

## Comandos

```bash
npm start              # servidor local
npm run build:deploy   # build de produção (portão de toda fase)
npm run test:ci        # testes unitários em ChromeHeadless, sem watch (portão de toda fase)
```
