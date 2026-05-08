using FluentValidation;
using KanbanApi.Models;

namespace KanbanApi.Validators;

public class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
{
    public CreateTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required.")
            .MinimumLength(1).WithMessage("Title must be at least 1 character.")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(5000).WithMessage("Description must not exceed 5000 characters.")
            .When(x => x.Description is not null);

        RuleFor(x => x.AssigneeId)
            .MaximumLength(100).WithMessage("Assignee ID format is invalid.")
            .When(x => x.AssigneeId is not null);

        RuleFor(x => x.Priority)
            .Must(p => p == "low" || p == "medium" || p == "high")
            .WithMessage("Priority must be 'low', 'medium', or 'high'.")
            .When(x => x.Priority is not null);

        RuleFor(x => x.Tags)
            .Must(t => t!.Length <= 10).WithMessage("Maximum of 10 tags allowed.")
            .When(x => x.Tags is not null);

        RuleForEach(x => x.Tags)
            .MaximumLength(30).WithMessage("Each tag must not exceed 30 characters.")
            .When(x => x.Tags is not null);
    }
}

public class UpdateTaskRequestValidator : AbstractValidator<UpdateTaskRequest>
{
    public UpdateTaskRequestValidator()
    {
        RuleFor(x => x.Title)
            .MinimumLength(1).WithMessage("Title must be at least 1 character.")
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.")
            .When(x => x.Title is not null);

        RuleFor(x => x.Description)
            .MaximumLength(5000).WithMessage("Description must not exceed 5000 characters.")
            .When(x => x.Description is not null);

        RuleFor(x => x.AssigneeId)
            .MaximumLength(100).WithMessage("Assignee ID format is invalid.")
            .When(x => x.AssigneeId is not null);

        RuleFor(x => x.Priority)
            .Must(p => p == "low" || p == "medium" || p == "high")
            .WithMessage("Priority must be 'low', 'medium', or 'high'.")
            .When(x => x.Priority is not null);

        RuleFor(x => x.Tags)
            .Must(t => t!.Length <= 10).WithMessage("Maximum of 10 tags allowed.")
            .When(x => x.Tags is not null);

        RuleForEach(x => x.Tags)
            .MaximumLength(30).WithMessage("Each tag must not exceed 30 characters.")
            .When(x => x.Tags is not null);
    }
}

public class MoveTaskRequestValidator : AbstractValidator<MoveTaskRequest>
{
    public MoveTaskRequestValidator()
    {
        RuleFor(x => x.TargetColumnId)
            .NotEmpty().WithMessage("Target column ID is required.");

        RuleFor(x => x.Position)
            .GreaterThanOrEqualTo(0).WithMessage("Position must be 0 or greater.");
    }
}
