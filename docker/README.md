# Mirante: infraestrutura

Como o Mirante roda em containers, como é publicado e como operar em produção.

## Serviços

| Serviço | O quê | Porta local |
|---|---|---|
| `web` | nginx com o site e o encaminhamento de `/api` para a API | 8092 |
| `api` | API .NET 10 | 8093 |
| `postgres` | reserva da última resposta boa de cada série | sem porta |
| `redis` | cache (sem persistência) | sem porta |

Postgres e Redis ficam numa rede interna, sem saída para a internet, que só a API enxerga. O site fala só com a API.

## Rodando tudo localmente

Da raiz do repositório:

```bash
docker compose -f docker/docker-compose.yml up -d --build
# site em http://localhost:8092, API em http://localhost:8093
cd frontend && E2E_BASE_URL=http://localhost:8092 npx playwright test
```

## Publicação

1. PR aprovado na `main`, com o `VERSION` atualizado.
2. Branch `release/vX.Y.Z` a partir da `main` e tag `vX.Y.Z`. O push do branch dispara o pipeline no Azure DevOps.
3. O pipeline:
   - testa o front e a API;
   - monta as imagens `mirante-web` e `mirante-api`;
   - roda o E2E contra o site;
   - envia as imagens para a VPS e grava o `.env` com a senha do Postgres, que vem do variable group;
   - sobe a stack com `docker compose ... up -d --wait`.

   O deploy só termina quando os quatro serviços estão saudáveis.

## Conferindo produção

```bash
curl -I https://mirante.felipemarcianodev.com/            # CSP, HSTS, no-cache
curl -s https://mirante.felipemarcianodev.com/ibge | grep og:title   # cartão do link da rota
curl -sI "https://mirante.felipemarcianodev.com/api/ipea/odata4/ValoresSerie(SERCODIGO='PNADS_GINI')?\$select=VALDATA,VALVALOR" | grep -i x-mirante
# na VPS, em /opt/mirante/docker:
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
curl -s http://127.0.0.1:8093/health/ready
```

## Voltando para a versão anterior

Cada deploy guarda a versão que estava no ar com a tag `:anterior`. Na VPS, em `/opt/mirante/docker`:

```bash
docker tag mirante-web:anterior mirante-web:latest
docker tag mirante-api:anterior mirante-api:latest
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --no-build --wait
```

A reserva no Postgres fica no volume `postgres-dados` e não se perde ao trocar de versão.

## Nginx de borda e certificado

Um teste do front (`frontend/scripts/ligacoes.test.mjs`) falha se a CSP da imagem e a cópia da borda divergirem.

O domínio chega pelo nginx do Planuz (container `planuz-nginx`), que cuida do TLS e repete a CSP. O server block fica no repositório do Planuz (`docker/nginx/conf.d/site-mirante.conf`), com uma cópia de referência em `borda/`. O certificado Let's Encrypt é emitido uma vez com `setup-letsencrypt-mirante.sh` e renovado pelo `planuz-certbot`.
