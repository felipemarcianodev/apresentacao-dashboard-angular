using Testcontainers.PostgreSql;
using Testcontainers.Redis;

[assembly: AssemblyFixture(typeof(Mirante.Testes.Integracao.Infraestrutura))]

namespace Mirante.Testes.Integracao;

/// <summary>
/// Postgres e Redis reais em containers, os mesmos da produção, compartilhados por todos os
/// testes de integração. Exige o Docker de pé.
/// </summary>
public sealed class Infraestrutura : IAsyncLifetime
{
    private readonly PostgreSqlContainer postgres = new PostgreSqlBuilder("postgres:17-alpine").Build();
    private readonly RedisContainer redis = new RedisBuilder("redis:8-alpine").Build();

    public string Postgres => postgres.GetConnectionString();

    public string Redis => redis.GetConnectionString();

    public async ValueTask InitializeAsync() =>
        await Task.WhenAll(postgres.StartAsync(), redis.StartAsync());

    public async ValueTask DisposeAsync()
    {
        await postgres.DisposeAsync();
        await redis.DisposeAsync();
    }
}
