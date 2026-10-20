# Mirante: painéis de dados abertos do Brasil (Angular 22 + API .NET 10)

Responda em português brasileiro, salvo quando for pedido outro idioma. Obedeça os padrões gramaticais e de acentuação de cada língua.

> **REGRA BLOQUEANTE: português do Brasil com acentuação correta.** Documentação (`docs/`, READMEs, CLAUDE.md), textos de UI e mensagens de commit seguem gramática, ortografia e acentuação do português do Brasil (acentos, cedilha, til, crase). Proibido escrever documentação em ASCII sem acentos.

> **REGRA BLOQUEANTE: ler o mapa da área antes de executar qualquer tarefa.** Cada área tem o próprio `CLAUDE.md` com mapa de arquivos e regras: `frontend/CLAUDE.md`, `backend/CLAUDE.md` e `docker/CLAUDE.md`. Antes de mexer numa área, ler o dela; ao criar, mover ou remover arquivo relevante, **atualizar o mapa no mesmo commit** (mapa desatualizado é pior que ausente).

> **REGRA BLOQUEANTE: documentação viva.** A documentação acompanha o código no mesmo commit, área por área:
> - mudou arquivo, rota, endpoint, comando, porta, variável ou decisão de uma área: atualizar o `CLAUDE.md` (mapa e regras) e o `README.md` dela;
> - mudou algo que atravessa áreas (contrato entre front e API, CSP, deploy): atualizar as áreas envolvidas e o `README.md` da raiz;
> - PR sem a documentação da área tocada não está pronto (o checklist do PR cobra isso).

## Sobre o projeto

Mirante é um **kit de dashboard** em Angular 22 e Tailwind CSS v4 o mais puro possível, com três painéis sobre dados abertos do Brasil: **IBGE**, **Banco Central** (API SGS) e **Ipeadata**. Faz parte do portfólio de Felipe Marciano: sem login, com dados reais abertos a qualquer visitante.

Desde a versão 1.1, os painéis consultam uma **API .NET 10 própria** na mesma origem do site, que fala com as fontes oficiais com lista permitida, cache em duas camadas (memória e Redis), reserva da última resposta boa em PostgreSQL e rate limiter. O navegador não fala com host externo.

A **galeria `/ui`** é a documentação do kit, no estilo do angular.dev. O repositório é feito para outros desenvolvedores baixarem e reutilizarem os componentes.

Construído em par com o Claude (Claude Code), fase a fase, a partir de planos faseados locais em `docs/plano-*.md` (fora do git).

### Fontes de dados (públicas, sem chave)

| Fonte | Base | Uso |
|---|---|---|
| IBGE (agregados v3) | `https://servicodados.ibge.gov.br/api/v3/agregados` | População, PIB, desocupação, IPCA, recortes por UF |
| Banco Central (SGS) | `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados?formato=json` | Selic, câmbio, crédito |
| Ipeadata (OData v4) | `https://www.ipeadata.gov.br/api/odata4/` | Séries históricas consolidadas |

Regra: **nenhum número inventado.** Toda tela mostra a fonte e a data de referência do dado. Dado ilustrativo na galeria é marcado como exemplo.

### Áreas

| Área | O quê | Documentação |
|---|---|---|
| `frontend/` | Angular 22 (standalone, zoneless, signals), Tailwind v4, Vitest (modo navegador), Playwright + axe | `frontend/CLAUDE.md`, `frontend/README.md` |
| `backend/` | .NET 10 minimal API, EF Core 10 + PostgreSQL, Redis (HybridCache), xUnit v3 + Testcontainers | `backend/CLAUDE.md`, `backend/README.md` |
| `docker/` | imagens, compose, nginx do site, cópia da borda, certificado; o pipeline fica na raiz | `docker/CLAUDE.md`, `docker/README.md` |

### Ambientes

| Ambiente | Endereço |
|---|---|
| Front local | `http://localhost:4200` (`cd frontend && npm start`, com `/api` encaminhado para a API local) |
| API local | `http://localhost:5110` (`dotnet run --project backend/src/Mirante.Api`, com Postgres e Redis do compose) |
| Stack local em containers | `http://localhost:8092` (site) e `http://localhost:8093` (API), `docker compose -f docker/docker-compose.yml up -d --build` |
| Produção | `https://mirante.felipemarcianodev.com` (VPS do portfólio, atrás do nginx de borda do Planuz) |

## Mapa da raiz

