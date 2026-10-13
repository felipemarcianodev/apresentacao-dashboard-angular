using System.Globalization;

namespace Mirante.Fontes;

/// <summary>
/// Séries do SGS do Banco Central:
/// <c>bcdata.sgs.{codigo}/dados?formato=json&amp;dataInicial=dd/MM/aaaa&amp;dataFinal=dd/MM/aaaa</c>.
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
        // Margem de dois dias no fim: o navegador está no fuso de quem acessa, a API em UTC.
        if (inicio > fim || fim > hoje.AddDays(2) || inicio < fim.AddYears(-ListaPermitida.BcbMaximoDeAnos))
        {
            return Validacao.Recusada(
                MotivoDaRecusa.Malformada,
                $"Janela inválida: início antes do fim, fim até hoje e no máximo {ListaPermitida.BcbMaximoDeAnos} anos.");
        }

        var caminho = string.Create(
            CultureInfo.InvariantCulture,
            $"{Prefixo}{codigo}/dados?formato=json&dataInicial={Escrever(inicio)}&dataFinal={Escrever(fim)}");
        return Validacao.Aceita(new Consulta(Fonte.Bcb, caminho, $"bcb:{caminho}"));
    }

    private static bool LerData(string? texto, out DateOnly data) =>
        DateOnly.TryParseExact(texto, FormatoDaData, CultureInfo.InvariantCulture, DateTimeStyles.None, out data);

    private static string Escrever(DateOnly data) => data.ToString(FormatoDaData, CultureInfo.InvariantCulture);
}
