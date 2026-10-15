# Mirante: frontend

O site do Mirante em **Angular 20** e **Tailwind CSS v4**: três painéis (IBGE, Banco Central e Ipeadata) e a galeria `/ui`, que documenta cada componente do kit para reaproveitamento.

## Rodando

Requer Node 20.19 ou superior. Para ver dados, a API precisa estar de pé (ver `../backend/README.md`); sem ela, os painéis mostram o estado de erro com "Tentar de novo".

```bash
npm install
npm start              # http://localhost:4200, com /api encaminhado para http://localhost:5110
```

## Testes

```bash
npm run test:ci        # scripts (node --test) e unidade (Karma + Jasmine, Chrome headless)
npm run build:deploy   # build de produção, com o cartão do link de cada rota
npm run e2e            # ponta a ponta (Playwright), desktop e celular de 360 px
```

Na primeira vez, instale o navegador do Playwright com `npx playwright install chromium`. A suíte de ponta a ponta não usa a rede: as respostas das fontes ficam gravadas em `e2e/dados/apis.har` e são servidas no lugar da API, com o relógio do navegador fixado no dia da gravação. Ela cobre navegação, os três painéis (inclusive o aviso de dado guardado), a galeria, acessibilidade com axe (WCAG 2.2 AA nos dois temas), alvo de toque de 40 px e ausência de rolagem lateral.

Contra a imagem de produção, com a CSP real:

```bash
docker compose -f ../docker/docker-compose.yml up -d --build
E2E_BASE_URL=http://localhost:8092 npx playwright test
```

## Prévia do link

Ao colar um link do Mirante no WhatsApp, LinkedIn ou Slack, aparece o cartão com título, descrição e imagem da página. Os robôs desses apps não rodam JavaScript, então o `build:deploy` grava uma cópia do `index.html` por rota pública (`ibge/index.html` e as outras) com os metadados dela, definidos em `scripts/rotas-publicas.mjs`. As imagens ficam em `public/og/` e são geradas por `npm run capas`.

## Como os dados chegam

O navegador só fala com a própria origem. Cada painel chama `/api/...` nos mesmos caminhos das fontes oficiais, e a API do Mirante responde com o JSON da fonte (do cache, da fonte ou, se ela estiver fora, da reserva). O mapeamento para gráficos e tabelas fica em funções puras testadas, em cada pasta de painel. Quando a resposta vem da reserva, o painel mostra "Dado guardado" com a data em que o dado foi obtido.

## Reaproveitando o kit

Abra `/ui` no site: cada componente tem descrição, exemplo funcionando, tabela de API, trecho de uso e notas de acessibilidade. Para usar num projeto seu:

1. Copie a pasta do componente (ex.: `src/app/ui/card`).
2. Traga os tokens de `src/styles.css` (bloco `@theme` e a classe `.dark`).
3. Instale o Font Awesome: `npm i @fortawesome/fontawesome-free`.
4. Importe o componente standalone onde for usar.
