using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class SocialLinkRequestValidator : AbstractValidator<SocialLinkRequest>
{
    public SocialLinkRequestValidator()
    {
        RuleFor(x => x.Platform).NotEmpty().WithMessage("Укажите платформу").MaximumLength(50);
        RuleFor(x => x.Url)
            .NotEmpty().WithMessage("Укажите ссылку")
            .MaximumLength(500)
            .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _)).WithMessage("Некорректный URL");
    }
}
