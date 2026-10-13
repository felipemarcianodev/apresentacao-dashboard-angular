using System.Globalization;

namespace Mirante.Fontes;

/// <summary>
/// Séries do SGS do Banco Central:
/// <c>bcdata.sgs.{codigo}/dados?formato=json&amp;dataInicial=dd/MM/aaaa&amp;dataFinal=dd/MM/aaaa</c>.
/// Só as janelas que o painel pede: fim no dia de hoje e início no primeiro dia do mês, 1, 2 ou
/// 5 anos antes.
/// </summary>
public static class ConsultaBcb
{
    private const string Prefixo = "bcdata.sgs.";
    private const string FormatoDaData = "dd/MM/yyyy";

    public static Validacao Validar(string serie, string? formato, string? dataInicial, string? dataFinal, DateOnly hoje)
    {
        if (!serie.StartsWith(Prefixo, StringComparison.Ordinal)
            || !int.TryParse(serie.AsSpan(Prefixo.Length), NumberStyles.None, CultureInfo.InvariantCulture, out var codigo))
        {
            return Validacao.Recusada(MotivoDaRecusa.Malformada, "Série deve ser bcdata.sgs.{código}.");
        }
        if (!ListaPermitida.Bcb.Contains(codigo))
        {
            return Validacao.Recusada(MotivoDaRecusa.ForaDaLista, "Série fora da lista do Mirante.");
        }
        if (formato != "json")
        {
            return Validacao.Recusada(MotivoDaRecusa.Malformada, "Formato deve ser json.");
        }
        if (!LerData(dataInicial, out var inicio) || !LerData(dataFinal, out var fim))
        {
            return Validacao.Recusada(MotivoDaRecusa.Malformada, "Datas devem estar no formato dd/MM/aaaa.");
        }
        // O fim é o "hoje" do navegador, que está no fuso de quem acessa (a API está em UTC):
        // margem de alguns dias para os dois lados, e nada além disso.
        if (fim < hoje.AddDays(-3) || fim > hoje.AddDays(2))
        {
            return Validacao.Recusada(MotivoDaRecusa.Malformada, "A data final deve ser a de hoje.");
        }
        var anos = ListaPermitida.BcbPrazosEmAnos.FirstOrDefault(a => inicio == new DateOnly(fim.Year - a, fim.Month, 1));
        if (anos == 0)
        {
            return Validacao.Recusada(
                MotivoDaRecusa.Malformada,
                "A data inicial deve ser o primeiro dia do mês, 1, 2 ou 5 anos antes da final.");
        }

        var caminho = string.Create(
            CultureInfo.InvariantCulture,
            $"{Prefixo}{codigo}/dados?formato=json&dataInicial={Escrever(inicio)}&dataFinal={Escrever(fim)}");
        return Validacao.Aceita(new Consulta(
            Fonte.Bcb,
            caminho,
            $"bcb:{caminho}",
            string.Create(CultureInfo.InvariantCulture, $"bcb:{codigo}:{anos}a")));
    }

    private static bool LerData(string? texto, out DateOnly data) =>
        DateOnly.TryParseExact(texto, FormatoDaData, CultureInfo.InvariantCulture, DateTimeStyles.None, out data);

    private static string Escrever(DateOnly data) => data.ToString(FormatoDaData, CultureInfo.InvariantCulture);
}
