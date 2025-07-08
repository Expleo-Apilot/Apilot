using dev.Application.Common.Models;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Commands;

public record RemoveVariableFromEnvironmentCommand : IRequest<Result<Unit>>
{
   public required RemoveVariableFromEnvironmentRequest Command { get; init; }
}


public class RemoveVariableFromEnvironmentCommandHandler : IRequestHandler<RemoveVariableFromEnvironmentCommand, Result<Unit>>
{
    
    private readonly IEnvironmentService _environmentService;

    public RemoveVariableFromEnvironmentCommandHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<Unit>> Handle(RemoveVariableFromEnvironmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _environmentService.RemoveVariableFromEnvironmentAsync(request.Command);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to remove variable from environment: {ex.Message}");
        }
    }
}