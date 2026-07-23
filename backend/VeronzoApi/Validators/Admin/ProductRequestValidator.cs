using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class ProductRequestValidator : AbstractValidator<ProductRequest>
{
    public ProductRequestValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Укажите CategoryId");
        RuleFor(x => x.Title).NotEmpty().WithMessage("Укажите название товара").MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.BadgeText).MaximumLength(100);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
