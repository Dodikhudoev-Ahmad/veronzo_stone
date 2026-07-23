using Microsoft.EntityFrameworkCore;
using VeronzoApi.Models;

namespace VeronzoApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<PortfolioItem> PortfolioItems => Set<PortfolioItem>();
    public DbSet<SiteContent> SiteContents => Set<SiteContent>();
    public DbSet<HeroStat> HeroStats => Set<HeroStat>();
    public DbSet<SocialLink> SocialLinks => Set<SocialLink>();
    public DbSet<ContactInfo> ContactInfos => Set<ContactInfo>();
    public DbSet<SeoMeta> SeoMetas => Set<SeoMeta>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>().HasIndex(c => c.Slug).IsUnique();
        modelBuilder.Entity<SiteContent>().HasIndex(c => c.Key).IsUnique();
        modelBuilder.Entity<SeoMeta>().HasIndex(s => s.PageKey).IsUnique();
    }
}
