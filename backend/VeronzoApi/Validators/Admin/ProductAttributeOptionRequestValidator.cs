using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class ProductAttributeOptionRequestValidator : AbstractValidator<ProductAttributeOptionRequest>
{
    public ProductAttributeOptionRequestValidator()
    {
        RuleFor(x => x.DefinitionId).GreaterThan(0).WithMessage("Укажите DefinitionId");
        RuleFor(x => x.Value).NotEmpty().WithMessage("Укажите Value")
            .MaximumLength(100)
            .Matches("^[a-z0-9_]+$").WithMessage("Value может содержать только строчные латинские буквы, цифры и подчёркивание");
        RuleFor(x => x.Label).NotEmpty().WithMessage("Укажите Label").MaximumLength(200);
        RuleFor(x => x.SortOrder).GreaterThanOrEqualTo(0);
    }
}
