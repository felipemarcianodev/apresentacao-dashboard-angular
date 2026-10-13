using System.Net;

namespace Mirante.Testes.Integracao;

public sealed class ProtecaoTests(Infraestrutura infra)
{
    private const string Gini = "/api/ipea/odata4/ValoresSerie(SERCODIGO='PNADS_GINI')?$select=VALDATA,VALVALOR";

    private static CancellationToken Cancelamento => TestContext.Current.CancellationToken;

    private ApiDeTeste ApiComLimite(int porMinuto, IPAddress? ipDaConexao = null)
    {
        var fontes = new FontesSimuladas();
        fontes.Responder(_ => FontesSimuladas.Json("""{"value":[{"VALDATA":"2024-01-01T00:00:00-02:00","VALVALOR":0.5}]}"""));
        return new ApiDeTeste(infra.Postgres, infra.Redis, fontes)
        {
            Configuracao = new Dictionary<string, string> { ["Protecao:RequisicoesPorMinuto"] = porMinuto.ToString(System.Globalization.CultureInfo.InvariantCulture) },
            IpDaConexao = ipDaConexao ?? IPAddress.Parse("172.18.0.5"),
        };
    }

    private static Task<HttpResponseMessage> Consultar(HttpClient cliente, string ipDoVisitante)
    {
        var requisicao = new HttpRequestMessage(HttpMethod.Get, Gini);
        requisicao.Headers.Add("X-Forwarded-For", ipDoVisitante);
        return cliente.SendAsync(requisicao, Cancelamento);
    }

    [Fact]
    public async Task Passou_do_limite_recebe_429_com_Retry_After()
    {
        await using var api = ApiComLimite(3);
        var cliente = api.CreateClient();

        for (var i = 0; i < 3; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await Consultar(cliente, "198.51.100.7")).StatusCode);
        }
        var bloqueada = await Consultar(cliente, "198.51.100.7");

        Assert.Equal(HttpStatusCode.TooManyRequests, bloqueada.StatusCode);
        Assert.True(bloqueada.Headers.RetryAfter?.Delta > TimeSpan.Zero);
        Assert.Equal("application/problem+json", bloqueada.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Cada_visitante_tem_o_proprio_limite_atras_do_proxy()
    {
        await using var api = ApiComLimite(2);
        var cliente = api.CreateClient();

        await Consultar(cliente, "198.51.100.7");
        await Consultar(cliente, "198.51.100.7");
        var outro = await Consultar(cliente, "203.0.113.20");

        Assert.Equal(HttpStatusCode.OK, outro.StatusCode);
    }

    [Fact]
    public async Task X_Forwarded_For_de_fora_dos_proxies_nao_burla_o_limite()
    {
        // Conexão direta de um IP público: trocar o X-Forwarded-For a cada requisição não adianta.
        await using var api = ApiComLimite(2, IPAddress.Parse("203.0.113.99"));
        var cliente = api.CreateClient();

        await Consultar(cliente, "10.0.0.1");
        await Consultar(cliente, "10.0.0.2");
        var terceira = await Consultar(cliente, "10.0.0.3");

        Assert.Equal(HttpStatusCode.TooManyRequests, terceira.StatusCode);
    }

    [Fact]
    public async Task Health_fica_fora_do_limite()
    {
        await using var api = ApiComLimite(1);
        var cliente = api.CreateClient();

        for (var i = 0; i < 5; i++)
        {
            Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync("/health", Cancelamento)).StatusCode);
        }
    }

    [Fact]
    public async Task Respostas_levam_os_cabecalhos_de_seguranca()
    {
        await using var api = ApiComLimite(10);

        var resposta = await Consultar(api.CreateClient(), "198.51.100.7");

        Assert.Equal("nosniff", Assert.Single(resposta.Headers.GetValues("X-Content-Type-Options")));
        Assert.Equal("no-referrer", Assert.Single(resposta.Headers.GetValues("Referrer-Policy")));
        Assert.Equal("same-origin", Assert.Single(resposta.Headers.GetValues("Cross-Origin-Resource-Policy")));
        Assert.False(resposta.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task So_GET_e_aceito_na_API()
    {
        await using var api = ApiComLimite(10);

        var resposta = await api.CreateClient().PostAsync(Gini, new StringContent("{}"), Cancelamento);

        Assert.Equal(HttpStatusCode.MethodNotAllowed, resposta.StatusCode);
    }
}
