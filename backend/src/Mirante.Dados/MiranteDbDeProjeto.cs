using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Mirante.Dados;

/// <summary>
/// Usado só pelo <c>dotnet ef</c> para gerar migrations; não abre conexão. Em execução, a cadeia
/// de conexão vem da configuração da API.
/// </summary>
internal sealed class MiranteDbDeProjeto : IDesignTimeDbContextFactory<MiranteDb>
{
    public MiranteDb CreateDbContext(string[] args) =>
        new(new DbContextOptionsBuilder<MiranteDb>().UseNpgsql("Host=localhost;Database=mirante").Options);
}
