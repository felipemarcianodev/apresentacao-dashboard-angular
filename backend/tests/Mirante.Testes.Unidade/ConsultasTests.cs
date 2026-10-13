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

    [Theory]
    [InlineData("01/10/2025", 1)]
    [InlineData("01/10/2024", 2)]
    [InlineData("01/10/2021", 5)]
    public void Aceita_as_janelas_do_seletor_do_painel(string inicio, int anos)
    {
        var validacao = ConsultaBcb.Validar("bcdata.sgs.432", "json", inicio, "13/10/2026", Hoje);

        Assert.Equal($"bcdata.sgs.432/dados?formato=json&dataInicial={inicio}&dataFinal=13/10/2026", validacao.Consulta!.Caminho);
        Assert.Equal($"bcb:432:{anos}a", validacao.Consulta.ChaveDaReserva);
    }

    [Fact]
    public void Aceita_o_fim_um_dia_adiante_por_causa_do_fuso()
    {
        Assert.NotNull(ConsultaBcb.Validar("bcdata.sgs.1", "json", "01/10/2025", "14/10/2026", Hoje).Consulta);
    }

    [Fact]
    public void A_reserva_tem_uma_chave_por_serie_e_prazo_e_nao_por_dia()
    {
        var ontem = ConsultaBcb.Validar("bcdata.sgs.1", "json", "01/10/2024", "12/10/2026", Hoje).Consulta!;
        var hoje = ConsultaBcb.Validar("bcdata.sgs.1", "json", "01/10/2024", "13/10/2026", Hoje).Consulta!;

        Assert.NotEqual(ontem.Chave, hoje.Chave);
        Assert.Equal(ontem.ChaveDaReserva, hoje.ChaveDaReserva);
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
    [InlineData("bcdata.sgs.432", "json", null, "13/10/2026")]
    [InlineData("bcdata.sgs.432", "json", "02/10/2025", "13/10/2026")] // não é o primeiro dia do mês
    [InlineData("bcdata.sgs.432", "json", "01/10/2023", "13/10/2026")] // 3 anos não é prazo do painel
    [InlineData("bcdata.sgs.432", "json", "01/10/2016", "13/10/2026")] // 10 anos também não
    [InlineData("bcdata.sgs.432", "json", "01/09/2025", "13/10/2026")] // mês diferente do fim
    [InlineData("bcdata.sgs.432", "json", "01/10/2024", "01/10/2025")] // fim no passado
    [InlineData("bcdata.sgs.432", "json", "01/10/2025", "20/10/2026")] // fim no futuro
    [InlineData("bcdata.sgs.432", "json", "01/01/0005", "01/01/0005")] // ano mínimo não derruba a validação
    public void Recusa_janela_ou_parametro_fora_do_padrao(string serie, string? formato, string? inicio, string? fim)
    {
        Assert.Equal(MotivoDaRecusa.Malformada, ConsultaBcb.Validar(serie, formato, inicio, fim, Hoje).Motivo);
    }
}

public sealed class FormatoDaFonteTests
{
    [Theory]
    [InlineData(Fonte.Ibge, """[{"id":"9324"}]""", true)]
    [InlineData(Fonte.Bcb, """[{"data":"01/10/2026","valor":"15"}]""", true)]
    [InlineData(Fonte.Ipea, """{"value":[{"VALDATA":"2024-01-01","VALVALOR":1}]}""", true)]
    [InlineData(Fonte.Bcb, "[]", false)]
    [InlineData(Fonte.Ibge, """{"erro":"manutencao"}""", false)]
    [InlineData(Fonte.Ipea, """{"value":[]}""", false)]
    [InlineData(Fonte.Ipea, """[{"VALDATA":"2024-01-01"}]""", false)]
    [InlineData(Fonte.Bcb, "<html>Manutenção</html>", false)]
    public void So_aceita_o_formato_de_dado_de_cada_fonte(Fonte fonte, string corpo, bool esperado)
    {
        Assert.Equal(esperado, ClienteDasFontes.TemOFormatoDaFonte(fonte, corpo));
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
    [InlineData("ValoresSerie(SERCODIGO='PNADS_GINI')\n", "VALDATA,VALVALOR")] // quebra de linha no fim
    public void Recusa_recurso_ou_selecao_diferentes(string recurso, string? selecao)
    {
        Assert.Equal(MotivoDaRecusa.Malformada, ConsultaIpea.Validar(recurso, selecao).Motivo);
    }
}
