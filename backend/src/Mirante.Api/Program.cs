using Mirante.Api.Configuracao;
using Mirante.Api.Fontes;
using Mirante.Api.Saude;
using Mirante.Fontes;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(kestrel => kestrel.AddServerHeader = false);
if (!builder.Environment.IsDevelopment())
{
    builder.Logging.ClearProviders().AddJsonConsole();
}

builder.Services.AddProblemDetails();
builder.Services.AddInfraestrutura(builder.Configuration);
builder.Services.AddSaude();
builder.Services.AddFontes(builder.Configuration);
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddOptions<OpcoesDoCache>().Bind(builder.Configuration.GetSection(OpcoesDoCache.Secao));
builder.Services.AddHybridCache(opcoes => opcoes.MaximumPayloadBytes = 8 * 1024 * 1024);
builder.Services.AddSingleton<ConsultasComCache>();

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.MapSaude();
app.MapFontes();

await app.RunAsync();

/// <summary>Ponto de entrada, exposto para os testes de integração (WebApplicationFactory).</summary>
public partial class Program;
