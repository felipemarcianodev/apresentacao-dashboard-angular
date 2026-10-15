---
name: executar-plano-faseado
description: Executa um plano faseado em markdown do Mirante (`docs/plano-*.md` ou outro apontado) fase a fase, com os portões combinados (build de produção, testes unitários e, quando existir backend, build da solução .slnx e suítes de unidade e integração), correção até verde, status registrado no próprio plano, commit e push no branch de trabalho, e só então a próxima fase. Use quando o usuário disser "execute o plano", "pode seguir com as fases", "faça fase a fase", ou apontar um plano faseado para implementar.
---

# Executar plano faseado

## Regras do dono (não negociáveis)

- **Uma fase por vez.** Antes da próxima, os portões do que a fase tocou, todos verdes. Erro: corrigir até verde. Só então commit e push.
- **Decida e execute.** Parar para perguntar só em três casos: ação irreversível ou destrutiva fora do que o plano já prevê, mudança de escopo, ou regra sem definição que impede a fase de existir. Fase marcada "requer aprovação" ou "alto risco" no plano cai no segundo caso: perguntar item a item antes. Fora disso, escolher a opção mais defensável e declarar a escolha no resumo.
- **Commit** no padrão do `CLAUDE.md` ("Padrão de commits"): `tipo(escopo): descrição` em português com acentuação, texto puro, corpo com o motivo e os números reais de teste, **sem** `Co-Authored-By` nem assinatura de IA. Adicionar arquivo por caminho, só o que a fase tocou (conferir `git status` e deixar de fora mudança do usuário). Push no branch de trabalho (a `main` é protegida e só recebe PR), nunca `--force`.
- **Não mexer no estado do git para investigar** (stash, reset, checkout de arquivo, restore). Ler com `git show`, `git diff`, `git log`.
- **Status no plano:** marcar a fase `[x]`, registrar o que foi feito e sub-itens descobertos como `[ ]`. O plano em `docs/` pode ser local (fora do git): nesse caso, atualizar o arquivo e não tentar commitá-lo.
- **Documentação viva no mesmo commit:** o `CLAUDE.md` (mapa e regras) e o `README.md` de cada área tocada (`frontend/`, `backend/`, `docker/`) acompanham o código; contrato entre front e API atualizado nos dois lados.
- **Componente novo do kit entra documentado** na galeria `/ui` (arquivo `*.doc.ts` ao lado do componente) no mesmo commit.

## Portões de cada fase

Rodar um build pesado de cada vez; nada em paralelo ao Playwright.

Comandos do front rodam de dentro de `frontend/`; os do backend, de dentro de `backend/`.

1. Frontend: `npm run build:deploy` sem erro nem warning novo.
2. Frontend: `npm run test:ci` com 0 falhas. Fase que cria lógica (escala de gráfico, formatação, mapeamento de API) cria o teste junto.
3. E2E (a partir da fase de qualidade): `npx playwright test` das telas tocadas; suíte inteira no fim do plano. Se não rodou, dizer no resumo e por quê.
4. Backend: `dotnet build Mirante.slnx` com 0 avisos, `dotnet test` dos projetos de unidade e **suíte de integração inteira** (Testcontainers, Docker de pé). Rodar só o teste que falhou não conta.
5. Segurança: se a fase tocou HTML dinâmico, URL vinda de API, interceptor ou dependência, rodar o agente `seguranca-angular` sobre o diff antes do commit; se tocou o backend (validação, cache, proteção), uma revisão de segurança do backend.
6. Documentação: o diff da fase traz o `CLAUDE.md` e o `README.md` de cada área tocada atualizados. Sem isso a fase não fecha. Antes do commit: `node scripts/verificar-documentacao.mjs` (da raiz) verde e o subagente `revisor-de-documentacao` sem apontamento pendente. Mexeu em teste de ponta a ponta: o catálogo da `/testes` (`frontend/src/app/testes/catalogo.ts`) entra no mesmo commit (o hook regrava; `npm run testes:catalogo` à mão).
7. Ambiente: `docker info` antes da integração do backend e do E2E contra o container (o Docker Desktop pode estar parado). Mexeu em `.claude/`, validar o cabeçalho YAML.

## Antes de começar

1. Ler o plano inteiro, o `CLAUDE.md` da raiz (regras gerais, commits) e o `CLAUDE.md` de cada área que a fase vai tocar (mapa, regras).
2. Confirmar o estado: `git status` (separar o que é do usuário), `git fetch` e branch de trabalho alinhado com o remoto.
3. Se o plano tiver decisão em aberto que muda o desenho, perguntar uma vez, agrupado, antes da primeira fase.

## Por fase

1. **Contrato:** se a fase mexe em backend e frontend, escrever o contrato (rotas, DTOs, campos, enums, códigos de erro) num arquivo no scratchpad antes de implementar. Os dois lados seguem ele.
2. **Agentes (opcional, até 3 em paralelo, posse exclusiva de arquivos):** quando a fase tiver frentes independentes (por exemplo, componentes diferentes do kit). Cada prompt leva a fase, o contrato, as regras do `CLAUDE.md`, "não faça commit nem push", "não crie subagentes" e as pastas de escopo. Fase pequena: fazer direto, sem inventar trabalho.
3. **Integração:** ler os relatórios, conferir divergência entre agentes e alinhar a documentação ao código (o código com teste é a verdade).
4. **Portões** (acima).
5. **Commit e push**, plano atualizado, aviso ao usuário em 2 a 4 linhas (o que entrou, números dos testes, pendências), próxima fase.

## Se algo travar

- Agente sem progresso por muito tempo: parar e redistribuir ou retomar.
- Teste instável: investigar a causa (corrida, fuso, espera por tempo, cache em `.angular/`) antes de mexer no teste. Nunca afrouxar asserção nem desligar teste para ficar verde.
- API pública fora do ar durante a fase: não é falha do portão; os testes usam `HttpTestingController` e nunca batem na rede.

## Fim do plano

Marcar o plano como EXECUTADO no topo, consolidar pendências no próprio plano, rodar a E2E completa se já existir, e resumir ao usuário: fases, commits, números, pendências e o que precisa de decisão.
