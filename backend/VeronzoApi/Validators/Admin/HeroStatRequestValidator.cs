using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class HeroStatRequestValidator : AbstractValidator<HeroStatRequest>
{
    public HeroStatRequestValidator()
    {
        RuleFor(x => x.Label).NotEmpty().WithMessage("Укажите подпись показателя").MaximumLength(100);
        RuleFor(x => x.Value).GreaterThanOrEqualTo(0);
        RuleFor(x => x.Suffix).MaximumLength(20);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
