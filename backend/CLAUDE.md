# Mirante: backend (API .NET 10)

Regras gerais (idioma, documentação viva, commits, segurança comum) no `CLAUDE.md` da raiz. Este arquivo vale para tudo em `backend/`. Caminhos abaixo são relativos a `backend/`; os comandos rodam de dentro dela (o `global.json` daqui liga o Microsoft Testing Platform).

> **Documentação viva:** mudou endpoint, regra de validação, cache, configuração, migration ou comando nesta área, atualizar no mesmo commit o mapa abaixo e o `README.md` desta pasta. Mudou o contrato com o front (caminho, cabeçalho, status), atualizar também `frontend/CLAUDE.md`.

## O que a API faz

Intermediária entre o site e as três fontes oficiais, na mesma origem do site (o nginx do container web encaminha `/api/`):

1. **Valida** cada consulta contra a lista permitida (só o que os painéis usam); fora dela, 404 sem chamar a fonte; malformada, 400.
2. **Cache em duas camadas** (`HybridCache`: memória do processo e Redis), validade por fonte (BCB 1 h, IBGE e Ipeadata 12 h) e uma ida só à fonte para consultas simultâneas da mesma chave.
3. **Fonte** com resiliência (tempo por tentativa, duas novas tentativas, disjuntor, até 8 chamadas simultâneas por fonte). Resposta que não tem o formato da fonte (HTML, lista vazia, erro em JSON) conta como fonte fora.
4. **Reserva** no PostgreSQL: a última resposta boa de cada série e prazo. Com a fonte fora, devolve a reserva (`X-Mirante-Origem: reserva`); sem reserva, 502.
5. **Proteção:** rate limiter por IP em `/api/` (120 por minuto, IPv6 por bloco /64, 429 com `Retry-After`), IP real só de proxies nas redes privadas, só GET, corpo de até 1 KB, `nosniff`, `no-referrer`, CORP `same-origin`.

## Convenções

- .NET 10, minimal APIs, nomes de tipos, membros e testes em português (`ConsultaBcb`, `ObterAsync`, `Fonte_fora_do_ar_serve_a_reserva`).
- `Directory.Build.props`: nullable, avisos como erro, analisadores `latest-recommended`. Build com 0 avisos é portão.
- Versões de pacote só em `Directory.Packages.props`.
- Configuração validada na subida (`ValidateOnStart`): sem Postgres ou Redis configurado, a API não inicia.
- Redis ou Postgres fora do ar não derrubam uma resposta que a fonte já deu (cache e reserva são acessórios).
- Log com `LoggerMessage`; nada de cadeia de conexão, corpo de resposta ou exceção no corpo HTTP.
- Série ou agregado novo: entra em `ListaPermitida` **e** na definição do painel no front, no mesmo PR.
- Testes nunca batem na rede: as fontes são simuladas (`FontesSimuladas`); Postgres e Redis são reais (Testcontainers).
- **Isolamento nos testes de integração:** os containers são compartilhados pela suíte, então cada `ApiDeTeste` tem o próprio prefixo de chave (cache e reserva). Para simular cache vazio com a mesma reserva, apontar para outro banco do Redis (`{conexao},defaultDatabase=N`).
- **Docker de pé:** a integração precisa do Docker Desktop, que pode estar parado depois de reiniciar o PC. Erro `DockerUnavailableException` é ambiente, não código.
- **Horário no Postgres:** `timestamptz` guarda até o microssegundo; o .NET tem décimos de microssegundo. Arredondar antes de comparar (a reserva grava em segundos).
- **json e não jsonb** para guardar resposta como veio: o jsonb reformata o texto e reordena chaves.
- **Métodos HTTP iguais aos do nginx:** o nginx do site deixa passar GET e HEAD (o `limit_except GET` inclui HEAD); a API aceita os dois e não escreve corpo no HEAD.
- **Resiliência:** prazo esgotado e disjuntor aberto chegam como `ExecutionRejectedException` do Polly, não como `TimeoutException`; o `ClienteDasFontes` converte para `FonteIndisponivelException` (senão vira 500 e a reserva não é usada).

## Mapa de arquivos

