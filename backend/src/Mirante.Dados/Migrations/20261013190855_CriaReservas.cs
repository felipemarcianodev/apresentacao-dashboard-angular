using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Mirante.Dados.Migrations
{
    /// <inheritdoc />
    public partial class CriaReservas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "reservas",
                columns: table => new
                {
                    chave = table.Column<string>(type: "character varying(400)", maxLength: 400, nullable: false),
                    fonte = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    conteudo = table.Column<string>(type: "json", nullable: false),
                    obtido_em = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_reservas", x => x.chave);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "reservas");
        }
    }
}
