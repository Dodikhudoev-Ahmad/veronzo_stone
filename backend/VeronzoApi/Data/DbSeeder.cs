using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using VeronzoApi.Models;

namespace VeronzoApi.Data;

public static class DbSeeder
{
    // Creates the first admin account, but only from explicit configuration — never
    // from a hardcoded default — so the app can't accidentally ship a known password.
    // Re-running this after an admin already exists is a no-op: it neither recreates
    // nor resets the existing account's password.
    public static async Task SeedAdminUserAsync(
        AppDbContext db, IPasswordHasher<AdminUser> passwordHasher, IConfiguration configuration, ILogger logger)
    {
        if (await db.AdminUsers.AnyAsync())
        {
            return;
        }

        var email = configuration["DEFAULT_ADMIN_EMAIL"];
        var password = configuration["DEFAULT_ADMIN_PASSWORD"];

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning(
                "No admin account exists and DEFAULT_ADMIN_EMAIL/DEFAULT_ADMIN_PASSWORD are not set — " +
                "skipping admin creation. Set both environment variables and restart to create the first administrator.");
            return;
        }

        var trimmedEmail = email.Trim();
        var admin = new AdminUser
        {
            Email = trimmedEmail,
            NormalizedEmail = trimmedEmail.ToUpperInvariant(),
            Role = "Admin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        admin.PasswordHash = passwordHasher.HashPassword(admin, password);

        db.AdminUsers.Add(admin);
        await db.SaveChangesAsync();
        logger.LogInformation("Created initial admin account for {Email}", admin.Email);
    }

