using System.Globalization;
using System.Net;
using System.Net.Sockets;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;

namespace Mirante.Api.Protecao;

public sealed class OpcoesDeProtecao
{
    public const string Secao = "Protecao";

    /// <summary>
    /// Requisições por IP por minuto em /api/. Um painel aberto faz de 4 a 6; o teto cobre várias
    /// pessoas atrás do mesmo IP (escola, empresa) e corta robô.
    /// </summary>
    public int RequisicoesPorMinuto { get; set; } = 120;

    /// <summary>
    /// Redes dos proxies em quem a API confia para ler o IP real no X-Forwarded-For: o nginx do
    /// site e a borda, nas redes privadas do Docker. De fora dessas redes, o cabeçalho é ignorado.
    /// </summary>
    public IReadOnlyList<string> RedesConfiaveis { get; set; } = ["127.0.0.1/32", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"];
}

public static class ProtecaoExtensions
{
    public const string PoliticaDaApi = "por-ip";

    public static IServiceCollection AddProtecao(this IServiceCollection services, IConfiguration configuration)
    {
        var opcoes = configuration.GetSection(OpcoesDeProtecao.Secao).Get<OpcoesDeProtecao>() ?? new OpcoesDeProtecao();

        services.Configure<ForwardedHeadersOptions>(encaminhados =>
        {
            encaminhados.ForwardedHeaders = ForwardedHeaders.XForwardedFor;
            // Borda e nginx do site, e uma folga. Com o Cloudflare, a borda troca o IP da conexão
            // pelo CF-Connecting-IP (real_ip só das faixas do Cloudflare) antes de repassar.
            encaminhados.ForwardLimit = 3;
            encaminhados.KnownIPNetworks.Clear();
            encaminhados.KnownProxies.Clear();
            foreach (var rede in opcoes.RedesConfiaveis)
            {
                encaminhados.KnownIPNetworks.Add(System.Net.IPNetwork.Parse(rede));
            }
        });

        services.AddRateLimiter(limitador =>
        {
            limitador.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            limitador.AddPolicy(PoliticaDaApi, contexto =>
                RateLimitPartition.GetSlidingWindowLimiter(
                    ParticaoDoIp(contexto.Connection.RemoteIpAddress),
                    _ => new SlidingWindowRateLimiterOptions
                    {
                        PermitLimit = opcoes.RequisicoesPorMinuto,
                        Window = TimeSpan.FromMinutes(1),
                        SegmentsPerWindow = 6,
                        QueueLimit = 0,
                    }));
            limitador.OnRejected = async (rejeicao, cancelamento) =>
            {
                var resposta = rejeicao.HttpContext.Response;
                var espera = rejeicao.Lease.TryGetMetadata(MetadataName.RetryAfter, out var tempo) ? tempo : TimeSpan.FromSeconds(10);
                resposta.Headers.RetryAfter = Math.Ceiling(espera.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                await Results.Problem(
                        "Muitas consultas seguidas deste endereço. Espere alguns segundos e tente de novo.",
                        statusCode: StatusCodes.Status429TooManyRequests,
                        title: "Limite de consultas")
                    .ExecuteAsync(rejeicao.HttpContext);
            };
        });

        services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(kestrel =>
        {
            kestrel.AddServerHeader = false;
            // A API só tem GET: corpo de requisição não tem uso.
            kestrel.Limits.MaxRequestBodySize = 1024;
        });

        return services;
    }

    /// <summary>
    /// Quem divide o mesmo limite. IPv4: o endereço. IPv6: o bloco /64, que é o que um provedor
    /// entrega a um cliente; por endereço, um atacante teria 2^64 limites diferentes.
    /// </summary>
    internal static string ParticaoDoIp(IPAddress? ip)
    {
        if (ip is null)
        {
            return "desconhecido";
        }
        if (ip.IsIPv4MappedToIPv6)
        {
            ip = ip.MapToIPv4();
        }
        if (ip.AddressFamily != AddressFamily.InterNetworkV6)
        {
            return ip.ToString();
        }
        var bytes = ip.GetAddressBytes();
        Array.Clear(bytes, 8, 8);
        return $"{new IPAddress(bytes)}/64";
    }

    /// <summary>IP real primeiro (o limitador depende dele), depois os cabeçalhos de segurança.</summary>
    public static WebApplication UseProtecao(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);
        app.UseForwardedHeaders();
        app.Use(async (contexto, proximo) =>
        {
            var cabecalhos = contexto.Response.Headers;
            cabecalhos.XContentTypeOptions = "nosniff";
            cabecalhos["Referrer-Policy"] = "no-referrer";
            cabecalhos["Cross-Origin-Resource-Policy"] = "same-origin";
            await proximo(contexto);
        });
        app.UseRateLimiter();
        return app;
    }
}
