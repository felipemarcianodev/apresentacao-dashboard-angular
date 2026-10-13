using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;

namespace Mirante.Fontes;

public static class FontesExtensions
{
    /// <summary>Teto do corpo de uma resposta: a maior série do Mirante tem algumas centenas de KB.</summary>
    private const long TetoDaResposta = 8 * 1024 * 1024;

    /// <summary>
    /// Um cliente HTTP por fonte, com endereço base, identificação e resiliência (tempo por
    /// tentativa, novas tentativas com espera crescente e disjuntor). O Ipeadata é lento: ganha
    /// prazos maiores.
    /// </summary>
    public static IServiceCollection AddFontes(this IServiceCollection services, IConfiguration configuration)
    {
        Registrar(services, configuration, Fonte.Ibge, "https://servicodados.ibge.gov.br/api/v3/agregados/", TimeSpan.FromSeconds(10));
        Registrar(services, configuration, Fonte.Bcb, "https://api.bcb.gov.br/dados/serie/", TimeSpan.FromSeconds(10));
        Registrar(services, configuration, Fonte.Ipea, "https://www.ipeadata.gov.br/api/odata4/", TimeSpan.FromSeconds(25));
        services.AddSingleton<ClienteDasFontes>();
        return services;
    }

    private static void Registrar(IServiceCollection services, IConfiguration configuration, Fonte fonte, string basePadrao, TimeSpan prazoPorTentativa)
    {
        var endereco = configuration[$"Fontes:{fonte}:Base"] ?? basePadrao;

        services.AddHttpClient(ClienteDasFontes.NomeDoCliente(fonte), cliente =>
            {
                cliente.BaseAddress = new Uri(endereco, UriKind.Absolute);
                cliente.MaxResponseContentBufferSize = TetoDaResposta;
                cliente.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("Mirante", "1.0"));
                cliente.DefaultRequestHeaders.UserAgent.Add(new ProductInfoHeaderValue("(+https://mirante.felipemarcianodev.com)"));
                cliente.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            })
            .AddStandardResilienceHandler(opcoes =>
            {
                opcoes.AttemptTimeout.Timeout = prazoPorTentativa;
                opcoes.TotalRequestTimeout.Timeout = prazoPorTentativa * 3;
                // O disjuntor precisa observar uma janela de pelo menos o dobro do prazo da tentativa.
                opcoes.CircuitBreaker.SamplingDuration = prazoPorTentativa * 2;
                opcoes.Retry.MaxRetryAttempts = 2;
                // Poucas chamadas simultâneas por fonte: o resto espera numa fila curta, e o que
                // passar dela é recusado (vira reserva ou 502) em vez de empilhar conexões.
                opcoes.RateLimiter.DefaultRateLimiterOptions.PermitLimit = 8;
                opcoes.RateLimiter.DefaultRateLimiterOptions.QueueLimit = 32;
            });
    }
}
