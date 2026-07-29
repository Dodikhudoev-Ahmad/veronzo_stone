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
        // Stage 20: real photos/copy for this direction still don't exist — visible
        // with placeholder content (reusing the doors photo) rather than invented
        // specifics. Replace Product.ImageUrl/Description and add real
        // PortfolioItem photos via the admin CMS once the owner supplies them.
        var windows = await SeedCategoryAsync(db, "windows", "Окна", 4, isVisible: true);

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
            "Оконные системы и алюминиевые фасадные конструкции для премиум-объектов.",
            // Placeholder photo (reused from "doors") pending real product photography.
            badgeText: "СКОРО В КАТАЛОГЕ →", imageUrl: "assets/images/catalog-doors", sortOrder: 1, isVisible: true);

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
        // Placeholder photo (reused from "Lumière") pending a real windows project photo.
        await SeedPortfolioItemAsync(db, "Клубный дом Lumière — оконные системы", "Панорамное остекление",
            categoryTag: "ОКНА", imageUrl: "assets/images/portfolio-lumiere", sortOrder: 7, isVisible: true, isFeatured: false);

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
            "Четыре направления, единый стандарт качества — от подбора материала до монтажа на объекте.");
        await SeedSiteContentAsync(db, "about.heading", "Одно ателье — от карьера до сданного объекта");
        await SeedSiteContentAsync(db, "about.paragraph1",
            "Мы объединяем четыре компетенции, которые обычно приходится собирать у разных подрядчиков: добычу и обработку натурального камня, столярное производство элитных дверей, оконные системы и инженерию лифтовых решений. Единый технадзор исключает стыковочные ошибки на объекте.");
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

    private readonly record struct AttributeOptionSeed(string Value, string Label);
    private readonly record struct AttributeDefinitionSeed(string Key, string Name, AttributeOptionSeed[] Options);

    // Idempotent per-category filter definitions for the premium catalog (Stage 23a).
    // Looked up by (CategoryId, Key) / (DefinitionId, Value) business key, same as
    // every other Seed*Async in this file — safe to call on every startup.
    public static async Task SeedProductAttributesAsync(AppDbContext db)
    {
        var stone = await db.Categories.FirstOrDefaultAsync(c => c.Slug == "stone");
        if (stone is not null)
        {
            await SeedCategoryAttributesAsync(db, stone.Id,
            [
                new("stone_type", "Тип камня",
                [
                    new("marble", "Мрамор"), new("granite", "Гранит"), new("onyx", "Оникс"),
                    new("travertine", "Травертин"), new("quartz", "Кварц")
                ]),
                new("color", "Цвет",
                [
                    new("white", "Белый"), new("black", "Чёрный"), new("gray", "Серый"),
                    new("beige", "Бежевый"), new("green", "Зелёный"), new("brown", "Коричневый")
                ]),
                new("finish", "Обработка",
                [
                    new("polished", "Полированный"), new("matte", "Матовый"), new("brushed", "Брашированный")
                ]),
                new("purpose", "Назначение",
                [
                    new("floor", "Пол"), new("wall", "Стены"), new("facade", "Фасад"),
                    new("countertop", "Столешница"), new("bathroom", "Санузел")
                ])
            ]);
        }

        var doors = await db.Categories.FirstOrDefaultAsync(c => c.Slug == "doors");
        if (doors is not null)
        {
            await SeedCategoryAttributesAsync(db, doors.Id,
            [
                new("door_type", "Тип двери",
                [
                    new("hidden", "Скрытая"), new("hinged", "Распашная"),
                    new("sliding", "Раздвижная"), new("entrance", "Входная")
                ]),
                new("material", "Материал",
                [
                    new("veneer", "Шпон"), new("solid_wood", "Массив"),
                    new("glass", "Стекло"), new("metal", "Металл")
                ]),
                new("finish", "Отделка",
                [
                    new("matte", "Матовая"), new("glossy", "Глянцевая"), new("textured", "Текстурная")
                ]),
                new("purpose", "Назначение",
                [
                    new("apartment", "Квартира"), new("house", "Дом"),
                    new("office", "Офис"), new("hotel", "Отель")
                ])
            ]);
        }

        var lifts = await db.Categories.FirstOrDefaultAsync(c => c.Slug == "lifts");
        if (lifts is not null)
        {
            await SeedCategoryAttributesAsync(db, lifts.Id,
            [
                new("lift_type", "Тип лифта",
                [
                    new("passenger", "Пассажирский"), new("panoramic", "Панорамный"),
                    new("home", "Домашний"), new("freight", "Грузовой")
                ]),
                new("capacity", "Вместимость",
                [
                    new("2_4", "2–4"), new("5_8", "5–8"), new("9_plus", "9+")
                ]),
                new("cabin_finish", "Отделка кабины",
                [
                    new("stone", "Камень"), new("metal", "Металл"),
                    new("glass", "Стекло"), new("wood", "Дерево")
                ]),
                new("purpose", "Назначение",
                [
                    new("residential", "Жилой"), new("commercial", "Коммерческий"),
                    new("hotel", "Отель"), new("private_house", "Частный дом")
                ])
            ]);
        }

        var windows = await db.Categories.FirstOrDefaultAsync(c => c.Slug == "windows");
        if (windows is not null)
        {
            await SeedCategoryAttributesAsync(db, windows.Id,
            [
                new("system_type", "Тип системы",
                [
                    new("panoramic", "Панорамная"), new("sliding", "Раздвижная"),
                    new("tilt_turn", "Поворотно-откидная"), new("facade", "Фасадная")
                ]),
                new("profile_material", "Материал профиля",
                [
                    new("aluminum", "Алюминий"), new("pvc", "ПВХ"), new("wood", "Дерево")
                ]),
                new("color", "Цвет",
                [
                    new("black", "Чёрный"), new("white", "Белый"),
                    new("gray", "Серый"), new("brown", "Коричневый")
                ]),
                new("glazing", "Остекление",
                [
                    new("double", "Двойной"), new("triple", "Тройной"),
                    new("energy_saving", "Энергосберегающий"), new("tempered", "Закалённый")
                ])
            ]);
        }
    }

    private static async Task SeedCategoryAttributesAsync(AppDbContext db, int categoryId, AttributeDefinitionSeed[] definitions)
    {
        var sortOrder = 1;
        foreach (var def in definitions)
        {
            var definition = await SeedProductAttributeDefinitionAsync(
                db, categoryId, def.Key, def.Name, sortOrder++, isFilterable: true, isVisible: true);

            var optionSortOrder = 1;
            foreach (var option in def.Options)
            {
                await SeedProductAttributeOptionAsync(db, definition.Id, option.Value, option.Label, optionSortOrder++);
            }
        }
    }

    private static async Task<ProductAttributeDefinition> SeedProductAttributeDefinitionAsync(
        AppDbContext db, int categoryId, string key, string name, int sortOrder, bool isFilterable, bool isVisible)
    {
        var existing = await db.ProductAttributeDefinitions.FirstOrDefaultAsync(d => d.CategoryId == categoryId && d.Key == key);
        if (existing is not null)
        {
            return existing;
        }

        var definition = new ProductAttributeDefinition
        {
            CategoryId = categoryId,
            Key = key,
            Name = name,
            SortOrder = sortOrder,
            IsFilterable = isFilterable,
            IsVisible = isVisible
        };
        db.ProductAttributeDefinitions.Add(definition);
        await db.SaveChangesAsync();
        return definition;
    }

    private static async Task SeedProductAttributeOptionAsync(AppDbContext db, int definitionId, string value, string label, int sortOrder)
    {
        var exists = await db.ProductAttributeOptions.AnyAsync(o => o.DefinitionId == definitionId && o.Value == value);
        if (exists)
        {
            return;
        }

        db.ProductAttributeOptions.Add(new ProductAttributeOption
        {
            DefinitionId = definitionId,
            Value = value,
            Label = label,
            SortOrder = sortOrder,
            IsVisible = true
        });
        await db.SaveChangesAsync();
    }

    // Existing content is authored in Russian, so every row that doesn't yet have a
    // "ru" translation gets one created from its current field values. Never touches
    // a "ru" translation that already exists (an admin may have edited it since), and
    // never invents tg/en/fa content. Safe to call on every startup: each backfill
    // does a single existence query per entity type, then inserts only what's
    // missing — no network calls, no data loss, idempotent on repeated runs.
    public static async Task SeedRussianTranslationsAsync(AppDbContext db)
    {
        await BackfillCategoryTranslationsAsync(db);
        await BackfillProductTranslationsAsync(db);
        await BackfillPortfolioItemTranslationsAsync(db);
        await BackfillGalleryItemTranslationsAsync(db);
        await BackfillSiteContentTranslationsAsync(db);
        await BackfillHeroStatTranslationsAsync(db);
        await BackfillSeoMetaTranslationsAsync(db);
        await BackfillContactInfoTranslationsAsync(db);
        await BackfillProductAttributeDefinitionTranslationsAsync(db);
        await BackfillProductAttributeOptionTranslationsAsync(db);
    }

    private static async Task BackfillCategoryTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.CategoryTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.CategoryId)
            .ToListAsync();

        var missing = await db.Categories.Where(c => !translatedIds.Contains(c.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var category in missing)
        {
            db.CategoryTranslations.Add(new CategoryTranslation
            {
                CategoryId = category.Id,
                LanguageCode = SupportedLanguages.Default,
                Name = category.Name
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillProductTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.ProductTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.ProductId)
            .ToListAsync();

        var missing = await db.Products.Where(p => !translatedIds.Contains(p.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var product in missing)
        {
            db.ProductTranslations.Add(new ProductTranslation
            {
                ProductId = product.Id,
                LanguageCode = SupportedLanguages.Default,
                Title = product.Title,
                Description = product.Description,
                BadgeText = product.BadgeText
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillPortfolioItemTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.PortfolioItemTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.PortfolioItemId)
            .ToListAsync();

        var missing = await db.PortfolioItems.Where(p => !translatedIds.Contains(p.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var item in missing)
        {
            db.PortfolioItemTranslations.Add(new PortfolioItemTranslation
            {
                PortfolioItemId = item.Id,
                LanguageCode = SupportedLanguages.Default,
                Title = item.Title,
                Meta = item.Meta,
                CategoryTag = item.CategoryTag
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillGalleryItemTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.GalleryItemTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.GalleryItemId)
            .ToListAsync();

        var missing = await db.GalleryItems.Where(g => !translatedIds.Contains(g.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var item in missing)
        {
            // AltText has no legacy source field on GalleryItem — left null rather
            // than invented.
            db.GalleryItemTranslations.Add(new GalleryItemTranslation
            {
                GalleryItemId = item.Id,
                LanguageCode = SupportedLanguages.Default,
                Title = item.Title
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillSiteContentTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.SiteContentTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.SiteContentId)
            .ToListAsync();

        var missing = await db.SiteContents.Where(c => !translatedIds.Contains(c.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var content in missing)
        {
            db.SiteContentTranslations.Add(new SiteContentTranslation
            {
                SiteContentId = content.Id,
                LanguageCode = SupportedLanguages.Default,
                Value = content.Value
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillHeroStatTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.HeroStatTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.HeroStatId)
            .ToListAsync();

        var missing = await db.HeroStats.Where(h => !translatedIds.Contains(h.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var stat in missing)
        {
            db.HeroStatTranslations.Add(new HeroStatTranslation
            {
                HeroStatId = stat.Id,
                LanguageCode = SupportedLanguages.Default,
                Label = stat.Label
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillSeoMetaTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.SeoMetaTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.SeoMetaId)
            .ToListAsync();

        var missing = await db.SeoMetas.Where(s => !translatedIds.Contains(s.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var seo in missing)
        {
            // Keywords/OgTitle/OgDescription have no legacy source field — left null
            // rather than invented.
            db.SeoMetaTranslations.Add(new SeoMetaTranslation
            {
                SeoMetaId = seo.Id,
                LanguageCode = SupportedLanguages.Default,
                Title = seo.Title,
                Description = seo.Description
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillContactInfoTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.ContactInfoTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.ContactInfoId)
            .ToListAsync();

        var missing = await db.ContactInfos.Where(c => !translatedIds.Contains(c.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var contact in missing)
        {
            db.ContactInfoTranslations.Add(new ContactInfoTranslation
            {
                ContactInfoId = contact.Id,
                LanguageCode = SupportedLanguages.Default,
                Label = contact.Label
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillProductAttributeDefinitionTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.ProductAttributeDefinitionTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.ProductAttributeDefinitionId)
            .ToListAsync();

        var missing = await db.ProductAttributeDefinitions.Where(d => !translatedIds.Contains(d.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var definition in missing)
        {
            db.ProductAttributeDefinitionTranslations.Add(new ProductAttributeDefinitionTranslation
            {
                ProductAttributeDefinitionId = definition.Id,
                LanguageCode = SupportedLanguages.Default,
                Name = definition.Name
            });
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillProductAttributeOptionTranslationsAsync(AppDbContext db)
    {
        var translatedIds = await db.ProductAttributeOptionTranslations
            .Where(t => t.LanguageCode == SupportedLanguages.Default)
            .Select(t => t.ProductAttributeOptionId)
            .ToListAsync();

        var missing = await db.ProductAttributeOptions.Where(o => !translatedIds.Contains(o.Id)).ToListAsync();
        if (missing.Count == 0) return;

        foreach (var option in missing)
        {
            db.ProductAttributeOptionTranslations.Add(new ProductAttributeOptionTranslation
            {
                ProductAttributeOptionId = option.Id,
                LanguageCode = SupportedLanguages.Default,
                Label = option.Label
            });
        }
        await db.SaveChangesAsync();
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
