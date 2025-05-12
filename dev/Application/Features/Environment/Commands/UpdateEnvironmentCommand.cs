using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Commands;

public record UpdateEnvironmentCommand :  IRequest<Result<Unit>>
{
public required UpdateEnvironmentDto EnvironmentDto { get; init; }
}


public class UpdateEnvironmentCommandHandler : IRequestHandler<UpdateEnvironmentCommand, Result<Unit>>
{
    
    private readonly IEnvironmentService _environmentService;

    public UpdateEnvironmentCommandHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<Unit>> Handle(UpdateEnvironmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _environmentService.UpdateEnvironmentAsync(request.EnvironmentDto.Id , request.EnvironmentDto.Name);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to update environment: {ex.Message}");
        }
    }
}
