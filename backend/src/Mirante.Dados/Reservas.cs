using Microsoft.EntityFrameworkCore;

namespace Mirante.Dados;

/// <summary>Leitura e gravação da reserva (uma linha por consulta, sempre a mais recente).</summary>
public sealed class Reservas(MiranteDb db)
{
    public Task<Reserva?> LerAsync(string chave, CancellationToken cancelamento) =>
        db.Reservas.AsNoTracking().FirstOrDefaultAsync(r => r.Chave == chave, cancelamento);

    /// <summary>
    /// Grava ou substitui a resposta da consulta. Um único comando (INSERT ... ON CONFLICT), sem
    /// corrida entre duas requisições que buscaram a mesma série ao mesmo tempo.
    /// </summary>
    public Task GravarAsync(string chave, string fonte, string conteudo, DateTimeOffset obtidoEm, CancellationToken cancelamento) =>
        db.Database.ExecuteSqlInterpolatedAsync(
            $"""
            INSERT INTO reservas (chave, fonte, conteudo, obtido_em)
            VALUES ({chave}, {fonte}, CAST({conteudo} AS json), {obtidoEm})
            ON CONFLICT (chave) DO UPDATE
              SET conteudo = EXCLUDED.conteudo, obtido_em = EXCLUDED.obtido_em
              WHERE reservas.obtido_em < EXCLUDED.obtido_em
            """,
            cancelamento);
}
