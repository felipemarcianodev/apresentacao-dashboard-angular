# Mirante: infraestrutura (Docker, nginx, pipeline e VPS)

Regras gerais (idioma, documentação viva, commits, segurança comum) no `CLAUDE.md` da raiz. Este arquivo vale para `docker/` e para o `azure-pipelines.yml` da raiz. Caminhos abaixo são relativos a `docker/`, salvo indicação.

> **Documentação viva:** mudou serviço, porta, rede, limite, variável, segredo, etapa do pipeline ou passo de operação, atualizar no mesmo commit o mapa abaixo e o `README.md` desta pasta (runbook). Mudou a CSP ou o nginx de borda, atualizar os dois lugares e a cópia em `borda/`.

## Topologia

```
Internet -> nginx de borda (container planuz-nginx, repo planuz, TLS e HSTS)
         -> rede edge -> mirante-web (nginx: site e /api)
                           -> rede site -> mirante-api (.NET, 8080)
                                             -> rede interna (sem internet) -> mirante-postgres, mirante-redis
                                             -> rede default -> fontes oficiais (IBGE, BCB, Ipeadata)
```

| Serviço | Imagem | Porta no host | Memória | Notas |
|---|---|---|---|---|
| web | `mirante-web` (Dockerfile.web) | 127.0.0.1:8092 | 64 MB | só leitura, capacidades mínimas |
| api | `mirante-api` (Dockerfile.api) | 127.0.0.1:8093 | 128 MB | sem root, só leitura, sem capacidades |
| postgres | `postgres:17-alpine` por digest | nenhuma | 192 MB | volume `postgres-dados`, capacidades mínimas |
| redis | `redis:8-alpine` por digest | nenhuma | 64 MB | sem persistência, 48 MB com LRU, só leitura |

## Mapa de arquivos

```
CLAUDE.md                      -> este arquivo (regras e mapa da infraestrutura)
README.md                      -> runbook: rodar local, publicar, conferir, voltar versão, certificado
Dockerfile.web                 -> build do frontend/ no node:22-alpine (lê o VERSION da raiz), entrega no
                                  nginx:1.30-alpine, ambos por digest; healthcheck em /health
Dockerfile.web.dockerignore    -> leva só o necessário do frontend (sem node_modules, dist, e2e, backend, .github,
                                  .vscode, markdown e .env)
Dockerfile.api                 -> build do backend/ no SDK 10 alpine, execução no aspnet 10 alpine sem root,
                                  digests fixos; healthcheck em /health
Dockerfile.api.dockerignore    -> leva só o backend, sem bin, obj e testes
nginx/nginx.conf               -> site com try_files, gzip (inclusive atrás da borda, HTTP/1.0), cache imutável
                                  para arquivos com hash e no-cache para o resto; /api/ encaminhado para mirante-api
                                  (resolvido a cada requisição; só GET, sem corpo, sem caminho codificado; sem a
                                  API, só o /api dá 502; o /health/ready da API não sai)
nginx/seguranca.conf           -> CSP estrita (sem unsafe-inline, Trusted Types, connect-src só 'self') e
                                  headers; incluído em cada location
docker-compose.yml             -> web, api, postgres e redis; redes site (web e api) e interna (api, postgres e
                                  redis, sem internet); log com teto de 30 MB por serviço; senha local de
                                  desenvolvimento do Postgres
docker-compose.prod.yml        -> pluga o web na rede externa edge da VPS e exige MIRANTE_DB_SENHA (sem ela, o
                                  compose não sobe)
borda/site-mirante.conf        -> cópia de referência do server block do nginx de borda (vale o do repo planuz,
                                  docker/nginx/conf.d/site-mirante.conf)
setup-letsencrypt-mirante.sh   -> emissão inicial do certificado na VPS (volumes do planuz-certbot), imagens por
                                  digest
.env                           -> gerado pelo pipeline na VPS (BIND_ADDR_INTERNAL e MIRANTE_DB_SENHA, permissão
                                  600); fora do git
../azure-pipelines.yml         -> release/*: front (audit, unitários, build), backend (build e testes com
                                  Testcontainers), imagens web e api, E2E contra o site, envio das imagens por scp,
                                  .env com a senha e subida da stack com --wait
```

## Regras

- **Imagens por digest** em Dockerfile, compose e script; o Dependabot propõe digests novos, sem saltos de versão maior (nginx, Node, Postgres, Redis e .NET à mão).
- **Nada exposto além de 127.0.0.1:** o público entra só pela borda do Planuz. Postgres e Redis sem porta no host.
- **Segredos:** só no variable group `mirante-producao` do Azure (secretos mapeados por `env:` no passo) e no `.env` do servidor. Nunca no repositório, que é público, nem no log.
- **CSP em dois lugares, iguais:** `nginx/seguranca.conf` e o server block da borda (repo planuz). A cópia em `borda/` acompanha.
- **Compilar só no agente do Azure:** compilar na VPS esgota a memória e derruba os outros apps. A VPS é compartilhada: limites de memória em todo serviço e prune só com `label=app=mirante`.
- **Deploy por SHA:** o pipeline valida o SHA (40 hexadecimais) e faz `git reset --hard` nele na VPS; a imagem e o compose são do mesmo commit.

## Variable group `mirante-producao`

| Variável | Uso |
|---|---|
| `SERVER_IP`, `SERVER_USER` | acesso SSH à VPS |
| `SSH_PUBLICKEY`, `SSH_KNOWN_HOSTS` | chave pública e host key fixa da VPS (sem ssh-keyscan em execução) |
| `DEPLOY_PATH` | `/opt/mirante` |
| `BIND_ADDR_INTERNAL` | `127.0.0.1` |
| `MIRANTE_DB_SENHA` (secreta) | senha do Postgres; sem aspas simples nem ponto e vírgula |

Secure file: `id_ed25519_kinghost`.

## Comandos (da raiz do repositório)

```bash
docker compose -f docker/docker-compose.yml up -d --build                       # stack local
docker compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml config -q   # confere o compose de produção (precisa de MIRANTE_DB_SENHA)
```
