using Microsoft.EntityFrameworkCore;
using VeronzoApi.Data;
using VeronzoApi.Models;

namespace VeronzoApi.Endpoints.Admin;

// Called from each entity's existing Create/Update admin endpoints so the "ru"
// translation always mirrors whatever the current (language-unaware) admin UI
// writes to the legacy fields — no changes required in React Admin for this
// to keep working. Never touches translation-only fields that have no legacy
// source (e.g. GalleryItemTranslation.AltText); those are left for a future
// translation-aware UI to fill in.
internal static class AdminTranslationSync
{
    public static void SyncCategory(Category category, bool isNew)
    {
        if (isNew)
        {
            category.Translations.Add(new CategoryTranslation { LanguageCode = SupportedLanguages.Default, Name = category.Name });
            return;
        }

        var translation = category.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            category.Translations.Add(new CategoryTranslation { LanguageCode = SupportedLanguages.Default, Name = category.Name });
        }
        else
        {
            translation.Name = category.Name;
        }
    }

    public static async Task SyncCategoryAsync(AppDbContext db, Category category, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(category).Collection(c => c.Translations).LoadAsync(cancellationToken);
        }
        SyncCategory(category, isNew);
    }

    public static async Task SyncProductAsync(AppDbContext db, Product product, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(product).Collection(p => p.Translations).LoadAsync(cancellationToken);
        }

        var translation = isNew ? null : product.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            product.Translations.Add(new ProductTranslation
            {
                LanguageCode = SupportedLanguages.Default,
                Title = product.Title,
                Description = product.Description,
                BadgeText = product.BadgeText
            });
        }
        else
        {
            translation.Title = product.Title;
            translation.Description = product.Description;
            translation.BadgeText = product.BadgeText;
        }
    }

    public static async Task SyncPortfolioItemAsync(AppDbContext db, PortfolioItem item, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(item).Collection(i => i.Translations).LoadAsync(cancellationToken);
        }

        var translation = isNew ? null : item.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            item.Translations.Add(new PortfolioItemTranslation
            {
                LanguageCode = SupportedLanguages.Default,
                Title = item.Title,
                Meta = item.Meta,
                CategoryTag = item.CategoryTag
            });
        }
        else
        {
            translation.Title = item.Title;
            translation.Meta = item.Meta;
            translation.CategoryTag = item.CategoryTag;
        }
    }

    public static async Task SyncGalleryItemAsync(AppDbContext db, GalleryItem item, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(item).Collection(i => i.Translations).LoadAsync(cancellationToken);
        }

        var translation = isNew ? null : item.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            item.Translations.Add(new GalleryItemTranslation { LanguageCode = SupportedLanguages.Default, Title = item.Title });
        }
        else
        {
            translation.Title = item.Title;
        }
    }

    public static async Task SyncSiteContentAsync(AppDbContext db, SiteContent content, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(content).Collection(c => c.Translations).LoadAsync(cancellationToken);
        }

        var translation = isNew ? null : content.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            content.Translations.Add(new SiteContentTranslation { LanguageCode = SupportedLanguages.Default, Value = content.Value });
        }
        else
        {
            translation.Value = content.Value;
        }
    }

    public static async Task SyncHeroStatAsync(AppDbContext db, HeroStat stat, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(stat).Collection(s => s.Translations).LoadAsync(cancellationToken);
        }

        var translation = isNew ? null : stat.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            stat.Translations.Add(new HeroStatTranslation { LanguageCode = SupportedLanguages.Default, Label = stat.Label });
        }
        else
        {
            translation.Label = stat.Label;
        }
    }

    public static async Task SyncSeoMetaAsync(AppDbContext db, SeoMeta seo, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(seo).Collection(s => s.Translations).LoadAsync(cancellationToken);
        }

        var translation = isNew ? null : seo.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            seo.Translations.Add(new SeoMetaTranslation { LanguageCode = SupportedLanguages.Default, Title = seo.Title, Description = seo.Description });
        }
        else
        {
            translation.Title = seo.Title;
            translation.Description = seo.Description;
        }
    }

    public static async Task SyncProductAttributeDefinitionAsync(
        AppDbContext db, ProductAttributeDefinition definition, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(definition).Collection(d => d.Translations).LoadAsync(cancellationToken);
        }

        var translation = isNew ? null : definition.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            definition.Translations.Add(new ProductAttributeDefinitionTranslation { LanguageCode = SupportedLanguages.Default, Name = definition.Name });
        }
        else
        {
            translation.Name = definition.Name;
        }
    }

    public static async Task SyncProductAttributeOptionAsync(
        AppDbContext db, ProductAttributeOption option, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(option).Collection(o => o.Translations).LoadAsync(cancellationToken);
        }

        var translation = isNew ? null : option.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            option.Translations.Add(new ProductAttributeOptionTranslation { LanguageCode = SupportedLanguages.Default, Label = option.Label });
        }
        else
        {
            translation.Label = option.Label;
        }
    }

    public static async Task SyncContactInfoAsync(AppDbContext db, ContactInfo contact, bool isNew, CancellationToken cancellationToken)
    {
        if (!isNew)
        {
            await db.Entry(contact).Collection(c => c.Translations).LoadAsync(cancellationToken);
        }

        var translation = isNew ? null : contact.Translations.FirstOrDefault(t => t.LanguageCode == SupportedLanguages.Default);
        if (translation is null)
        {
            contact.Translations.Add(new ContactInfoTranslation { LanguageCode = SupportedLanguages.Default, Label = contact.Label });
        }
        else
        {
            translation.Label = contact.Label;
        }
    }
}
