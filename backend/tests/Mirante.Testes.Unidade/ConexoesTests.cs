using System.ComponentModel.DataAnnotations;
using Mirante.Api.Configuracao;

namespace Mirante.Testes.Unidade;

public sealed class ConexoesTests
{
    [Fact]
    public void Sem_as_duas_conexoes_a_validacao_aponta_cada_uma()
    {
        var erros = Validar(new Conexoes());

        Assert.Equal(
            ["Defina ConnectionStrings__Postgres.", "Defina ConnectionStrings__Redis."],
            erros.Select(e => e.ErrorMessage).Order());
    }

    [Fact]
    public void Com_as_duas_conexoes_a_validacao_passa()
    {
        var erros = Validar(new Conexoes { Postgres = "Host=db", Redis = "cache:6379" });

        Assert.Empty(erros);
    }

    private static List<ValidationResult> Validar(Conexoes conexoes)
    {
        var erros = new List<ValidationResult>();
        Validator.TryValidateObject(conexoes, new ValidationContext(conexoes), erros, validateAllProperties: true);
        return erros;
    }
}
