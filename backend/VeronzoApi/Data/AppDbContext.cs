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

    public DbSet<CategoryTranslation> CategoryTranslations => Set<CategoryTranslation>();
    public DbSet<ProductTranslation> ProductTranslations => Set<ProductTranslation>();
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
