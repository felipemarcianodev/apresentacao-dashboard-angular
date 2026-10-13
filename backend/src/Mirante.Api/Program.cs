using Mirante.Api.Configuracao;
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

var app = builder.Build();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.MapSaude();

app.Run();

/// <summary>Ponto de entrada, exposto para os testes de integração (WebApplicationFactory).</summary>
public partial class Program;
