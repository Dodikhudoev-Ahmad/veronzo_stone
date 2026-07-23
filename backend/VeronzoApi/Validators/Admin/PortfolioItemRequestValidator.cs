using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class PortfolioItemRequestValidator : AbstractValidator<PortfolioItemRequest>
{
    public PortfolioItemRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("Укажите название объекта").MaximumLength(200);
        RuleFor(x => x.Meta).MaximumLength(300);
        RuleFor(x => x.CategoryTag).MaximumLength(50);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