    // Seeds catalog/content tables with the copy currently hardcoded in index.html,
    // so the managed content starts out identical to what is live today.
    //
    // Each row is looked up by a stable business key and inserted only if missing —
    // never updated — so re-running this on every startup neither creates duplicates
    // nor clobbers edits an admin has since made through the CMS.
    public static async Task SeedCatalogContentAsync(AppDbContext db)
    {
        var stone = await SeedCategoryAsync(db, "stone", "Камень", 1, isVisible: true);
        var doors = await SeedCategoryAsync(db, "doors", "Двери", 2, isVisible: true);
        var lifts = await SeedCategoryAsync(db, "lifts", "Лифты", 3, isVisible: true);
        // No real copy/photos exist for this direction yet — kept hidden until the
        // owner supplies them and an admin flips IsVisible on.
        var windows = await SeedCategoryAsync(db, "windows", "Окна", 4, isVisible: false);

        await SeedProductAsync(db, stone.Id, "Камень",
            "Мрамор, оникс, травертин и гранит — облицовка, полы, порталы, фасады.",
            badgeText: "60+ ВИДОВ В НАЛИЧИИ →", imageUrl: "assets/images/catalog-stone", sortOrder: 1, isVisible: true);
        await SeedProductAsync(db, doors.Id, "Двери",
            "Скрытые и распашные системы из шпона и массива, высота до потолка.",
            badgeText: "СТОЛЯРНОЕ ПРОИЗВОДСТВО →", imageUrl: "assets/images/catalog-doors", sortOrder: 1, isVisible: true);
        await SeedProductAsync(db, lifts.Id, "Лифты",
            "Панорамные и представительские кабины в едином материале с интерьером.",
            badgeText: "ОТДЕЛКА КАБИН →", imageUrl: "assets/images/catalog-lifts", sortOrder: 1, isVisible: true);
        await SeedProductAsync(db, windows.Id, "Окна",
            "TODO: реальные данные — описание направления «Окна» ожидает предоставления заказчиком.",
            // No real badge copy or photo exists yet — left null rather than invented.
            badgeText: null, imageUrl: null, sortOrder: 1, isVisible: false);

        await SeedPortfolioItemAsync(db, "Резиденция «Остоженка»", "Мрамор Calacatta · частный дом · 2025",
            categoryTag: "КАМЕНЬ", imageUrl: "assets/images/portfolio-ostozhenka", sortOrder: 1, isVisible: true, isFeatured: true);
        await SeedPortfolioItemAsync(db, "Клубный дом Lumière", "Лобби · двери · лифты",
            categoryTag: null, imageUrl: "assets/images/portfolio-lumiere", sortOrder: 2, isVisible: true, isFeatured: false);
        await SeedPortfolioItemAsync(db, "Пентхаус на Патриарших", "Оникс с подсветкой",
            categoryTag: null, imageUrl: "assets/images/portfolio-patriarshie", sortOrder: 3, isVisible: true, isFeatured: false);
        await SeedPortfolioItemAsync(db, "Бутик-отель «Гранат»", "48 порталов из шпона",
            categoryTag: null, imageUrl: "assets/images/portfolio-granat", sortOrder: 4, isVisible: true, isFeatured: false);
        await SeedPortfolioItemAsync(db, "Бизнес-центр Meridian", "Панорамные лифты",
            categoryTag: null, imageUrl: "assets/images/portfolio-meridian", sortOrder: 5, isVisible: true, isFeatured: false);
        await SeedPortfolioItemAsync(db, "Вилла на Рублёвке", "Травертин · комплекс",
            categoryTag: null, imageUrl: "assets/images/portfolio-rublevka", sortOrder: 6, isVisible: true, isFeatured: false);

        await SeedHeroStatAsync(db, "лет на рынке", 18, "", 1);
        await SeedHeroStatAsync(db, "объектов сдано", 340, "+", 2);
        await SeedHeroStatAsync(db, "видов камня", 60, "", 3);

        // Targets copied verbatim from index.html — these are placeholders in the
        // live site, not confirmed real accounts.
        await SeedSocialLinkAsync(db, "whatsapp", "https://wa.me/70000000000", isVisible: true);
        await SeedSocialLinkAsync(db, "telegram", "https://t.me/veronzo", isVisible: true);
        await SeedSocialLinkAsync(db, "instagram", "https://instagram.com/veronzo", isVisible: true);

        await SeedContactInfoAsync(db, "Шоурум", "Москва, Кутузовский проспект, 12", 1);
        await SeedContactInfoAsync(db, "Телефон", "+7 495 000-00-00", 2);
        await SeedContactInfoAsync(db, "Почта", "project@veronzo.ru", 3);

        await SeedSiteContentAsync(db, "hero.eyebrow", "Ателье премиум-отделки");
        await SeedSiteContentAsync(db, "hero.title", "Материя выдающихся интерьеров");
        await SeedSiteContentAsync(db, "hero.lede",
            "Натуральный камень, элитные двери и лифтовые решения под единым технадзором — для архитекторов, дизайнеров и премиум-застройщиков.");
        await SeedSiteContentAsync(db, "hero.imageTag", "CALACATTA · SIGNATURE");
        await SeedSiteContentAsync(db, "catalog.sectionNote",
            "Три направления, единый стандарт качества — от подбора материала до монтажа на объекте.");
        await SeedSiteContentAsync(db, "about.heading", "Одно ателье — от карьера до сданного объекта");
        await SeedSiteContentAsync(db, "about.paragraph1",
            "Мы объединяем три компетенции, которые обычно приходится собирать у разных подрядчиков: добычу и обработку натурального камня, столярное производство элитных дверей и инженерию лифтовых решений. Единый технадзор исключает стыковочные ошибки на объекте.");
        await SeedSiteContentAsync(db, "about.paragraph2",
            "С проектом работает выделенная команда: архитектор проекта, технолог по камню и инженер. Мы говорим на языке чертежей и спецификаций.");
        await SeedSiteContentAsync(db, "why.heading", "Партнёр, на которого можно опереться в проекте");
        await SeedSiteContentAsync(db, "contacts.heading", "Обсудим ваш проект");
        await SeedSiteContentAsync(db, "contacts.paragraph",
            "Оставьте заявку — архитектор проекта свяжется с вами в течение рабочего дня, чтобы обсудить материалы, сроки и смету.");
        await SeedSiteContentAsync(db, "footer.tagline",
            "Натуральный камень, элитные двери и лифтовые решения для архитектуры высшего уровня.");

        await SeedSeoMetaAsync(db, "home",
            "Veronzo — натуральный камень, элитные двери и лифты",
            "Натуральный камень, элитные двери и лифтовые решения под единым технадзором — для архитекторов, дизайнеров и премиум-застройщиков.",
            "assets/images/hero-calacatta.webp");
    }

