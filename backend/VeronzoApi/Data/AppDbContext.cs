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
    }
}
