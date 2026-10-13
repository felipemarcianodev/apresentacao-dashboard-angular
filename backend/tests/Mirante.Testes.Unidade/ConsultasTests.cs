using Mirante.Fontes;

namespace Mirante.Testes.Unidade;

public sealed class ConsultaIbgeTests
{
    [Fact]
    public void Aceita_a_consulta_do_painel_na_forma_canonica()
    {
        var validacao = ConsultaIbge.Validar(1737, "-25", "63|2265", "N1[all]");

        Assert.Equal(Fonte.Ibge, validacao.Consulta!.Fonte);
        Assert.Equal("1737/periodos/-25/variaveis/63|2265?localidades=N1[all]", validacao.Consulta.Caminho);
    }

    [Fact]
    public void A_mesma_consulta_escrita_de_outro_jeito_tem_a_mesma_chave()
    {
        var a = ConsultaIbge.Validar(6579, "-8", "9324", "N1[all]|N3[all]");
        var b = ConsultaIbge.Validar(6579, "-8", "9324|9324", "N3[all]|N1[all]");

        Assert.Equal(a.Consulta!.Chave, b.Consulta!.Chave);
    }

    [Theory]
    [InlineData(9999, "-8", "9324", "N1[all]")] // agregado
    [InlineData(6579, "-8", "9325", "N1[all]")] // variável
    [InlineData(1737, "-8", "63", "N3[all]")] // IPCA só tem Brasil
    public void Recusa_o_que_esta_fora_da_lista(int agregado, string periodos, string variaveis, string localidades)
    {
        Assert.Equal(MotivoDaRecusa.ForaDaLista, ConsultaIbge.Validar(agregado, periodos, variaveis, localidades).Motivo);
    }

    [Theory]
    [InlineData("0", "9324", "N1[all]")]
    [InlineData("-61", "9324", "N1[all]")]
    [InlineData("2020", "9324", "N1[all]")]
    [InlineData("-8;x", "9324", "N1[all]")]
    [InlineData("-8", "9324|abc", "N1[all]")]
    [InlineData("-8", "9324", "N3[33]")]
    [InlineData("-8", "9324", "N1[all]&x=1")]
    [InlineData("-8", "9324", null)]
    public void Recusa_parametro_malformado(string periodos, string variaveis, string? localidades)
    {
        Assert.Equal(MotivoDaRecusa.Malformada, ConsultaIbge.Validar(6579, periodos, variaveis, localidades).Motivo);
    }
}

public sealed class ConsultaBcbTests
{
    private static readonly DateOnly Hoje = new(2026, 10, 13);

    [Fact]
    public void Aceita_a_janela_do_painel()
    {
        var validacao = ConsultaBcb.Validar("bcdata.sgs.432", "json", "01/10/2021", "13/10/2026", Hoje);

        Assert.Equal("bcdata.sgs.432/dados?formato=json&dataInicial=01/10/2021&dataFinal=13/10/2026", validacao.Consulta!.Caminho);
    }

    [Fact]
    public void Aceita_o_fim_um_dia_adiante_por_causa_do_fuso()
    {
        Assert.NotNull(ConsultaBcb.Validar("bcdata.sgs.1", "json", "01/10/2025", "14/10/2026", Hoje).Consulta);
    }

    [Fact]
    public void Recusa_serie_fora_da_lista()
    {
        Assert.Equal(MotivoDaRecusa.ForaDaLista, ConsultaBcb.Validar("bcdata.sgs.999", "json", "01/10/2025", "13/10/2026", Hoje).Motivo);
    }

    [Theory]
    [InlineData("sgs.432", "json", "01/10/2025", "13/10/2026")] // prefixo
    [InlineData("bcdata.sgs.-1", "json", "01/10/2025", "13/10/2026")]
    [InlineData("bcdata.sgs.432", "csv", "01/10/2025", "13/10/2026")]
    [InlineData("bcdata.sgs.432", "json", "2025-10-01", "13/10/2026")]
    [InlineData("bcdata.sgs.432", "json", "13/10/2026", "01/10/2025")] // invertida
    [InlineData("bcdata.sgs.432", "json", "01/01/2016", "13/10/2026")] // mais de 10 anos
    [InlineData("bcdata.sgs.432", "json", "01/10/2025", "20/10/2026")] // fim no futuro
    [InlineData("bcdata.sgs.432", "json", null, "13/10/2026")]
    public void Recusa_parametro_malformado(string serie, string? formato, string? inicio, string? fim)
    {
        Assert.Equal(MotivoDaRecusa.Malformada, ConsultaBcb.Validar(serie, formato, inicio, fim, Hoje).Motivo);
    }
}

public sealed class ConsultaIpeaTests
{
    [Fact]
    public void Aceita_serie_da_lista()
    {
        var validacao = ConsultaIpea.Validar("ValoresSerie(SERCODIGO='PNADS_GINI')", "VALDATA,VALVALOR");

        Assert.Equal("ValoresSerie(SERCODIGO='PNADS_GINI')?$select=VALDATA,VALVALOR", validacao.Consulta!.Caminho);
        Assert.Equal("ipea:PNADS_GINI", validacao.Consulta.Chave);
    }

    [Fact]
    public void Recusa_serie_fora_da_lista()
    {
        Assert.Equal(MotivoDaRecusa.ForaDaLista, ConsultaIpea.Validar("ValoresSerie(SERCODIGO='BM12_TJOVER12')", "VALDATA,VALVALOR").Motivo);
    }

    [Theory]
    [InlineData("ValoresSerie(SERCODIGO='X') or (1 eq 1')", "VALDATA,VALVALOR")] // fecha o literal do OData
    [InlineData("ValoresSerie(SERCODIGO='pnads_gini')", "VALDATA,VALVALOR")]
    [InlineData("Metadados", "VALDATA,VALVALOR")]
    [InlineData("ValoresSerie(SERCODIGO='PNADS_GINI')", "*")]
    [InlineData("ValoresSerie(SERCODIGO='PNADS_GINI')", null)]
    public void Recusa_recurso_ou_selecao_diferentes(string recurso, string? selecao)
    {
        Assert.Equal(MotivoDaRecusa.Malformada, ConsultaIpea.Validar(recurso, selecao).Motivo);
    }
}
