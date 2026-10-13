using System.Net;
using Microsoft.Extensions.DependencyInjection;
using Mirante.Dados;

namespace Mirante.Testes.Integracao;

public sealed class CacheTests(Infraestrutura infra)
{
    /// <summary>A janela de 2 anos que o painel pede hoje (fim hoje, início no primeiro dia do mês).</summary>
    private static readonly string Selic = CaminhoDaSelic(DateOnly.FromDateTime(DateTime.UtcNow));

    private static string CaminhoDaSelic(DateOnly hoje)
    {
        var inicio = new DateOnly(hoje.Year - 2, hoje.Month, 1);
        return string.Create(
            System.Globalization.CultureInfo.InvariantCulture,
            $"/api/bcb/serie/bcdata.sgs.432/dados?formato=json&dataInicial={inicio:dd/MM/yyyy}&dataFinal={hoje:dd/MM/yyyy}");
    }

    private const string Json = """[{"data":"02/01/2025","valor":"12.25"}]""";

    private static CancellationToken Cancelamento => TestContext.Current.CancellationToken;

    private static FontesSimuladas FonteNoAr() => Simulador(() => FontesSimuladas.Json(Json));

    private static FontesSimuladas FonteFora() => Simulador(() => FontesSimuladas.Json("{}", HttpStatusCode.ServiceUnavailable));

    private static FontesSimuladas Simulador(Func<HttpResponseMessage> resposta)
    {
        var fontes = new FontesSimuladas();
        fontes.Responder(_ => resposta());
        return fontes;
    }

    private static string Origem(HttpResponseMessage resposta) => Assert.Single(resposta.Headers.GetValues("X-Mirante-Origem"));

    [Fact]
    public async Task Segunda_consulta_vem_do_cache_sem_ir_a_fonte()
    {
        var fontes = FonteNoAr();
        await using var api = new ApiDeTeste(infra.Postgres, infra.Redis, fontes);
        var cliente = api.CreateClient();

        var primeira = await cliente.GetAsync(Selic, Cancelamento);
        var segunda = await cliente.GetAsync(Selic, Cancelamento);

        Assert.Equal("fonte", Origem(primeira));
        Assert.Equal("cache", Origem(segunda));
        Assert.Equal(Json, await segunda.Content.ReadAsStringAsync(Cancelamento));
        Assert.Equal("public, max-age=300", segunda.Headers.CacheControl?.ToString());
        Assert.Single(fontes.Chamadas);
    }

    [Fact]
    public async Task Outra_instancia_da_API_le_do_Redis()
    {
        var prefixo = $"teste-{Guid.NewGuid():N}:";
        await using (var primeira = new ApiDeTeste(infra.Postgres, infra.Redis, FonteNoAr(), prefixo))
        {
            await primeira.CreateClient().GetAsync(Selic, Cancelamento);
        }

        var fontesDaSegunda = FonteNoAr();
        await using var segunda = new ApiDeTeste(infra.Postgres, infra.Redis, fontesDaSegunda, prefixo);
        var resposta = await segunda.CreateClient().GetAsync(Selic, Cancelamento);

        Assert.Equal("cache", Origem(resposta));
        Assert.Empty(fontesDaSegunda.Chamadas);
    }

    [Fact]
    public async Task Chamadas_simultaneas_viram_uma_ida_a_fonte()
    {
        var fontes = FonteNoAr();
        fontes.Atraso = TimeSpan.FromMilliseconds(300);
        await using var api = new ApiDeTeste(infra.Postgres, infra.Redis, fontes);
        var cliente = api.CreateClient();

        var respostas = await Task.WhenAll(Enumerable.Range(0, 10).Select(_ => cliente.GetAsync(Selic, Cancelamento)));

        Assert.All(respostas, r => Assert.Equal(HttpStatusCode.OK, r.StatusCode));
        Assert.Single(fontes.Chamadas);
    }

