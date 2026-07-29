using FluentValidation;
using VeronzoApi.Models.Admin;

namespace VeronzoApi.Validators.Admin;

public class ProductAttributeValueRequestValidator : AbstractValidator<ProductAttributeValueRequest>
{
    public ProductAttributeValueRequestValidator()
    {
        RuleFor(x => x.ProductId).GreaterThan(0).WithMessage("Укажите ProductId");
        RuleFor(x => x.DefinitionId).GreaterThan(0).WithMessage("Укажите DefinitionId");
        RuleFor(x => x.TextValue).MaximumLength(500);
        RuleFor(x => x)
            .Must(x => (x.OptionId is not null) ^ (x.TextValue is not null))
            .WithMessage("Укажите либо OptionId, либо TextValue (но не оба и не ни одного)");
    }
}
