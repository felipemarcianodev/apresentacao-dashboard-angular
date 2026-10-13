using Microsoft.EntityFrameworkCore;

namespace Mirante.Dados;

/// <summary>
/// Banco do Mirante (PostgreSQL). Guarda a reserva: a última resposta boa de cada série, usada
/// quando a fonte oficial está fora do ar.
/// </summary>
public sealed class MiranteDb(DbContextOptions<MiranteDb> options) : DbContext(options)
{
    public DbSet<Reserva> Reservas => Set<Reserva>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);

        var reserva = modelBuilder.Entity<Reserva>();
        reserva.ToTable("reservas");
        reserva.HasKey(r => r.Chave);
        reserva.Property(r => r.Chave).HasColumnName("chave").HasMaxLength(400);
        reserva.Property(r => r.Fonte).HasColumnName("fonte").HasMaxLength(8);
        reserva.Property(r => r.Conteudo).HasColumnName("conteudo").HasColumnType("json");
        reserva.Property(r => r.ObtidoEm).HasColumnName("obtido_em");
    }
}
