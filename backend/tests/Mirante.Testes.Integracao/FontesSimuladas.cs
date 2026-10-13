using System.Collections.Concurrent;
using System.Net;
using System.Text;
using Mirante.Fontes;

namespace Mirante.Testes.Integracao;

/// <summary>
/// Simula IBGE, BCB e Ipeadata: responde o que o teste mandar e registra cada chamada recebida.
/// </summary>
public sealed class FontesSimuladas
{
    private readonly ConcurrentQueue<(Fonte Fonte, Uri Endereco)> chamadas = new();
    private Func<Fonte, HttpResponseMessage> responder = _ => Json("[]");

    public IReadOnlyList<(Fonte Fonte, Uri Endereco)> Chamadas => [.. chamadas];

    public void Responder(Func<Fonte, HttpResponseMessage> resposta) => responder = resposta;

    /// <summary>Quanto a fonte demora para responder (para simular chamadas simultâneas).</summary>
    public TimeSpan Atraso { get; set; }

    public static HttpResponseMessage Json(string corpo, HttpStatusCode status = HttpStatusCode.OK) =>
        new(status) { Content = new StringContent(corpo, Encoding.UTF8, "application/json") };

    public HttpMessageHandler Manipulador(Fonte fonte) => new ManipuladorSimulado(fonte, this);

    private sealed class ManipuladorSimulado(Fonte fonte, FontesSimuladas simulador) : HttpMessageHandler
    {
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            simulador.chamadas.Enqueue((fonte, request.RequestUri!));
            if (simulador.Atraso > TimeSpan.Zero)
            {
                await Task.Delay(simulador.Atraso, cancellationToken);
            }
            return simulador.responder(fonte);
        }
    }
}
