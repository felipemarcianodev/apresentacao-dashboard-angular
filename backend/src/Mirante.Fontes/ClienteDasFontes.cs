using System.Text.Json;
using Polly;

namespace Mirante.Fontes;

/// <summary>A fonte não respondeu, respondeu com erro ou com algo que não é o dado esperado.</summary>
public sealed class FonteIndisponivelException(Fonte fonte, string motivo, Exception? causa = null)
    : Exception($"{fonte}: {motivo}", causa)
{
    public Fonte Fonte { get; } = fonte;
}

/// <summary>
/// Faz a consulta já validada na fonte certa e devolve o JSON como veio, sem reinterpretar: o
/// mapeamento continua nas funções puras do front.
/// </summary>
public sealed class ClienteDasFontes(IHttpClientFactory fabrica)
{
    public static string NomeDoCliente(Fonte fonte) => $"fonte-{fonte.ToString().ToLowerInvariant()}";

    public async Task<string> BuscarAsync(Consulta consulta, CancellationToken cancelamento)
    {
        ArgumentNullException.ThrowIfNull(consulta);
        var cliente = fabrica.CreateClient(NomeDoCliente(consulta.Fonte));

        string corpo;
        try
        {
            using var resposta = await cliente.GetAsync(new Uri(consulta.Caminho, UriKind.Relative), cancelamento);
            if (!resposta.IsSuccessStatusCode)
            {
                throw new FonteIndisponivelException(consulta.Fonte, $"HTTP {(int)resposta.StatusCode}");
            }
            corpo = await resposta.Content.ReadAsStringAsync(cancelamento);
        }
        catch (HttpRequestException ex)
        {
            throw new FonteIndisponivelException(consulta.Fonte, "falha de rede", ex);
        }
        // Prazo esgotado, disjuntor aberto ou fila cheia na resiliência (Polly).
        catch (ExecutionRejectedException ex)
        {
            throw new FonteIndisponivelException(consulta.Fonte, ex.GetType().Name, ex);
        }
        catch (TimeoutException ex)
        {
            throw new FonteIndisponivelException(consulta.Fonte, "tempo esgotado", ex);
        }
        catch (TaskCanceledException ex) when (!cancelamento.IsCancellationRequested)
        {
            throw new FonteIndisponivelException(consulta.Fonte, "tempo esgotado", ex);
        }

        // Página de manutenção, ou erro em JSON com status 200: isso não pode ir para o cache
        // nem substituir a última resposta boa da reserva.
        if (!TemOFormatoDaFonte(consulta.Fonte, corpo))
        {
            throw new FonteIndisponivelException(consulta.Fonte, "resposta fora do formato esperado");
        }
        return corpo;
    }

    /// <summary>IBGE e SGS devolvem uma lista com dados; o Ipeadata, um objeto com a lista em <c>value</c>.</summary>
    internal static bool TemOFormatoDaFonte(Fonte fonte, string corpo)
    {
        try
        {
            using var documento = JsonDocument.Parse(corpo);
            var raiz = documento.RootElement;
            var lista = fonte == Fonte.Ipea
                ? raiz.ValueKind == JsonValueKind.Object && raiz.TryGetProperty("value", out var valores) ? valores : default
                : raiz;
            return lista.ValueKind == JsonValueKind.Array && lista.GetArrayLength() > 0;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
