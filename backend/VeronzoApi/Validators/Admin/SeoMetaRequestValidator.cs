using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class SeoMetaRequestValidator : AbstractValidator<SeoMetaRequest>
{
    public SeoMetaRequestValidator()
    {
        RuleFor(x => x.PageKey).NotEmpty().WithMessage("Укажите PageKey").MaximumLength(100);
        RuleFor(x => x.Title).NotEmpty().WithMessage("Укажите title").MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.OgImageUrl).MaximumLength(500);
    }
}
