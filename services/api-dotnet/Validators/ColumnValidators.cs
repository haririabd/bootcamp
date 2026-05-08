using FluentValidation;
using KanbanApi.Models;

namespace KanbanApi.Validators;

public class CreateColumnRequestValidator : AbstractValidator<CreateColumnRequest>
{
    public CreateColumnRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MinimumLength(1).WithMessage("Title must be at least 1 character.")
            .MaximumLength(100).WithMessage("Title must not exceed 100 characters.");
    }
}

public class UpdateColumnRequestValidator : AbstractValidator<UpdateColumnRequest>
{
    public UpdateColumnRequestValidator()
    {
        RuleFor(x => x.Title)
            .MinimumLength(1).WithMessage("Title must be at least 1 character.")
            .MaximumLength(100).WithMessage("Title must not exceed 100 characters.")
            .When(x => x.Title is not null);

        // Position is now nullable — only validate when provided
        RuleFor(x => x.Position!.Value)
            .GreaterThanOrEqualTo(0).WithMessage("Position must be 0 or greater.")
            .When(x => x.Position.HasValue);
    }
}
