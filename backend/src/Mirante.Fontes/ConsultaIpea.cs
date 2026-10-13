using System.Text.RegularExpressions;

namespace Mirante.Fontes;

/// <summary>Valores de série do Ipeadata (OData v4): <c>ValoresSerie(SERCODIGO='X')?$select=VALDATA,VALVALOR</c>.</summary>
public static partial class ConsultaIpea
{
    private const string Selecao = "VALDATA,VALVALOR";

    public static Validacao Validar(string recurso, string? selecao)
    {
        var encontrado = Recurso().Match(recurso);
        if (!encontrado.Success)
        {
            return Validacao.Recusada(MotivoDaRecusa.Malformada, "Recurso deve ser ValoresSerie(SERCODIGO='...').");
        }
        var codigo = encontrado.Groups["codigo"].Value;
        if (!ListaPermitida.Ipea.Contains(codigo))
        {
            return Validacao.Recusada(MotivoDaRecusa.ForaDaLista, "Série fora da lista do Mirante.");
        }
        if (selecao != Selecao)
        {
            return Validacao.Recusada(MotivoDaRecusa.Malformada, $"$select deve ser {Selecao}.");
        }

        var caminho = $"ValoresSerie(SERCODIGO='{codigo}')?$select={Selecao}";
        return Validacao.Aceita(new Consulta(Fonte.Ipea, caminho, $"ipea:{codigo}"));
    }

    // Código só com maiúsculas, dígitos e sublinhado: nada de aspas, que fechariam o literal do OData.
    [GeneratedRegex("^ValoresSerie\\(SERCODIGO='(?<codigo>[A-Z0-9_]{1,40})'\\)$", RegexOptions.CultureInvariant)]
    private static partial Regex Recurso();
}
