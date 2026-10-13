using System.Net;
using Mirante.Api.Protecao;

namespace Mirante.Testes.Unidade;

public sealed class ParticaoDoIpTests
{
    [Theory]
    [InlineData("198.51.100.7", "198.51.100.7")]
    [InlineData("::ffff:198.51.100.7", "198.51.100.7")] // IPv4 dentro de IPv6
    [InlineData("2001:db8:abcd:12:1:2:3:4", "2001:db8:abcd:12::/64")]
    [InlineData("2001:db8:abcd:12:ffff:ffff:ffff:ffff", "2001:db8:abcd:12::/64")]
    public void Agrupa_IPv6_pelo_bloco_64_e_IPv4_pelo_endereco(string ip, string particao)
    {
        Assert.Equal(particao, ProtecaoExtensions.ParticaoDoIp(IPAddress.Parse(ip)));
    }

    [Fact]
    public void Sem_IP_todos_dividem_um_limite_so()
    {
        Assert.Equal("desconhecido", ProtecaoExtensions.ParticaoDoIp(null));
    }
}
