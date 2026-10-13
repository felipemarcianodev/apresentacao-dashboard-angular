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

    public static HttpResponseMessage Json(string corpo, HttpStatusCode status = HttpStatusCode.OK) =>
        new(status) { Content = new StringContent(corpo, Encoding.UTF8, "application/json") };

    public HttpMessageHandler Manipulador(Fonte fonte) => new ManipuladorSimulado(fonte, this);

    private sealed class ManipuladorSimulado(Fonte fonte, FontesSimuladas simulador) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            simulador.chamadas.Enqueue((fonte, request.RequestUri!));
            return Task.FromResult(simulador.responder(fonte));
        }
    }
}
