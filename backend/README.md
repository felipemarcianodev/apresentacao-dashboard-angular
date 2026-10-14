# Mirante: backend

API em **.NET 10** que fica entre o site do Mirante e as fontes oficiais (IBGE, Banco Central e Ipeadata). Responde nos mesmos caminhos das fontes, sob `/api/`, com:

- **lista permitida:** só as séries, agregados e janelas de data que os painéis usam (não é um proxy aberto);
- **cache em duas camadas:** memória do processo e Redis (`HybridCache`);
- **reserva:** a última resposta boa de cada série no PostgreSQL (EF Core 10), servida quando a fonte cai;
- **proteção:** rate limiter por IP, resiliência nas chamadas às fontes e cabeçalhos de segurança.

## Endpoints

| Método e caminho | Fonte |
|---|---|
| `GET /api/ibge/agregados/{agregado}/periodos/{-N}/variaveis/{a\|b}?localidades=N1[all]\|N3[all]` | IBGE, agregados v3 |
| `GET /api/bcb/serie/bcdata.sgs.{codigo}/dados?formato=json&dataInicial=dd/MM/aaaa&dataFinal=dd/MM/aaaa` | Banco Central, SGS (janelas de 1, 2 ou 5 anos até hoje) |
| `GET /api/ipea/odata4/ValoresSerie(SERCODIGO='{codigo}')?$select=VALDATA,VALVALOR` | Ipeadata, OData v4 |
| `GET /health` | processo de pé |
| `GET /health/ready` | Postgres e Redis respondendo (não exposto pelo site) |

Os três endpoints de dados aceitam também HEAD (os mesmos cabeçalhos, sem corpo). Respostas: o JSON da fonte como veio, com `X-Mirante-Origem` (`cache`, `fonte` ou `reserva`) e `X-Mirante-Obtido-Em`. Erros em ProblemDetails: 400 consulta malformada, 404 fora da lista, 429 limite de consultas (com `Retry-After`), 502 fonte fora sem reserva.

## Rodando

Requer .NET SDK 10 e Docker.

```bash
docker compose -f ../docker/docker-compose.yml up -d postgres redis
dotnet run --project src/Mirante.Api        # http://localhost:5110
```

A configuração (cadeias de conexão, prefixo do cache, limite por minuto) está em `CLAUDE.md`, seção Configuração. As migrations são aplicadas na subida.

## Testes

```bash
dotnet build Mirante.slnx
dotnet test --solution Mirante.slnx
```

Os testes de unidade não usam rede nem banco. Os de integração sobem a API de verdade com PostgreSQL e Redis reais (Testcontainers, precisa do Docker) e simulam as três fontes: cobrem lista permitida, cache, chamadas simultâneas, reserva com a fonte fora ou lenta, Redis fora do ar, rate limiter e cabeçalhos.