    private static async Task<Category> SeedCategoryAsync(AppDbContext db, string slug, string name, int sortOrder, bool isVisible)
    {
        var existing = await db.Categories.FirstOrDefaultAsync(c => c.Slug == slug);
        if (existing is not null)
        {
            return existing;
        }

        var category = new Category { Slug = slug, Name = name, SortOrder = sortOrder, IsVisible = isVisible };
        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category;
    }

    private static async Task SeedProductAsync(
        AppDbContext db, int categoryId, string title, string? description,
        string? badgeText, string? imageUrl, int sortOrder, bool isVisible)
    {
        var exists = await db.Products.AnyAsync(p => p.CategoryId == categoryId && p.Title == title);
        if (exists)
        {
            return;
        }

        db.Products.Add(new Product
        {
            CategoryId = categoryId,
            Title = title,
            Description = description,
            BadgeText = badgeText,
            ImageUrl = imageUrl,
            SortOrder = sortOrder,
            IsVisible = isVisible
        });
        await db.SaveChangesAsync();
    }

    private static async Task SeedPortfolioItemAsync(
        AppDbContext db, string title, string? meta, string? categoryTag,
        string? imageUrl, int sortOrder, bool isVisible, bool isFeatured)
    {
        var exists = await db.PortfolioItems.AnyAsync(p => p.Title == title);
        if (exists)
        {
            return;
        }

        db.PortfolioItems.Add(new PortfolioItem
        {
            Title = title,
            Meta = meta,
            CategoryTag = categoryTag,
            ImageUrl = imageUrl,
            SortOrder = sortOrder,
            IsVisible = isVisible,
            IsFeatured = isFeatured
        });
        await db.SaveChangesAsync();
    }

    private static async Task SeedHeroStatAsync(AppDbContext db, string label, int value, string? suffix, int sortOrder)
    {
        var exists = await db.HeroStats.AnyAsync(h => h.Label == label);
        if (exists)
        {
            return;
        }

        db.HeroStats.Add(new HeroStat { Label = label, Value = value, Suffix = suffix, SortOrder = sortOrder, IsVisible = true });
        await db.SaveChangesAsync();
    }

    private static async Task SeedSocialLinkAsync(AppDbContext db, string platform, string url, bool isVisible)
    {
        var exists = await db.SocialLinks.AnyAsync(s => s.Platform == platform);
        if (exists)
        {
            return;
        }

        db.SocialLinks.Add(new SocialLink { Platform = platform, Url = url, IsVisible = isVisible });
        await db.SaveChangesAsync();
    }

    private static async Task SeedContactInfoAsync(AppDbContext db, string label, string value, int sortOrder)
    {
        var exists = await db.ContactInfos.AnyAsync(c => c.Label == label);
        if (exists)
        {
            return;
        }

        db.ContactInfos.Add(new ContactInfo { Label = label, Value = value, SortOrder = sortOrder });
        await db.SaveChangesAsync();
    }

    private static async Task SeedSiteContentAsync(AppDbContext db, string key, string value)
    {
        var exists = await db.SiteContents.AnyAsync(c => c.Key == key);
        if (exists)
        {
            return;
        }

        db.SiteContents.Add(new SiteContent { Key = key, Value = value });
        await db.SaveChangesAsync();
    }

    private static async Task SeedSeoMetaAsync(AppDbContext db, string pageKey, string title, string? description, string? ogImageUrl)
    {
        var exists = await db.SeoMetas.AnyAsync(s => s.PageKey == pageKey);
        if (exists)
        {
            return;
        }

        db.SeoMetas.Add(new SeoMeta { PageKey = pageKey, Title = title, Description = description, OgImageUrl = ogImageUrl });
        await db.SaveChangesAsync();
    }
}
