using System.Net;
using System.Net.Http.Json;
using Microsoft.Extensions.Options;

namespace Mirante.Testes.Integracao;

public sealed class SaudeTests(Infraestrutura infra)
{
    private sealed record Resposta(string Status, Dictionary<string, string> Checks);

    [Fact]
    public async Task Health_responde_sem_olhar_dependencias_e_sem_cabecalho_Server()
    {
        await using var api = new ApiDeTeste(infra.Postgres, infra.Redis);

        var resposta = await api.CreateClient().GetAsync("/health", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.False(resposta.Headers.Contains("Server"));
        Assert.Equal("no-store", resposta.Headers.CacheControl?.ToString());
        var corpo = await resposta.Content.ReadFromJsonAsync<Resposta>(TestContext.Current.CancellationToken);
        Assert.Equal("Healthy", corpo!.Status);
        Assert.Empty(corpo.Checks);
    }

    [Fact]
    public async Task Pronta_quando_Postgres_e_Redis_respondem()
    {
        await using var api = new ApiDeTeste(infra.Postgres, infra.Redis);

        var resposta = await api.CreateClient().GetAsync("/health/ready", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        var corpo = await resposta.Content.ReadFromJsonAsync<Resposta>(TestContext.Current.CancellationToken);
        Assert.Equal(new Dictionary<string, string> { ["postgres"] = "Healthy", ["redis"] = "Healthy" }, corpo!.Checks);
    }

    [Fact]
    public async Task Redis_fora_do_ar_deixa_a_API_de_pe_mas_nao_pronta()
    {
        // Porta sem ninguém escutando: a API sobe mesmo assim (o cache é acessório).
        await using var api = new ApiDeTeste(infra.Postgres, "localhost:1,connectTimeout=500");
        var cliente = api.CreateClient();

        var viva = await cliente.GetAsync("/health", TestContext.Current.CancellationToken);
        var pronta = await cliente.GetAsync("/health/ready", TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, viva.StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, pronta.StatusCode);
        var corpo = await pronta.Content.ReadFromJsonAsync<Resposta>(TestContext.Current.CancellationToken);
        Assert.Equal("Unhealthy", corpo!.Checks["redis"]);
        Assert.Equal("Healthy", corpo.Checks["postgres"]);
        Assert.DoesNotContain("localhost", await pronta.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
    }

    [Fact]
    public async Task Sem_conexoes_configuradas_a_API_nao_sobe()
    {
        await using var api = new ApiDeTeste(string.Empty, string.Empty);

        var erro = Assert.Throws<OptionsValidationException>(() => api.CreateClient());

        Assert.Contains("Defina ConnectionStrings__Postgres.", erro.Message, StringComparison.Ordinal);
        Assert.Contains("Defina ConnectionStrings__Redis.", erro.Message, StringComparison.Ordinal);
    }
}
