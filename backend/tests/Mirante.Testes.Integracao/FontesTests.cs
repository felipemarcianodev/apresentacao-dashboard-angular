using System.Net;
using Mirante.Fontes;

namespace Mirante.Testes.Integracao;

public sealed class FontesTests(Infraestrutura infra)
{
    private const string Ibge = "/api/ibge/agregados/6579/periodos/-8/variaveis/9324?localidades=N3[all]|N1[all]";

    [Fact]
    public async Task Consulta_permitida_devolve_o_JSON_da_fonte_com_a_origem()
    {
        var fontes = new FontesSimuladas();
        fontes.Responder(_ => FontesSimuladas.Json("""[{"id":"9324"}]"""));
        await using var api = new ApiDeTeste(infra.Postgres, infra.Redis, fontes);

        var resposta = await api.CreateClient().GetAsync(Ibge, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.Equal("""[{"id":"9324"}]""", await resposta.Content.ReadAsStringAsync(TestContext.Current.CancellationToken));
        Assert.Equal("application/json", resposta.Content.Headers.ContentType?.MediaType);
        Assert.Equal("fonte", Assert.Single(resposta.Headers.GetValues("X-Mirante-Origem")));
        Assert.True(resposta.Headers.Contains("X-Mirante-Obtido-Em"));

        // A fonte recebe a consulta na forma canônica, montada só com valores validados.
        var (fonte, endereco) = Assert.Single(fontes.Chamadas);
        Assert.Equal(Fonte.Ibge, fonte);
        Assert.Equal(
            "https://servicodados.ibge.gov.br/api/v3/agregados/6579/periodos/-8/variaveis/9324?localidades=N1[all]|N3[all]",
            Uri.UnescapeDataString(endereco.AbsoluteUri));
    }

    [Theory]
    [InlineData("/api/bcb/serie/bcdata.sgs.999/dados?formato=json&dataInicial=01/01/2025&dataFinal=01/02/2025", HttpStatusCode.NotFound)]
    [InlineData("/api/ibge/agregados/9999/periodos/-8/variaveis/1?localidades=N1[all]", HttpStatusCode.NotFound)]
    [InlineData("/api/ipea/odata4/ValoresSerie(SERCODIGO='X'')%20or%20(1%20eq%201')?$select=VALDATA,VALVALOR", HttpStatusCode.BadRequest)]
    [InlineData("/api/ibge/agregados/6579/periodos/-8/variaveis/9324?localidades=N6[all]", HttpStatusCode.NotFound)]
    public async Task Consulta_recusada_nao_chega_a_fonte(string caminho, HttpStatusCode esperado)
    {
        var fontes = new FontesSimuladas();
        await using var api = new ApiDeTeste(infra.Postgres, infra.Redis, fontes);

        var resposta = await api.CreateClient().GetAsync(caminho, TestContext.Current.CancellationToken);

        Assert.Equal(esperado, resposta.StatusCode);
        Assert.Equal("application/problem+json", resposta.Content.Headers.ContentType?.MediaType);
        Assert.Empty(fontes.Chamadas);
    }

    [Fact]
    public async Task Fonte_com_erro_vira_502_depois_das_novas_tentativas()
    {
        var fontes = new FontesSimuladas();
        fontes.Responder(_ => FontesSimuladas.Json("{}", HttpStatusCode.ServiceUnavailable));
        await using var api = new ApiDeTeste(infra.Postgres, infra.Redis, fontes);

        var resposta = await api.CreateClient().GetAsync(Ibge, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadGateway, resposta.StatusCode);
        Assert.Equal(3, fontes.Chamadas.Count); // a tentativa e as duas novas
        Assert.DoesNotContain("ibge.gov.br", await resposta.Content.ReadAsStringAsync(TestContext.Current.CancellationToken), StringComparison.Ordinal);
    }

    [Fact]
    public async Task Pagina_HTML_da_fonte_nao_chega_ao_painel()
    {
        var fontes = new FontesSimuladas();
        fontes.Responder(_ => new HttpResponseMessage(HttpStatusCode.OK) { Content = new StringContent("<html>Manutenção</html>") });
        await using var api = new ApiDeTeste(infra.Postgres, infra.Redis, fontes);

        var resposta = await api.CreateClient().GetAsync(Ibge, TestContext.Current.CancellationToken);

        Assert.Equal(HttpStatusCode.BadGateway, resposta.StatusCode);
    }
}
