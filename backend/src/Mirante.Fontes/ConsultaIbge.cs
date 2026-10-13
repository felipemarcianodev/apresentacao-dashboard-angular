using System.Globalization;

namespace Mirante.Fontes;

/// <summary>Agregados do IBGE (v3): <c>{agregado}/periodos/-N/variaveis/a|b?localidades=N1[all]|N3[all]</c>.</summary>
public static class ConsultaIbge
{
    private const string TodasDoNivel = "[all]";

    public static Validacao Validar(int agregado, string periodos, string variaveis, string? localidades)
    {
        if (!ListaPermitida.Ibge.TryGetValue(agregado, out var permitido))
        {
            return Validacao.Recusada(MotivoDaRecusa.ForaDaLista, "Agregado fora da lista do Mirante.");
        }

        if (!int.TryParse(periodos, NumberStyles.AllowLeadingSign, CultureInfo.InvariantCulture, out var ultimos)
            || ultimos >= 0 || ultimos < -ListaPermitida.IbgeMaximoDePeriodos)
        {
            return Validacao.Recusada(
                MotivoDaRecusa.Malformada,
                $"Períodos deve ser os N últimos, de -1 a -{ListaPermitida.IbgeMaximoDePeriodos}.");
        }

        var ids = new SortedSet<int>();
        foreach (var parte in variaveis.Split('|'))
        {
            if (!int.TryParse(parte, NumberStyles.None, CultureInfo.InvariantCulture, out var id))
            {
                return Validacao.Recusada(MotivoDaRecusa.Malformada, "Variáveis devem ser números separados por |.");
            }
            if (!permitido.Variaveis.Contains(id))
            {
                return Validacao.Recusada(MotivoDaRecusa.ForaDaLista, "Variável fora da lista do Mirante.");
            }
            ids.Add(id);
        }

        var niveis = new SortedSet<string>(StringComparer.Ordinal);
        foreach (var parte in (localidades ?? string.Empty).Split('|'))
        {
            // Só "todas as localidades do nível" (N1[all], N3[all]): nada de lista arbitrária.
            if (parte.Length != 2 + TodasDoNivel.Length || !parte.EndsWith(TodasDoNivel, StringComparison.Ordinal))
            {
                return Validacao.Recusada(MotivoDaRecusa.Malformada, "Localidades devem ser N1[all] ou N3[all].");
            }
            var nivel = parte[..2];
            if (!permitido.Niveis.Contains(nivel))
            {
                return Validacao.Recusada(MotivoDaRecusa.ForaDaLista, "Nível de localidade fora da lista do Mirante.");
            }
            niveis.Add(nivel);
        }

        // Ordem canônica: a mesma consulta escrita de outro jeito cai na mesma chave de cache.
        var caminho = string.Create(
            CultureInfo.InvariantCulture,
            $"{agregado}/periodos/{ultimos}/variaveis/{string.Join('|', ids)}?localidades={string.Join('|', niveis.Select(n => n + TodasDoNivel))}");
        var chave = $"ibge:{caminho}";
        return Validacao.Aceita(new Consulta(Fonte.Ibge, caminho, chave, chave));
    }
}
