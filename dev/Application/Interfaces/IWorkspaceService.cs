using dev.Application.DTOs.Workspace;

namespace dev.Application.Interfaces;

public interface IWorkspaceService
{
    Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceDto workspaceDto);
    Task<List<WorkspaceDto>> GetAllWorkspacesAsync();
    Task<List<WorkspaceDto>> GetWorkspacesByUserIdAsync(string userId);
    Task<WorkspaceDto> GetWorkspaceByIdAsync(int id);
    Task UpdateWorkspaceAsync(UpdateWorkspaceDto workspaceDto);
    Task DeleteWorkspaceAsync(int id, string userId);
}