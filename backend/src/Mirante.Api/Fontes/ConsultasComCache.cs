using System.Data.Common;
using Microsoft.Extensions.Caching.Hybrid;
using Microsoft.Extensions.Options;
using Mirante.Dados;
using Mirante.Fontes;

namespace Mirante.Api.Fontes;

/// <summary>De onde veio a resposta: do cache, da fonte agora ou da reserva (fonte fora do ar).</summary>
public enum Origem
{
    Cache,
    Fonte,
    Reserva,
}

public sealed record RespostaDaConsulta(string Json, DateTimeOffset ObtidoEm, Origem Origem);

/// <summary>O que vai para o cache: o JSON e quando a fonte o devolveu.</summary>
public sealed record EntradaDeCache(string Json, DateTimeOffset ObtidoEm);

public sealed class OpcoesDoCache
{
    public const string Secao = "Cache";

    /// <summary>Prefixo das chaves no Redis e na reserva (os testes isolam cada cenário por ele).</summary>
    public string Prefixo { get; set; } = "mirante:";

    /// <summary>Quanto tempo cada fonte fica no cache. O SGS publica todo dia útil; IBGE e Ipeadata, bem menos.</summary>
    public Dictionary<Fonte, TimeSpan> Validade { get; init; } = new()
    {
        [Fonte.Bcb] = TimeSpan.FromHours(1),
        [Fonte.Ibge] = TimeSpan.FromHours(12),
        [Fonte.Ipea] = TimeSpan.FromHours(12),
    };

    /// <summary>Validade na memória do processo, menor que a do Redis.</summary>
    public TimeSpan ValidadeLocal { get; set; } = TimeSpan.FromMinutes(5);
}

/// <summary>
/// Cache em duas camadas (memória e Redis, pelo HybridCache), depois a fonte, e por último a
/// reserva no Postgres. Chamadas simultâneas da mesma consulta viram uma ida só à fonte.
/// </summary>
public sealed partial class ConsultasComCache(
    HybridCache cache,
    ClienteDasFontes fontes,
    IServiceScopeFactory escopos,
    TimeProvider relogio,
    IOptions<OpcoesDoCache> opcoes,
    ILogger<ConsultasComCache> logger)
{
    public async Task<RespostaDaConsulta> ObterAsync(Consulta consulta, CancellationToken cancelamento)
    {
        ArgumentNullException.ThrowIfNull(consulta);
        var chave = opcoes.Value.Prefixo + consulta.Chave;
        var validade = opcoes.Value.Validade[consulta.Fonte];
        var veioDaFonte = false;

        try
        {
            var entrada = await cache.GetOrCreateAsync(
                chave,
                async ct =>
                {
                    veioDaFonte = true;
                    var json = await fontes.BuscarAsync(consulta, ct);
                    // Em segundos: é o que importa para quem lê, e o Postgres guarda até o microssegundo.
                    var agora = relogio.GetUtcNow();
                    var obtidoEm = agora.AddTicks(-(agora.Ticks % TimeSpan.TicksPerSecond));
                    await GravarReservaAsync(chave, consulta.Fonte, json, obtidoEm, ct);
                    return new EntradaDeCache(json, obtidoEm);
                },
                new HybridCacheEntryOptions
                {
                    Expiration = validade,
                    LocalCacheExpiration = TimeSpan.FromTicks(Math.Min(validade.Ticks, opcoes.Value.ValidadeLocal.Ticks)),
                },
                cancellationToken: cancelamento);

            return new RespostaDaConsulta(entrada.Json, entrada.ObtidoEm, veioDaFonte ? Origem.Fonte : Origem.Cache);
        }
        catch (FonteIndisponivelException ex)
        {
            var reserva = await LerReservaAsync(chave, cancelamento);
            if (reserva is null)
            {
                throw;
            }
            LogUsandoReserva(logger, consulta.Fonte, ex.Message, reserva.ObtidoEm);
            return new RespostaDaConsulta(reserva.Conteudo, reserva.ObtidoEm, Origem.Reserva);
        }
    }

    /// <summary>A reserva é acessória: Postgres fora do ar não pode derrubar uma resposta que a fonte já deu.</summary>
    private async Task GravarReservaAsync(string chave, Fonte fonte, string json, DateTimeOffset obtidoEm, CancellationToken cancelamento)
    {
        try
        {
            await using var escopo = escopos.CreateAsyncScope();
            await escopo.ServiceProvider.GetRequiredService<Reservas>().GravarAsync(chave, fonte.ToString(), json, obtidoEm, cancelamento);
        }
        catch (Exception ex) when (ex is DbException or InvalidOperationException or TimeoutException)
        {
            LogReservaNaoGravada(logger, ex, fonte);
        }
    }

    private async Task<Reserva?> LerReservaAsync(string chave, CancellationToken cancelamento)
    {
        try
        {
            await using var escopo = escopos.CreateAsyncScope();
            return await escopo.ServiceProvider.GetRequiredService<Reservas>().LerAsync(chave, cancelamento);
        }
        catch (Exception ex) when (ex is DbException or InvalidOperationException or TimeoutException)
        {
            LogReservaNaoLida(logger, ex);
            return null;
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "Fonte {Fonte} indisponível ({Motivo}); servindo a reserva de {ObtidoEm}.")]
    private static partial void LogUsandoReserva(ILogger logger, Fonte fonte, string motivo, DateTimeOffset obtidoEm);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Reserva da fonte {Fonte} não gravada.")]
    private static partial void LogReservaNaoGravada(ILogger logger, Exception ex, Fonte fonte);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Reserva não lida.")]
    private static partial void LogReservaNaoLida(ILogger logger, Exception ex);
}
