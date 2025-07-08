using dev.Application.Common.Models;
using dev.Application.DTOs.Workspace;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Workspace.Queries;

public record GetWorkspaceByIdQuery : IRequest<Result<WorkspaceDto>>
{
    public required int Id { get; init; }
}


public class GetWorkspaceByIdQueryHandler : IRequestHandler<GetWorkspaceByIdQuery, Result<WorkspaceDto>>
{
    
    private readonly IWorkspaceService _workspaceService;

    public GetWorkspaceByIdQueryHandler(IWorkspaceService workspaceService)
    {
        _workspaceService = workspaceService;
    }

    public async Task<Result<WorkspaceDto>> Handle(GetWorkspaceByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var workspace = await _workspaceService.GetWorkspaceByIdAsync(request.Id);
            return Result<WorkspaceDto>.Success(workspace);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<WorkspaceDto>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<WorkspaceDto>.Failure($"Failed to get workspace: {ex.Message}");
        }
    }
}