using dev.Application.Common.Models;
using dev.Application.DTOs.Workspace;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Workspace.Commands;

public record UpdateWorkspaceCommand :  IRequest<Result<Unit>>
{
    public required UpdateWorkspaceDto UpdateWorkspace { get; init; }
}


public class UpdateWorkspaceCommandHandler : IRequestHandler<UpdateWorkspaceCommand, Result<Unit>>
{
    
    private readonly IWorkspaceService _workspaceService;

    public UpdateWorkspaceCommandHandler(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    
    public async Task<Result<Unit>> Handle(UpdateWorkspaceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _workspaceService.UpdateWorkspaceAsync(request.UpdateWorkspace);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to update workspace: {ex.Message}");
        }
    }
}