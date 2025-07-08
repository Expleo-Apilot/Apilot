using MediatR;
using dev.Application.DTOs.Workspace;
using dev.Application.Common.Models;

namespace dev.Application.Features.Workspace.Queries;

public class GetWorkspacesByUserIdQuery : IRequest<Result<List<WorkspaceDto>>>
{
    public string UserId { get; set; } = string.Empty;
}
