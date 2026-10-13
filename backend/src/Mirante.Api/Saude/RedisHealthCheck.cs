using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace Mirante.Api.Saude;

/// <summary>Responde ao PING do Redis dentro do prazo do health check.</summary>
public sealed class RedisHealthCheck(IConnectionMultiplexer redis) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var latencia = await redis.GetDatabase().PingAsync().WaitAsync(cancellationToken);
            return HealthCheckResult.Healthy($"PING em {latencia.TotalMilliseconds:0} ms");
        }
        catch (Exception ex) when (ex is RedisException or TimeoutException or OperationCanceledException)
        {
            return HealthCheckResult.Unhealthy("Redis sem resposta");
        }
    }
}
