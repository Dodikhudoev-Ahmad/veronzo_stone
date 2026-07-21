using FluentValidation;
using VeronzoApi.Models;

namespace VeronzoApi.Validators;

public class ContactRequestValidator : AbstractValidator<ContactRequestDto>
{
    public ContactRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Укажите имя")
            .MaximumLength(100);

        RuleFor(x => x.Contact)
            .NotEmpty().WithMessage("Укажите телефон для связи")
            .MaximumLength(50)
            .Matches(@"^[\d\s\+\-\(\)]{5,50}$").WithMessage("Некорректный формат телефона");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Некорректный email")
            .When(x => !string.IsNullOrWhiteSpace(x.Email));

        RuleFor(x => x.Type)
            .MaximumLength(100);

        RuleFor(x => x.Message)
            .MaximumLength(2000);
    }
}
