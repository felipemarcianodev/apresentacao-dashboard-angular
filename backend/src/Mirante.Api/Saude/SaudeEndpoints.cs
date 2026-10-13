using System.Text.Json;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Mirante.Dados;

namespace Mirante.Api.Saude;

public static class SaudeEndpoints
{
    /// <summary>Tag dos checks que só contam para "pronta" (dependências externas).</summary>
    private const string Pronta = "pronta";

    /// <summary>Prazo de cada dependência: o orquestrador não pode ficar esperando o padrão de 5 s do Redis.</summary>
    private static readonly TimeSpan Prazo = TimeSpan.FromSeconds(2);

    public static IServiceCollection AddSaude(this IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddDbContextCheck<MiranteDb>("postgres", tags: [Pronta])
            .AddCheck<RedisHealthCheck>("redis", tags: [Pronta], timeout: Prazo);
        return services;
    }

    /// <summary>
    /// <c>/health</c>: o processo está de pé (sem olhar dependências; é o que o Docker usa).
    /// <c>/health/ready</c>: Postgres e Redis respondendo. O corpo diz o estado de cada um, sem
    /// mensagem de exceção nem cadeia de conexão.
    /// </summary>
    public static IEndpointRouteBuilder MapSaude(this IEndpointRouteBuilder app)
    {
        app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = _ => false, ResponseWriter = EscreverResposta });
        app.MapHealthChecks("/health/ready", new HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains(Pronta),
            ResponseWriter = EscreverResposta,
        });
        return app;
    }

    private static Task EscreverResposta(HttpContext context, HealthReport relatorio)
    {
        context.Response.ContentType = "application/json; charset=utf-8";
        context.Response.Headers.CacheControl = "no-store";
        var corpo = new
        {
            status = relatorio.Status.ToString(),
            checks = relatorio.Entries.ToDictionary(e => e.Key, e => e.Value.Status.ToString()),
        };
        return context.Response.WriteAsync(JsonSerializer.Serialize(corpo, JsonSerializerOptions.Web));
    }
}
