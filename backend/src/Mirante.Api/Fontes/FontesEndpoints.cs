using System.Globalization;
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
        var api = app.MapGroup("/api");

        api.MapGet("/ibge/agregados/{agregado:int}/periodos/{periodos}/variaveis/{variaveis}",
            (int agregado, string periodos, string variaveis, string? localidades, ClienteDasFontes fontes, HttpContext contexto) =>
                Responder(ConsultaIbge.Validar(agregado, periodos, variaveis, localidades), fontes, contexto));

        api.MapGet("/bcb/serie/{serie}/dados",
            (string serie, string? formato, string? dataInicial, string? dataFinal, ClienteDasFontes fontes, TimeProvider relogio, HttpContext contexto) =>
                Responder(
                    ConsultaBcb.Validar(serie, formato, dataInicial, dataFinal, DateOnly.FromDateTime(relogio.GetUtcNow().UtcDateTime)),
                    fontes,
                    contexto));

        api.MapGet("/ipea/odata4/{recurso}",
            (string recurso, ClienteDasFontes fontes, HttpContext contexto) =>
                Responder(ConsultaIpea.Validar(recurso, contexto.Request.Query["$select"]), fontes, contexto));

        return app;
    }

    private static async Task<IResult> Responder(Validacao validacao, ClienteDasFontes fontes, HttpContext contexto)
    {
        if (validacao.Consulta is not { } consulta)
        {
            return validacao.Motivo == MotivoDaRecusa.ForaDaLista
                ? Results.Problem(validacao.Mensagem, statusCode: StatusCodes.Status404NotFound, title: "Consulta fora da lista do Mirante")
                : Results.Problem(validacao.Mensagem, statusCode: StatusCodes.Status400BadRequest, title: "Consulta malformada");
        }

        try
        {
            var json = await fontes.BuscarAsync(consulta, contexto.RequestAborted);
            contexto.Response.Headers["X-Mirante-Origem"] = "fonte";
            contexto.Response.Headers["X-Mirante-Obtido-Em"] = DateTimeOffset.UtcNow.ToString("O", CultureInfo.InvariantCulture);
            return Results.Text(json, "application/json; charset=utf-8");
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