```
CLAUDE.md                      -> este arquivo (regras e mapa do backend)
README.md                      -> como rodar, configurar e testar a API
.gitignore                     -> bin, obj, TestResults
global.json                    -> SDK 10 e executor de testes Microsoft Testing Platform
dotnet-tools.json              -> dotnet-ef local (dotnet tool restore)
Directory.Build.props          -> net10.0, nullable, avisos como erro, analisadores
Directory.Packages.props       -> versões de pacote centralizadas
Mirante.slnx                   -> solução com os cinco projetos
src/Mirante.Api/               -> minimal API
  Program.cs                   -> composição: proteção, infraestrutura, saúde, fontes, cache
  Configuracao/                -> Conexoes (Postgres e Redis, validadas na subida), InfraestruturaExtensions
                                  (EF Core, Redis único, Redis como segunda camada do HybridCache),
                                  AplicadorDeMigrations (hosted service que aplica as migrations na subida)
  Saude/                       -> /health (processo de pé, usado pelo Docker) e /health/ready (Postgres e Redis,
                                  sem detalhe de erro no corpo); RedisHealthCheck com prazo de 2 s
  Fontes/                      -> FontesEndpoints (/api/ibge/agregados, /api/bcb/serie/{serie}/dados,
                                  /api/ipea/odata4/{recurso}; 404 fora da lista, 400 malformada, 502 fonte fora;
                                  X-Mirante-Origem e X-Mirante-Obtido-Em; Cache-Control 5 min, reserva no-store),
                                  ConsultasComCache (memória, Redis, fonte e reserva; OpcoesDoCache com prefixo e
                                  validade por fonte)
  Protecao/                    -> ProtecaoExtensions (X-Forwarded-For só de redes confiáveis, rate limiter por IP
                                  com IPv6 por /64, cabeçalhos de segurança, corpo de até 1 KB), OpcoesDeProtecao
src/Mirante.Fontes/            -> o que a API consulta e como
  ListaPermitida.cs            -> agregados, variáveis e níveis do IBGE; séries e prazos (1, 2 e 5 anos) do SGS;
                                  séries do Ipeadata. Espelho de indicadores.ts e series.ts do front
  ConsultaIbge.cs              -> validação e forma canônica (variáveis e níveis ordenados)
  ConsultaBcb.cs               -> só janelas do painel: fim hoje (margem de fuso) e início no dia 1 do mês, 1, 2 ou
                                  5 anos antes; chave da reserva por série e prazo, sem a data
  ConsultaIpea.cs              -> ValoresSerie(SERCODIGO='...') com código da lista e $select fixo
  Consulta.cs                  -> Consulta (fonte, caminho, chave do cache, chave da reserva), Validacao, MotivoDaRecusa
  ClienteDasFontes.cs          -> busca na fonte e devolve o JSON como veio; recusa formato inesperado; prazo e
                                  disjuntor viram FonteIndisponivelException
  FontesExtensions.cs          -> um HttpClient por fonte com endereço, User-Agent, teto de 8 MB e resiliência
                                  (Ipeadata com prazo maior)
  Fonte.cs                     -> Ibge, Bcb, Ipea
src/Mirante.Dados/             -> EF Core 10 + Npgsql
  MiranteDb.cs                 -> tabela reservas (chave, fonte, conteudo json, obtido_em)
  Reserva.cs, Reservas.cs      -> leitura e gravação com INSERT ... ON CONFLICT que nunca troca nova por antiga;
                                  coluna json (não jsonb) para guardar o texto exatamente como veio
  MiranteDbDeProjeto.cs        -> fábrica só para o dotnet ef
  Migrations/                  -> geradas pelo dotnet ef (fora dos analisadores)
tests/Mirante.Testes.Unidade/  -> xUnit v3, sem rede nem banco: validações das três fontes, formato das
                                  respostas, partição de IP, configuração
tests/Mirante.Testes.Integracao/ -> API real (WebApplicationFactory) com Postgres e Redis em Testcontainers
  Infraestrutura.cs            -> containers compartilhados pela suíte (assembly fixture)
  ApiDeTeste.cs                -> a API com fontes simuladas, prefixo de cache próprio, IP da conexão e prazo
                                  configuráveis
  FontesSimuladas.cs           -> responde no lugar das três fontes e registra as chamadas
  SaudeTests, FontesTests, CacheTests, ProtecaoTests -> saúde, lista permitida, cache e reserva, limite e cabeçalhos
```

## Configuração

| Chave | Padrão | Uso |
|---|---|---|
| `ConnectionStrings__Postgres` | (obrigatória) | reserva |
| `ConnectionStrings__Redis` | (obrigatória) | cache (segunda camada) |
| `Cache__Prefixo` | `mirante:` | prefixo das chaves no Redis e na reserva |
| `Protecao__RequisicoesPorMinuto` | `120` | limite por IP em `/api/` |
| `Fontes__{Ibge,Bcb,Ipea}__Base` | endereços oficiais | trocar a fonte (só em teste) |

## Comandos (de dentro de backend/)

```bash
dotnet build Mirante.slnx                    # 0 avisos (avisos são erro)
dotnet test --solution Mirante.slnx          # unidade e integração (Docker de pé)
dotnet run --project src/Mirante.Api         # http://localhost:5110 (Postgres e Redis do compose)
dotnet tool restore && dotnet ef migrations add Nome --project src/Mirante.Dados --output-dir Migrations
```
