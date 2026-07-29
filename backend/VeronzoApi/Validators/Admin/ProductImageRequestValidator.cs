using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class ProductImageRequestValidator : AbstractValidator<ProductImageRequest>
{
    public ProductImageRequestValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("Укажите ProductId");
        RuleFor(x => x.ImageUrl).NotEmpty().WithMessage("Укажите URL изображения").MaximumLength(500);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
