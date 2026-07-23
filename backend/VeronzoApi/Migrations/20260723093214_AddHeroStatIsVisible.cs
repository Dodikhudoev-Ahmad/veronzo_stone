using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VeronzoApi.Migrations
{
    /// <inheritdoc />
    public partial class AddHeroStatIsVisible : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsVisible",
                table: "HeroStats",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsVisible",
                table: "HeroStats");
        }
    }
}
