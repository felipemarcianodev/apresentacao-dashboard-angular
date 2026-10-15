# Mirante

Kit de dashboard em **Angular 22** e **Tailwind CSS v4**, com painéis sobre dados abertos do Brasil: IBGE, Banco Central e Ipeadata, servidos por uma **API .NET 10** com cache em Redis e reserva em PostgreSQL.

- Componentes standalone, zoneless e baseados em signals, seguindo o [Angular Style Guide](https://angular.dev/style-guide).
- Tailwind usado de forma pura: sem biblioteca de componentes e sem biblioteca de gráficos. Os gráficos são SVG próprio.
- A rota `/ui` documenta cada componente do kit, com exemplo, API e trecho de uso, para quem quiser reaproveitar.
- A rota `/testes` mostra os testes de ponta a ponta por persona (celular, teclado, leitor de tela e outras), gerada dos próprios specs.
- Cada painel tem o próprio cartão de prévia do link (título, descrição e imagem) no WhatsApp, LinkedIn e Slack, sem SSR.

## Arquitetura

O navegador só fala com a própria origem. Os painéis chamam `/api/...`, e a API do Mirante consulta as fontes oficiais:

- **Lista permitida:** só as séries, agregados e janelas de data que os painéis usam; a API não é um proxy aberto.
- **Cache em duas camadas:** memória do processo e Redis (`HybridCache`), com validade por fonte e uma ida só à fonte para consultas simultâneas.
- **Reserva:** a última resposta boa de cada série fica no PostgreSQL (EF Core 10). Se a fonte cair, o painel mostra o dado guardado, com a data, em vez de erro.
- **Proteção:** rate limiter por IP, resiliência nas chamadas às fontes (tempo por tentativa, novas tentativas e disjuntor) e CSP com `connect-src 'self'`.

## Estrutura

| Pasta | O quê | Documentação |
|---|---|---|
| [`frontend/`](frontend/) | o site em Angular 22 e Tailwind v4, com a galeria do kit em `/ui` | [frontend/README.md](frontend/README.md) |
| [`backend/`](backend/) | a API em .NET 10, com PostgreSQL e Redis | [backend/README.md](backend/README.md) |
| [`docker/`](docker/) | imagens, compose, nginx e o runbook de publicação | [docker/README.md](docker/README.md) |

A documentação de cada pasta acompanha o código no mesmo PR. Um workflow do GitHub confere isso em todo PR (`scripts/verificar-documentacao.mjs`), junto com os unitários, o catálogo da galeria `/testes` e o build.

## Rodando localmente

Requer Node 24 (ou 22.22.3 ou superior), .NET SDK 10 e Docker.

```bash
docker compose -f docker/docker-compose.yml up -d postgres redis
dotnet run --project backend/src/Mirante.Api   # API em http://localhost:5110
cd frontend && npm install && npm start        # site em http://localhost:4200, com /api na API local
```

Ou a stack inteira em containers: `docker compose -f docker/docker-compose.yml up -d --build` (site em http://localhost:8092). Testes de cada parte no README da pasta.

## Publicação

O pipeline (`azure-pipelines.yml`, disparado por `release/*`) roda os testes do front e da API, monta as imagens, executa o E2E contra o site e sobe a stack na VPS, esperando o health de cada serviço. Detalhes e como voltar versão em [docker/README.md](docker/README.md).

## Fontes de dados

Todas públicas, sem chave de acesso:

- [IBGE, API de agregados](https://servicodados.ibge.gov.br/api/docs/agregados?versao=3)
- [Banco Central, API SGS](https://dadosabertos.bcb.gov.br/)
- [Ipeadata](https://www.ipeadata.gov.br/)