    [Fact]
    public async Task Fonte_fora_do_ar_serve_a_ultima_resposta_boa_da_reserva()
    {
        var prefixo = $"teste-{Guid.NewGuid():N}:";
        string obtidoEm;
        await using (var antes = new ApiDeTeste(infra.Postgres, infra.Redis, FonteNoAr(), prefixo))
        {
            var resposta = await antes.CreateClient().GetAsync(Selic, Cancelamento);
            obtidoEm = Assert.Single(resposta.Headers.GetValues("X-Mirante-Obtido-Em"));
        }

        // Outro banco do Redis: sem cache, a API precisa ir à fonte, que agora está fora.
        await using var depois = new ApiDeTeste(infra.Postgres, $"{infra.Redis},defaultDatabase=1", FonteFora(), prefixo);
        var reserva = await depois.CreateClient().GetAsync(Selic, Cancelamento);

        Assert.Equal(HttpStatusCode.OK, reserva.StatusCode);
        Assert.Equal("reserva", Origem(reserva));
        Assert.Equal(obtidoEm, Assert.Single(reserva.Headers.GetValues("X-Mirante-Obtido-Em")));
        Assert.Equal("no-store", reserva.Headers.CacheControl?.ToString());
        Assert.Equal(Json, await reserva.Content.ReadAsStringAsync(Cancelamento));
    }

    [Fact]
    public async Task Fonte_lenta_alem_do_prazo_tambem_usa_a_reserva()
    {
        var prefixo = $"teste-{Guid.NewGuid():N}:";
        await using (var antes = new ApiDeTeste(infra.Postgres, infra.Redis, FonteNoAr(), prefixo))
        {
            await antes.CreateClient().GetAsync(Selic, Cancelamento);
        }

        var lenta = FonteNoAr();
        lenta.Atraso = TimeSpan.FromSeconds(5);
        await using var depois = new ApiDeTeste(infra.Postgres, $"{infra.Redis},defaultDatabase=2", lenta, prefixo)
        {
            PrazoDaFonte = TimeSpan.FromMilliseconds(200),
        };
        var resposta = await depois.CreateClient().GetAsync(Selic, Cancelamento);

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.Equal("reserva", Origem(resposta));
    }

    [Fact]
    public async Task Resposta_vazia_da_fonte_nao_substitui_a_reserva()
    {
        var prefixo = $"teste-{Guid.NewGuid():N}:";
        await using (var antes = new ApiDeTeste(infra.Postgres, infra.Redis, FonteNoAr(), prefixo))
        {
            await antes.CreateClient().GetAsync(Selic, Cancelamento);
        }

        // Status 200 com uma lista vazia: tratado como fonte fora, e a reserva boa é servida.
        var vazia = Simulador(() => FontesSimuladas.Json("[]"));
        await using var depois = new ApiDeTeste(infra.Postgres, $"{infra.Redis},defaultDatabase=3", vazia, prefixo);
        var resposta = await depois.CreateClient().GetAsync(Selic, Cancelamento);

        Assert.Equal("reserva", Origem(resposta));
        Assert.Equal(Json, await resposta.Content.ReadAsStringAsync(Cancelamento));
    }

    [Fact]
    public async Task Redis_fora_do_ar_a_API_responde_pela_fonte()
    {
        var fontes = FonteNoAr();
        await using var api = new ApiDeTeste(infra.Postgres, "localhost:1,connectTimeout=500", fontes);

        var resposta = await api.CreateClient().GetAsync(Selic, Cancelamento);

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.Equal("fonte", Origem(resposta));
    }

    [Fact]
    public async Task Reserva_nao_troca_resposta_nova_por_antiga()
    {
        await using var api = new ApiDeTeste(infra.Postgres, infra.Redis);
        await using var escopo = api.Services.CreateAsyncScope();
        var reservas = escopo.ServiceProvider.GetRequiredService<Reservas>();
        var chave = $"teste-{Guid.NewGuid():N}";
        var agora = DateTimeOffset.UtcNow;

        await reservas.GravarAsync(chave, "Bcb", """{"v":"nova"}""", agora, Cancelamento);
        await reservas.GravarAsync(chave, "Bcb", """{"v":"antiga"}""", agora.AddMinutes(-5), Cancelamento);

        var lida = await reservas.LerAsync(chave, Cancelamento);
        Assert.Contains("nova", lida!.Conteudo, StringComparison.Ordinal);
    }
}
