using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class CategoryRequestValidator : AbstractValidator<CategoryRequest>
{
    public CategoryRequestValidator()
    {
        RuleFor(x => x.Slug)
            .NotEmpty().WithMessage("Укажите slug категории")
            .MaximumLength(100)
            .Matches(@"^[a-z0-9]+(-[a-z0-9]+)*$").WithMessage("Slug может содержать только строчные латинские буквы, цифры и дефисы");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Укажите название категории")
            .MaximumLength(200);

        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
