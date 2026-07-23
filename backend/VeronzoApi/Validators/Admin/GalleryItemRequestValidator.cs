using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class GalleryItemRequestValidator : AbstractValidator<GalleryItemRequest>
{
    public GalleryItemRequestValidator()
    {
        RuleFor(x => x.Title).NotEmpty().WithMessage("Укажите название").MaximumLength(200);
        RuleFor(x => x.ImageUrl).MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
