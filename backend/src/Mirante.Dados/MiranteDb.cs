using Microsoft.EntityFrameworkCore;

namespace Mirante.Dados;

/// <summary>
/// Banco do Mirante (PostgreSQL). Guarda a reserva: a última resposta boa de cada série, usada
/// quando a fonte oficial está fora do ar.
/// </summary>
public sealed class MiranteDb(DbContextOptions<MiranteDb> options) : DbContext(options);
