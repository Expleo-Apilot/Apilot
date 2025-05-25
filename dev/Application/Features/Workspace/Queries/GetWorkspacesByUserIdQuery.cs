using dev.Application.DTOs.Workspace;
using MediatR;

namespace dev.Application.Features.Workspace.Queries;

public class GetWorkspacesByUserIdQuery : IRequest<List<WorkspaceDto>>
{
    public string UserId { get; set; } = string.Empty;
}
