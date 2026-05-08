using FluentValidation;
using KanbanApi.Models;

namespace KanbanApi.Infrastructure;

/// <summary>
/// Minimal API endpoint filter that runs FluentValidation validators
/// on the request body and returns 400 with ErrorResponse on failure.
/// </summary>
public class ValidationFilter<T> : IEndpointFilter where T : class
{
    private readonly IValidator<T> _validator;

    public ValidationFilter(IValidator<T> validator)
    {
        _validator = validator;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var argument = context.Arguments.FirstOrDefault(a => a is T) as T;

        if (argument is null)
        {
            return Results.BadRequest(new ErrorResponse("Request body is required."));
        }

        var result = await _validator.ValidateAsync(argument);

        if (!result.IsValid)
        {
            var errors = result.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(e => e.ErrorMessage).ToArray()
                );

            return Results.BadRequest(new ErrorResponse("Validation failed.", errors));
        }

        return await next(context);
    }
}

public static class ValidationFilterExtensions
{
    public static RouteHandlerBuilder WithValidation<T>(this RouteHandlerBuilder builder) where T : class
    {
        return builder.AddEndpointFilter<ValidationFilter<T>>();
    }
}
