using dev.Application.Common.Models;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Commands;

public record AddVariableToEnvironmentCommand : IRequest<Result<Unit>>
{
    public required AddVariableToEnvironmentRequest EnvironmentRequest { get; init; }
}


public class AddVariableToEnvironmentCommandHandler : IRequestHandler<AddVariableToEnvironmentCommand, Result<Unit>>
{
    
    private readonly IEnvironmentService _environmentService;

    public AddVariableToEnvironmentCommandHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<Unit>> Handle(AddVariableToEnvironmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
             await _environmentService.AddVariableToEnvironmentAsync(request.EnvironmentRequest);
             return Result<Unit>.Success(Unit.Value);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to add variable to environment: {ex.Message}");
        }
    }
}