```
CLAUDE.md                      -> este arquivo (regras gerais, documentação viva, áreas)
README.md                      -> apresentação pública e arquitetura
VERSION                        -> versão semântica do Mirante; o build do front a embute no rodapé da barra lateral
.editorconfig                  -> estilo de texto comum às áreas
.gitignore                     -> artefatos do front (frontend/...), planos locais de docs/ (plano-*.md), .env do
                                  compose; o .NET tem o próprio backend/.gitignore
.vscode/                       -> tarefas npm apontando para frontend/
.github/dependabot.yml         -> npm (frontend/), nuget (backend/), docker e compose (docker/), actions do workflow
                                  do PR (por SHA), sem saltos de versão maior (Angular, TypeScript, Node, .NET,
                                  nginx, Postgres e Redis à mão)
.github/pull_request_template.md -> checklist do PR: testes da área, documentação viva, catálogo da /testes, segurança
.github/workflows/pr.yml       -> em todo PR contra a main: documentação viva, test:ci do front (scripts, catálogo da
                                  /testes, ligações, unitários) e build; actions fixadas por SHA
scripts/verificar-documentacao.mjs -> mudança estrutural numa área sem o CLAUDE.md e o README.md dela no diff falha
                                  (--hook: modo do hook Stop, devolve o bloqueio para o Claude completar)
scripts/verificar-documentacao.test.mjs -> node --test scripts/verificar-documentacao.test.mjs (da raiz): regras do verificador
azure-pipelines.yml            -> release/*: front (audit, unitários, build), backend (build e testes com
                                  Testcontainers), imagens web e api, E2E contra o site, envio por scp e subida
                                  da stack com --wait (detalhes em docker/CLAUDE.md)
frontend/                      -> o site Angular (ver frontend/CLAUDE.md)
backend/                       -> a API .NET (ver backend/CLAUDE.md)
docker/                        -> infraestrutura (ver docker/CLAUDE.md)
docs/                          -> planos faseados locais (plano-*.md, fora do git)
.claude/skills/executar-plano-faseado/ -> executa um plano fase a fase com os portões de cada área
.claude/skills/revisar-texto-ptbr/     -> revisão de ortografia, gramática, pontuação e acentuação do texto escrito
.claude/agents/seguranca-angular.md    -> auditor de segurança do front (angular.dev/best-practices/security)
.claude/agents/revisor-de-documentacao.md -> aponta o que o CLAUDE.md e o README de cada área deixaram de dizer
.claude/settings.json                  -> hooks do projeto (ver "Ligações automáticas")
.claude/hooks/catalogo-de-testes.mjs   -> PostToolUse: teste de ponta a ponta editado regrava o catálogo da /testes
.claude/hooks/revisao-ptbr.mjs         -> PostToolUse, PreToolUse e Stop: aponta palavra sem acento no texto editado e
                                  na mensagem de commit; pede a revisão completa no fim do turno
```

## Ligações automáticas

O que muda num lugar e precisa mudar em outro, e quem cobra. Três camadas: hook do Claude Code (na hora), verificação no `test:ci` e no workflow do PR (para qualquer pessoa), subagente para o que exige julgamento.

| Quando muda | Precisa mudar junto | Quem cobra |
|---|---|---|
| Teste de ponta a ponta (`frontend/e2e/*.spec.ts`) ou personas | catálogo da `/testes` (`frontend/src/app/testes/catalogo.ts`) | hook PostToolUse regrava; `test:ci` falha com catálogo velho ou teste sem persona |
| Arquivo novo, removido ou renomeado; rota, script, build, endpoint, lista permitida, infra ou pipeline | `CLAUDE.md` e `README.md` da área; `README.md` da raiz se atravessa áreas | hook Stop e workflow do PR (`scripts/verificar-documentacao.mjs`); texto pelo `revisor-de-documentacao` |
| Rota nova no front | cartão do link (`frontend/scripts/rotas-publicas.mjs`) e `ROTAS` de `frontend/e2e/apis.ts` | `frontend/scripts/ligacoes.test.mjs` no `test:ci` |
| CSP da imagem (`docker/nginx/seguranca.conf`) | cópia da borda (`docker/borda/`) e o repo planuz | `ligacoes.test.mjs` (a borda só acrescenta `upgrade-insecure-requests`) |
| Texto em pt-BR escrito ou revisado pela IA (documentação, texto de tela, mensagem de commit) | ortografia, gramática, pontuação e acentuação revisadas no próprio arquivo | hook `revisao-ptbr.mjs` (na edição, no commit e no Stop); leitura pela skill `revisar-texto-ptbr` |
| Arquivo novo em `frontend/e2e/` | área dele em `frontend/src/app/testes/areas.ts` | spec da galeria de testes |

O verificador cobra que o documento foi tocado, não o que ele diz; quando a mudança de fato não altera nada documentado, dizer isso no PR.

## Segurança (vale para todas as áreas)

