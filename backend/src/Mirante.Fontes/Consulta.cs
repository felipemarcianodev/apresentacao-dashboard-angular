namespace Mirante.Fontes;

/// <summary>Consulta já validada contra a lista permitida.</summary>
/// <param name="Fonte">De qual fonte é.</param>
/// <param name="Caminho">Caminho relativo ao endereço base da fonte, montado só com valores validados.</param>
/// <param name="Chave">Identificação estável da consulta, usada no cache e na reserva.</param>
public sealed record Consulta(Fonte Fonte, string Caminho, string Chave);

/// <summary>Por que uma consulta foi recusada, sem chegar à fonte.</summary>
public enum MotivoDaRecusa
{
    /// <summary>Parâmetro malformado (data inválida, número fora do formato).</summary>
    Malformada,

    /// <summary>Bem formada, mas fora do que o Mirante consulta (série, agregado ou variável).</summary>
    ForaDaLista,
}

/// <summary>Resultado da validação: a consulta pronta ou o motivo da recusa.</summary>
public sealed record Validacao(Consulta? Consulta, MotivoDaRecusa? Motivo, string? Mensagem)
{
    public static Validacao Aceita(Consulta consulta) => new(consulta, null, null);

    public static Validacao Recusada(MotivoDaRecusa motivo, string mensagem) => new(null, motivo, mensagem);
}
