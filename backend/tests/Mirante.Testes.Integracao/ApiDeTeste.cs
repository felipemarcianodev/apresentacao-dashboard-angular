using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http.Resilience;
using Microsoft.Extensions.Logging;
using Mirante.Fontes;

namespace Mirante.Testes.Integracao;

/// <summary>
/// A API de verdade, em memória, apontando para as conexões informadas. As três fontes oficiais
/// respondem pelo simulador (nenhum teste bate na rede). Cada instância tem o próprio prefixo de
/// chave no Redis e na reserva, a não ser que o teste passe um para compartilhar.
/// </summary>
public sealed class ApiDeTeste(string postgres, string redis, FontesSimuladas? fontes = null, string? prefixo = null)
    : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testes");
        builder.UseSetting("ConnectionStrings:Postgres", postgres);
        builder.UseSetting("ConnectionStrings:Redis", redis);
        builder.UseSetting("Cache:Prefixo", prefixo ?? $"teste-{Guid.NewGuid():N}:");
        // Só avisos e erros no log dos testes: a saída fica legível quando algo falha.
        builder.ConfigureLogging(logging => logging.SetMinimumLevel(LogLevel.Warning));

        builder.ConfigureTestServices(services =>
        {
            var simulador = fontes ?? new FontesSimuladas();
            foreach (var fonte in Enum.GetValues<Fonte>())
            {
                var nome = ClienteDasFontes.NomeDoCliente(fonte);
                services.AddHttpClient(nome).ConfigurePrimaryHttpMessageHandler(() => simulador.Manipulador(fonte));
                // Sem espera entre as novas tentativas: o comportamento é o mesmo, só mais rápido.
                services.Configure<HttpStandardResilienceOptions>($"{nome}-standard", opcoes => opcoes.Retry.Delay = TimeSpan.FromMilliseconds(1));
            }
        });
    }
}
