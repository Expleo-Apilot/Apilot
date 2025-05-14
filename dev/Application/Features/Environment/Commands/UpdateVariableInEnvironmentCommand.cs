using dev.Application.Common.Models;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Commands;

public record UpdateVariableInEnvironmentCommand : IRequest<Result<Unit>>
{
    public required UpdateVariableInEnvironmentRequest EnvironmentRequest { get; init; }
}


public class UpdateVariableInEnvironmentCommandHandler : IRequestHandler<UpdateVariableInEnvironmentCommand, Result<Unit>>
{
    
    private readonly IEnvironmentService _environmentService;

    public UpdateVariableInEnvironmentCommandHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }


    public async Task<Result<Unit>> Handle(UpdateVariableInEnvironmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _environmentService.UpdateVariableInEnvironmentAsync(request.EnvironmentRequest);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to update variable in environment: {ex.Message}");
        }
    }
}