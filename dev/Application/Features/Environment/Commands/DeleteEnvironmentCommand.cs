using dev.Application.Common.Models;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Environment.Commands;

public class DeleteEnvironmentCommand : IRequest<Result<Unit>>
{
    public required int Id { get; init; }
}


public class DeleteEnvironmentCommandHandler : IRequestHandler<DeleteEnvironmentCommand, Result<Unit>>
{
    
    private readonly IEnvironmentService _environmentService;

    public DeleteEnvironmentCommandHandler(IEnvironmentService environmentService)
    {
        _environmentService = environmentService;
    }

    public async Task<Result<Unit>> Handle(DeleteEnvironmentCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _environmentService.DeleteEnvironmentAsync(request.Id);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to delete environment: {ex.Message}");
        }
    }
}
