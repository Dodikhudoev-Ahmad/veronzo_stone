using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class ContactInfoRequestValidator : AbstractValidator<ContactInfoRequest>
{
    public ContactInfoRequestValidator()
    {
        RuleFor(x => x.Label).NotEmpty().WithMessage("Укажите подпись").MaximumLength(100);
        RuleFor(x => x.Value).NotEmpty().WithMessage("Укажите значение").MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
