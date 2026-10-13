using System.ComponentModel.DataAnnotations;

namespace Mirante.Api.Configuracao;

/// <summary>
/// Conexões com o PostgreSQL (reserva) e o Redis (cache), lidas de <c>ConnectionStrings</c>.
/// Validadas na subida: sem elas a API não inicia, em vez de falhar na primeira requisição.
/// </summary>
public sealed class Conexoes
{
    public const string Secao = "ConnectionStrings";

    [Required(ErrorMessage = "Defina ConnectionStrings__Postgres.")]
    public string Postgres { get; init; } = string.Empty;

    [Required(ErrorMessage = "Defina ConnectionStrings__Redis.")]
    public string Redis { get; init; } = string.Empty;
}
