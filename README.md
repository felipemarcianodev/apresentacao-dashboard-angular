# Mirante

Kit de dashboard em **Angular 20** e **Tailwind CSS v4**, com painéis sobre dados abertos do Brasil: IBGE, Banco Central e Ipeadata, servidos por uma **API .NET 10** com cache em Redis e reserva em PostgreSQL.

- Componentes standalone, zoneless e baseados em signals, seguindo o [Angular Style Guide](https://angular.dev/style-guide).
- Tailwind usado de forma pura: sem biblioteca de componentes e sem biblioteca de gráficos. Os gráficos são SVG próprio.
- A rota `/ui` documenta cada componente do kit, com exemplo, API e trecho de uso, para quem quiser reaproveitar.

## Arquitetura

O navegador só fala com a própria origem. Os painéis chamam `/api/...`, e a API do Mirante consulta as fontes oficiais:

- **Lista permitida:** só as séries, agregados e janelas de data que os painéis usam; a API não é um proxy aberto.
- **Cache em duas camadas:** memória do processo e Redis (`HybridCache`), com validade por fonte e uma ida só à fonte para consultas simultâneas.
- **Reserva:** a última resposta boa de cada série fica no PostgreSQL (EF Core 10). Se a fonte cair, o painel mostra o dado guardado, com a data, em vez de erro.
- **Proteção:** rate limiter por IP, resiliência nas chamadas às fontes (tempo por tentativa, novas tentativas e disjuntor) e CSP com `connect-src 'self'`.

## Rodando localmente

Requer Node 20.19 ou superior, .NET SDK 10 e Docker.

```bash
npm install
docker compose -f docker/docker-compose.yml up -d postgres redis
dotnet run --project backend/src/Mirante.Api   # API em http://localhost:5110
npm start                                      # http://localhost:4200, com /api encaminhado para a API
npm run build:deploy   # build de produção
npm run test:ci        # testes unitários do front (Chrome headless)
npm run e2e            # testes de ponta a ponta (Playwright), desktop e celular de 360 px
cd backend && dotnet test --solution Mirante.slnx   # testes da API (unidade e integração com Testcontainers)
```

Na primeira vez, instale o navegador do Playwright com `npx playwright install chromium`. A suíte de ponta a ponta não usa a rede: as respostas ficam gravadas em `e2e/dados/apis.har` e o relógio do navegador é fixado no dia da gravação. Ela cobre navegação, os três painéis, a galeria, acessibilidade com axe (WCAG 2.2 AA nos dois temas), alvo de toque de 40 px e ausência de rolagem lateral.

## Publicação

A stack roda em Docker Compose (`docker/`): o site num nginx com CSP estrita, a API sem root, o PostgreSQL e o Redis numa rede interna sem saída para a internet. Para rodar tudo localmente:

```bash
docker compose -f docker/docker-compose.yml up -d --build   # http://localhost:8092
E2E_BASE_URL=http://localhost:8092 npx playwright test      # E2E contra a imagem
```

Em produção, o pipeline (`azure-pipelines.yml`, disparado por `release/*`) roda os testes do front e da API, monta as imagens, executa o E2E contra o site e sobe a stack na VPS, esperando o health de cada serviço.

## Fontes de dados

Todas públicas, sem chave de acesso:

- [IBGE, API de agregados](https://servicodados.ibge.gov.br/api/docs/agregados?versao=3)
- [Banco Central, API SGS](https://dadosabertos.bcb.gov.br/)
- [Ipeadata](https://www.ipeadata.gov.br/)
