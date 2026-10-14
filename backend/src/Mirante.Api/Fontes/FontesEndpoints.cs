using System.Globalization;
using Mirante.Api.Protecao;
using Mirante.Fontes;

namespace Mirante.Api.Fontes;

/// <summary>
/// Os mesmos caminhos das fontes oficiais sob <c>/api/</c>: para o front, só muda a URL base.
/// Cada consulta é validada contra a lista permitida antes de qualquer chamada externa.
/// </summary>
public static class FontesEndpoints
{
    public static IEndpointRouteBuilder MapFontes(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api").RequireRateLimiting(ProtecaoExtensions.PoliticaDaApi);
        // GET e HEAD, os mesmos que o nginx do site deixa passar (limit_except GET já inclui HEAD).
        string[] metodos = [HttpMethods.Get, HttpMethods.Head];

        api.MapMethods("/ibge/agregados/{agregado:int}/periodos/{periodos}/variaveis/{variaveis}", metodos,
            (int agregado, string periodos, string variaveis, string? localidades, ConsultasComCache consultas, HttpContext contexto) =>
                Responder(ConsultaIbge.Validar(agregado, periodos, variaveis, localidades), consultas, contexto));

        api.MapMethods("/bcb/serie/{serie}/dados", metodos,
            (string serie, string? formato, string? dataInicial, string? dataFinal, ConsultasComCache consultas, TimeProvider relogio, HttpContext contexto) =>
                Responder(
                    ConsultaBcb.Validar(serie, formato, dataInicial, dataFinal, DateOnly.FromDateTime(relogio.GetUtcNow().UtcDateTime)),
                    consultas,
                    contexto));

        api.MapMethods("/ipea/odata4/{recurso}", metodos,
            (string recurso, ConsultasComCache consultas, HttpContext contexto) =>
                Responder(ConsultaIpea.Validar(recurso, contexto.Request.Query["$select"]), consultas, contexto));

        return app;
    }

    private static async Task<IResult> Responder(Validacao validacao, ConsultasComCache consultas, HttpContext contexto)
    {
        if (validacao.Consulta is not { } consulta)
        {
            return validacao.Motivo == MotivoDaRecusa.ForaDaLista
                ? Results.Problem(validacao.Mensagem, statusCode: StatusCodes.Status404NotFound, title: "Consulta fora da lista do Mirante")
                : Results.Problem(validacao.Mensagem, statusCode: StatusCodes.Status400BadRequest, title: "Consulta malformada");
        }

        try
        {
            var resposta = await consultas.ObterAsync(consulta, contexto.RequestAborted);
            var cabecalhos = contexto.Response.Headers;
            cabecalhos["X-Mirante-Origem"] = resposta.Origem.ToString().ToLowerInvariant();
            cabecalhos["X-Mirante-Obtido-Em"] = resposta.ObtidoEm.ToString("O", CultureInfo.InvariantCulture);
            // O navegador guarda por pouco tempo; dado da reserva, nem isso: a fonte pode voltar já.
            cabecalhos.CacheControl = resposta.Origem == Origem.Reserva ? "no-store" : "public, max-age=300";
            if (HttpMethods.IsHead(contexto.Request.Method))
            {
                // HEAD: os mesmos cabeçalhos, sem corpo (não depende do servidor descartar).
                contexto.Response.ContentType = "application/json; charset=utf-8";
                return Results.StatusCode(StatusCodes.Status200OK);
            }
            return Results.Text(resposta.Json, "application/json; charset=utf-8");
        }
        catch (FonteIndisponivelException)
        {
            return Results.Problem(
                "A fonte oficial não respondeu agora. Tente de novo em instantes.",
                statusCode: StatusCodes.Status502BadGateway,
                title: "Fonte indisponível");
        }
    }
}
