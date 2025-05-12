using dev.Application.Common.Models;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Workspace.Commands;

public record DeleteWorkspaceCommand : IRequest<Result<Unit>>
{
    public required int Id { get; init; }
}



public class DeleteWorkspaceCommandHandler : IRequestHandler<DeleteWorkspaceCommand, Result<Unit>>
{
    
    private readonly IWorkspaceService _workspaceService;

    public DeleteWorkspaceCommandHandler(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    public async Task<Result<Unit>> Handle(DeleteWorkspaceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _workspaceService.DeleteWorkspaceAsync(request.Id);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to delete workspace: {ex.Message}");
        }
    }
}