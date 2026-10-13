using Microsoft.EntityFrameworkCore;
using Mirante.Dados;
using StackExchange.Redis;

namespace Mirante.Api.Configuracao;

public static class InfraestruturaExtensions
{
    /// <summary>Registra o PostgreSQL (EF Core) e a conexão única com o Redis.</summary>
    public static IServiceCollection AddInfraestrutura(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<Conexoes>()
            .Bind(configuration.GetSection(Conexoes.Secao))
            .ValidateDataAnnotations()
            .ValidateOnStart();

        var conexoes = configuration.GetSection(Conexoes.Secao).Get<Conexoes>() ?? new Conexoes();

        services.AddDbContext<MiranteDb>(options => options.UseNpgsql(conexoes.Postgres));

        // Uma conexão para a aplicação inteira, como o StackExchange.Redis recomenda. Sem
        // AbortOnConnectFail, o Redis fora do ar não impede a API de subir: o cache é acessório.
        services.AddSingleton<IConnectionMultiplexer>(_ =>
        {
            var opcoes = ConfigurationOptions.Parse(conexoes.Redis);
            opcoes.AbortOnConnectFail = false;
            return ConnectionMultiplexer.Connect(opcoes);
        });

        return services;
    }
}
