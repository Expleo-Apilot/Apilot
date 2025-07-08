using dev.Application.Common.Models;
using dev.Application.DTOs.Workspace;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Workspace.Queries;

public record GetWorkspacesQuery : IRequest<Result<List<WorkspaceDto>>>;



public class GetWorkspacesQueryHandler : IRequestHandler<GetWorkspacesQuery, Result<List<WorkspaceDto>>>
{
    
    private readonly IWorkspaceService _workspaceService;

    public GetWorkspacesQueryHandler(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    public async Task<Result<List<WorkspaceDto>>> Handle(GetWorkspacesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var workspaces = await _workspaceService.GetAllWorkspacesAsync();
            return Result<List<WorkspaceDto>>.Success(workspaces);
        }
        catch (Exception ex)
        {
            return Result<List<WorkspaceDto>>.Failure($"Failed to get workspaces: {ex.Message}");
        }
    }
}