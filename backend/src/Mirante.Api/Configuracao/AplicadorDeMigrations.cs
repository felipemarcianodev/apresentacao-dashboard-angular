using Microsoft.EntityFrameworkCore;
using Mirante.Dados;

namespace Mirante.Api.Configuracao;

/// <summary>
/// Aplica as migrations pendentes na subida, depois da validação da configuração e antes de a API
/// atender. Uma instância só, então sem corrida; com o Postgres fora do ar, a subida falha e o
/// Docker tenta de novo.
/// </summary>
public sealed class AplicadorDeMigrations(IServiceScopeFactory escopos) : IHostedService
{
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        await using var escopo = escopos.CreateAsyncScope();
        await escopo.ServiceProvider.GetRequiredService<MiranteDb>().Database.MigrateAsync(cancellationToken);
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