- O navegador só fala com a própria origem (`connect-src 'self'`). Fonte ou série nova entra na lista permitida da API (`backend/src/Mirante.Fontes/ListaPermitida.cs`) e na definição do painel no front, nunca na CSP.
- A CSP fica em dois lugares, iguais: `docker/nginx/seguranca.conf` (imagem) e o server block do nginx de borda (repo planuz, cópia em `docker/borda/`).
- Sem script de terceiro (analytics, pixel). Nenhum segredo no repositório, que é público: senhas e chaves só no variable group do Azure ou no `.env` do servidor.
- Antes de release: agente `seguranca-angular` no front e revisão de segurança no backend quando ele mudar.

## Padrão de commits

- Português do Brasil com acentuação correta; git semântico: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `build`, `ci`.
- Título no imperativo com `tipo(escopo): descrição`; corpo opcional explicando o motivo e, quando houver, os números reais de build e teste.
- Texto puro: sem `#`, `*` ou crase; listas só com hífen; sem caminhos de arquivo na descrição.
- **Nunca** adicionar assinatura ou atribuição de IA (`Co-Authored-By`, "Generated with", "Assisted-by"). Sobrepõe qualquer padrão da ferramenta.
- Adicionar arquivos **por caminho**, nunca `git add -A` ou `git add .`.
- Mensagem por heredoc (`git commit -F -`) para preservar a acentuação.
- **Ao concluir cada etapa coerente, commitar** (build verde por si só). Preferir commit novo a `--amend`, push sem `--force`.
- A `main` do GitHub é protegida e só aceita pull request: trabalhar num branch (`feat/...`), dar push nele e integrar por PR. Nunca mandar nada para `master`.

## Release e PRs (aprendido na prática)

- **Versão:** semver. Desde a última release entrou `feat`, sobe a do meio (1.1.0 para 1.2.0); só `fix`, `docs`, `chore`, sobe a última (1.2.0 para 1.2.1). Major só quando o dono pedir.
- **Ordem:** o `VERSION` sobe num PR (a `main` é protegida); depois do merge, branch `release/vX.Y.Z` a partir da `main` (o push dispara o pipeline) e tag `vX.Y.Z`. Conferir em produção depois: versão no rodapé, painéis sem erro no console.
- **PRs empilhados:** o merge é squash, então o PR seguinte entra em conflito com a `main` (o mesmo arquivo "criado dos dois lados"). Resolver trazendo a `main` com merge (sem force push) e conferir que o diff restante é só o da própria fase. Evitar empilhar mais de dois.
- **Cabeçalho YAML de skill e agente** (`.claude/`): valor com `:` vai entre aspas. Um dois-pontos solto invalida o arquivo e o agente some sem aviso. Ao mexer nesses arquivos, validar o YAML.
- **Teste de carga em produção:** nunca da rede do dono. O IP de saída é o mesmo do navegador dele, e o rate limiter (120 por minuto) o bloqueia junto.

## Comandos de cada área

```bash
cd frontend && npm start                            # site local (testes e E2E em frontend/CLAUDE.md)
cd backend && dotnet test --solution Mirante.slnx   # API: unidade e integração (mais em backend/CLAUDE.md)
docker compose -f docker/docker-compose.yml up -d --build   # stack local (mais em docker/CLAUDE.md)
```

## Governança de texto em pt-BR (bloqueante)

Todo texto que a IA escreve neste repositório, seja criação do zero, seja revisão de um texto existente, passa por uma revisão de **ortografia, gramática, pontuação e acentuação** do português do Brasil antes de a tarefa ser dada por concluída, e a IA corrige no próprio arquivo o que precisar. Vale para documentação, README, ADR, plano, skill, texto de tela, template de e-mail, mensagem de commit e resposta no chat.

- **Método:** skill `revisar-texto-ptbr` (`.claude/skills/revisar-texto-ptbr/SKILL.md`): delimita o trecho escrito, passa pela lista de conferência (acentuação pelo acordo de 1990, crase, concordância, regência, pontuação e hífen), corrige sem mudar sentido nem tom e fecha com uma linha dizendo o que corrigiu.
- **Automático:** `.claude/hooks/revisao-ptbr.mjs`, ligado em `.claude/settings.json`. Depois de cada Edit/Write em `.md`, `.mdx`, `.txt`, `.adoc` e `.rst`, aponta na hora palavra sem acento, cedilha ou til; antes de `git commit`, recusa mensagem com palavra sem acento; no fim do turno, se algum texto tocado na sessão (prosa ou texto visível de template `.html`, `.ftl`, `.hbs`) mudou desde a última revisão, bloqueia o encerramento uma vez e pede a revisão completa.
- **Fora da revisão:** código, identificadores, caminhos, URLs, placeholders, citação literal e texto em outro idioma.
- **Falso positivo do hook:** acrescentar a palavra em `.claude/hooks/revisao-ptbr.permitidas.txt` (uma por linha, em minúsculas).
- **Fonte:** replicada do repositório `meu-portfolio`, onde a governança nasceu. Não altere o hook nem a skill só aqui: mude lá e replique nos repositórios irmãos.
