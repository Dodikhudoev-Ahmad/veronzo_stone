using Microsoft.EntityFrameworkCore;
using VeronzoApi.Models;

namespace VeronzoApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PortfolioItem> PortfolioItems => Set<PortfolioItem>();
    public DbSet<GalleryItem> GalleryItems => Set<GalleryItem>();
    public DbSet<SiteContent> SiteContents => Set<SiteContent>();
    public DbSet<HeroStat> HeroStats => Set<HeroStat>();
    public DbSet<SocialLink> SocialLinks => Set<SocialLink>();
    public DbSet<ContactInfo> ContactInfos => Set<ContactInfo>();
    public DbSet<SeoMeta> SeoMetas => Set<SeoMeta>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<ProductAttributeDefinition> ProductAttributeDefinitions => Set<ProductAttributeDefinition>();
    public DbSet<ProductAttributeOption> ProductAttributeOptions => Set<ProductAttributeOption>();
    public DbSet<ProductAttributeValue> ProductAttributeValues => Set<ProductAttributeValue>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();

    public DbSet<CategoryTranslation> CategoryTranslations => Set<CategoryTranslation>();
    public DbSet<ProductTranslation> ProductTranslations => Set<ProductTranslation>();
    public DbSet<ProductAttributeDefinitionTranslation> ProductAttributeDefinitionTranslations => Set<ProductAttributeDefinitionTranslation>();
    public DbSet<ProductAttributeOptionTranslation> ProductAttributeOptionTranslations => Set<ProductAttributeOptionTranslation>();
    public DbSet<PortfolioItemTranslation> PortfolioItemTranslations => Set<PortfolioItemTranslation>();
    public DbSet<GalleryItemTranslation> GalleryItemTranslations => Set<GalleryItemTranslation>();
    public DbSet<SiteContentTranslation> SiteContentTranslations => Set<SiteContentTranslation>();
    public DbSet<HeroStatTranslation> HeroStatTranslations => Set<HeroStatTranslation>();
    public DbSet<SeoMetaTranslation> SeoMetaTranslations => Set<SeoMetaTranslation>();
    public DbSet<ContactInfoTranslation> ContactInfoTranslations => Set<ContactInfoTranslation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>().HasIndex(c => c.Slug).IsUnique();
        modelBuilder.Entity<SiteContent>().HasIndex(c => c.Key).IsUnique();
        modelBuilder.Entity<SeoMeta>().HasIndex(s => s.PageKey).IsUnique();

        modelBuilder.Entity<AdminUser>().HasIndex(a => a.NormalizedEmail).IsUnique();

        modelBuilder.Entity<RefreshToken>().HasIndex(r => r.TokenHash).IsUnique();
        modelBuilder.Entity<RefreshToken>().HasIndex(r => r.AdminUserId);
        modelBuilder.Entity<RefreshToken>()
            .HasOne(r => r.AdminUser)
            .WithMany()
            .HasForeignKey(r => r.AdminUserId)
            .OnDelete(DeleteBehavior.Cascade);

        // Explicit DB-level default so the migration adding this column defaults
        // existing rows to visible, not hidden.
        modelBuilder.Entity<HeroStat>().Property(h => h.IsVisible).HasDefaultValue(true);

        // Attribute/filter system: Key/Value are stable slugs used as public filter
        // query-param keys/values, unique within their parent (category / definition).
        // Option/Value reference-data relations use Restrict, not Cascade, so deleting
        // a definition/option with data still attached fails at the DB level too --
        // defense-in-depth behind the app-level 409 guards in the admin endpoints.
        modelBuilder.Entity<ProductAttributeDefinition>(e =>
        {
            e.Property(d => d.Key).IsRequired().HasMaxLength(100);
            e.Property(d => d.Name).IsRequired().HasMaxLength(200);
            e.HasIndex(d => new { d.CategoryId, d.Key }).IsUnique();
        });

        modelBuilder.Entity<ProductAttributeOption>(e =>
        {
            e.Property(o => o.Value).IsRequired().HasMaxLength(100);
            e.Property(o => o.Label).IsRequired().HasMaxLength(200);
            e.HasIndex(o => new { o.DefinitionId, o.Value }).IsUnique();
            e.HasOne(o => o.Definition).WithMany(d => d.Options)
                .HasForeignKey(o => o.DefinitionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductAttributeValue>(e =>
        {
            e.Property(v => v.TextValue).HasMaxLength(500);
            e.HasIndex(v => new { v.ProductId, v.DefinitionId }).IsUnique();
            e.HasOne(v => v.Product).WithMany(p => p.AttributeValues)
                .HasForeignKey(v => v.ProductId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(v => v.Definition).WithMany(d => d.Values)
                .HasForeignKey(v => v.DefinitionId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne(v => v.Option).WithMany()
                .HasForeignKey(v => v.OptionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductImage>(e =>
        {
            e.Property(i => i.ImageUrl).IsRequired().HasMaxLength(500);
            e.HasIndex(i => new { i.ProductId, i.ImageUrl }).IsUnique();
            e.HasOne(i => i.Product).WithMany(p => p.Images)
                .HasForeignKey(i => i.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductAttributeDefinitionTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Name).IsRequired().HasMaxLength(200);
            e.HasIndex(t => new { t.ProductAttributeDefinitionId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.ProductAttributeDefinition).WithMany(d => d.Translations)
                .HasForeignKey(t => t.ProductAttributeDefinitionId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductAttributeOptionTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Label).IsRequired().HasMaxLength(200);
            e.HasIndex(t => new { t.ProductAttributeOptionId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.ProductAttributeOption).WithMany(o => o.Translations)
                .HasForeignKey(t => t.ProductAttributeOptionId).OnDelete(DeleteBehavior.Cascade);
        });

        // Translation tables: each is unique on (parent FK, LanguageCode) so a given
        // language can never be duplicated for the same parent row, and each cascades
        // on parent delete so removing e.g. a Category cleans up its translations too.
        modelBuilder.Entity<CategoryTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Name).IsRequired().HasMaxLength(200);
            e.Property(t => t.Description).HasMaxLength(2000);
            e.HasIndex(t => new { t.CategoryId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.Category).WithMany(c => c.Translations)
                .HasForeignKey(t => t.CategoryId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ProductTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Title).IsRequired().HasMaxLength(200);
            e.Property(t => t.Description).HasMaxLength(2000);
            e.Property(t => t.BadgeText).HasMaxLength(200);
            e.HasIndex(t => new { t.ProductId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.Product).WithMany(p => p.Translations)
                .HasForeignKey(t => t.ProductId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PortfolioItemTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Title).IsRequired().HasMaxLength(200);
            e.Property(t => t.Meta).HasMaxLength(500);
            e.Property(t => t.CategoryTag).HasMaxLength(100);
            e.HasIndex(t => new { t.PortfolioItemId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.PortfolioItem).WithMany(p => p.Translations)
                .HasForeignKey(t => t.PortfolioItemId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<GalleryItemTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Title).IsRequired().HasMaxLength(200);
            e.Property(t => t.AltText).HasMaxLength(300);
            e.HasIndex(t => new { t.GalleryItemId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.GalleryItem).WithMany(g => g.Translations)
                .HasForeignKey(t => t.GalleryItemId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SiteContentTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Value).IsRequired().HasMaxLength(4000);
            e.HasIndex(t => new { t.SiteContentId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.SiteContent).WithMany(c => c.Translations)
                .HasForeignKey(t => t.SiteContentId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<HeroStatTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Label).IsRequired().HasMaxLength(200);
            e.HasIndex(t => new { t.HeroStatId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.HeroStat).WithMany(h => h.Translations)
                .HasForeignKey(t => t.HeroStatId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SeoMetaTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Title).IsRequired().HasMaxLength(200);
            e.Property(t => t.Description).HasMaxLength(500);
            e.Property(t => t.Keywords).HasMaxLength(500);
            e.Property(t => t.OgTitle).HasMaxLength(200);
            e.Property(t => t.OgDescription).HasMaxLength(500);
            e.HasIndex(t => new { t.SeoMetaId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.SeoMeta).WithMany(s => s.Translations)
                .HasForeignKey(t => t.SeoMetaId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ContactInfoTranslation>(e =>
        {
            e.Property(t => t.LanguageCode).IsRequired().HasMaxLength(5);
            e.Property(t => t.Label).IsRequired().HasMaxLength(200);
            e.HasIndex(t => new { t.ContactInfoId, t.LanguageCode }).IsUnique();
            e.HasOne(t => t.ContactInfo).WithMany(c => c.Translations)
                .HasForeignKey(t => t.ContactInfoId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
