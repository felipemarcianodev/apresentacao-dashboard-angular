using System.Text.Json;

namespace Mirante.Fontes;

/// <summary>A fonte não respondeu, respondeu com erro ou com algo que não é JSON.</summary>
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
        catch (TimeoutException ex)
        {
            throw new FonteIndisponivelException(consulta.Fonte, "tempo esgotado", ex);
        }
        catch (TaskCanceledException ex) when (!cancelamento.IsCancellationRequested)
        {
            throw new FonteIndisponivelException(consulta.Fonte, "tempo esgotado", ex);
        }

        // Página de manutenção em HTML com status 200 acontece; isso não pode chegar ao painel.
        if (!EhJson(corpo))
        {
            throw new FonteIndisponivelException(consulta.Fonte, "resposta não é JSON");
        }
        return corpo;
    }

    private static bool EhJson(string corpo)
    {
        try
        {
            using var _ = JsonDocument.Parse(corpo);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
