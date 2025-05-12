using dev.Application.Common.Models;
using dev.Application.DTOs.Workspace;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Workspace.Commands;

public record CreateWorkspaceCommand : IRequest<Result<WorkspaceDto>>
{
    public required CreateWorkspaceDto WorkSpaceDto { get; init; }
}



public class CreateWorkspaceCommandHandler : IRequestHandler<CreateWorkspaceCommand, Result<WorkspaceDto>>
{
    
    private readonly IWorkspaceService _workspaceService;

    public CreateWorkspaceCommandHandler(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    public async Task<Result<WorkspaceDto>> Handle(CreateWorkspaceCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var workSpace = await _workspaceService.CreateWorkspaceAsync(request.WorkSpaceDto);
            return Result<WorkspaceDto>.Success(workSpace);
        }
        catch (Exception ex)
        {
            return Result<WorkspaceDto>.Failure($"Failed to create workspace: {ex.Message}");
        }
    }
}