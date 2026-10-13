namespace Mirante.Dados;

/// <summary>
/// A última resposta boa de uma consulta, guardada para quando a fonte oficial estiver fora do ar.
/// </summary>
public sealed class Reserva
{
    /// <summary>Chave canônica da consulta (a mesma do cache).</summary>
    public required string Chave { get; init; }

    /// <summary>Ibge, Bcb ou Ipea.</summary>
    public required string Fonte { get; init; }

    /// <summary>O JSON exatamente como a fonte devolveu (coluna json, não jsonb, que reformataria o texto).</summary>
    public required string Conteudo { get; set; }

    /// <summary>Quando a fonte devolveu esse conteúdo.</summary>
    public required DateTimeOffset ObtidoEm { get; set; }
}
