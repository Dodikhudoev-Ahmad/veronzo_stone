using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class SiteContentRequestValidator : AbstractValidator<SiteContentRequest>
{
    public SiteContentRequestValidator()
    {
        RuleFor(x => x.Key).NotEmpty().WithMessage("Укажите ключ контента").MaximumLength(150);
        RuleFor(x => x.Value).NotEmpty().WithMessage("Укажите значение").MaximumLength(10000);
    }
}
