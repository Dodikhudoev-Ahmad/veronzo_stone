using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class ProductAttributeDefinitionRequestValidator : AbstractValidator<ProductAttributeDefinitionRequest>
{
    public ProductAttributeDefinitionRequestValidator()
    {
        RuleFor(x => x.CategoryId).GreaterThan(0).WithMessage("Укажите CategoryId");
        RuleFor(x => x.Key).NotEmpty().WithMessage("Укажите Key")
            .MaximumLength(100)
            .Matches("^[a-z0-9_]+$").WithMessage("Key может содержать только строчные латинские буквы, цифры и подчёркивание");
        RuleFor(x => x.Name).NotEmpty().WithMessage("Укажите Name").MaximumLength(200);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
