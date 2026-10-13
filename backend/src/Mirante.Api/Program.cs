using Mirante.Api.Configuracao;
using Mirante.Api.Fontes;
using Mirante.Fontes;
using Mirante.Api.Saude;

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

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.MapSaude();
app.MapFontes();

app.Run();

/// <summary>Ponto de entrada, exposto para os testes de integração (WebApplicationFactory).</summary>
public partial class Program;
