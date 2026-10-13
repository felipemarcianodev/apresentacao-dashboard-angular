namespace Mirante.Fontes;

/// <summary>
/// O que os painéis consultam, e nada além disso: a API não é um proxy aberto para as fontes.
/// Espelha <c>indicadores.ts</c>, <c>bcb/series.ts</c> e <c>ipea/series.ts</c> do front.
/// </summary>
internal static class ListaPermitida
{
    /// <summary>Agregado do IBGE com as variáveis e os níveis de localidade (N1 Brasil, N3 UF) permitidos.</summary>
    public static readonly IReadOnlyDictionary<int, AgregadoPermitido> Ibge = new Dictionary<int, AgregadoPermitido>
    {
        [6579] = new([9324], ["N1", "N3"]), // população
        [4099] = new([4099], ["N1", "N3"]), // desocupação
        [5938] = new([37], ["N1", "N3"]), // PIB
        [1737] = new([2265, 63], ["N1"]), // IPCA
    };

    /// <summary>Quantos períodos para trás o IBGE pode devolver (o painel usa de 6 a 25).</summary>
    public const int IbgeMaximoDePeriodos = 60;

    /// <summary>Séries do SGS: Selic, dólar, euro, crédito, inadimplência e IBC-Br.</summary>
    public static readonly IReadOnlySet<int> Bcb = new HashSet<int> { 432, 1, 21619, 20539, 21082, 24364 };

    /// <summary>
    /// Prazos do seletor 1A, 2A e 5A do painel. A janela começa no primeiro dia do mês, tantos
    /// anos antes do fim (inicioDoPeriodo em sgs.ts): qualquer outra janela é recusada, o que
    /// mantém pequeno o número de consultas diferentes (e de chaves no cache).
    /// </summary>
    public static readonly IReadOnlyList<int> BcbPrazosEmAnos = [1, 2, 5];

    /// <summary>Séries do Ipeadata: crescimento do PIB, PIB per capita, salário mínimo real e Gini.</summary>
    public static readonly IReadOnlySet<string> Ipea = new HashSet<string>(StringComparer.Ordinal)
    {
        "SCN10_PIBG10",
        "GAC_PIBCAPUSN",
        "GAC12_SALMINRE12",
        "PNADS_GINI",
    };
}

internal sealed record AgregadoPermitido(IReadOnlyList<int> Variaveis, IReadOnlyList<string> Niveis);
