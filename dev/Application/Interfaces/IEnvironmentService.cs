using dev.Application.DTOs.Environment;

namespace dev.Application.Interfaces;

public interface IEnvironmentService
{
    Task<EnvironmentDto> CreateEnvironmentAsync(CreateEnvironmentRequest request);
    Task<List<EnvironmentDto>> GetAllEnvironmentsAsync();
    Task<EnvironmentDto> GetEnvironmentByIdAsync(int id);
    Task<List<EnvironmentDto>> GetEnvironmentsByWorkspaceIdAsync(int workspaceId);
    
    Task UpdateEnvironmentAsync(UpdateEnvironmentRequest request);
    Task<EnvironmentDto> AddVariablesToEnvironment(AddVariablesToEnvironmentRequest request);
    Task DeleteEnvironmentAsync(int id);
    
    
    Task AddVariableToEnvironmentAsync(AddVariableToEnvironmentRequest request);
    Task UpdateVariableInEnvironmentAsync(UpdateVariableInEnvironmentRequest request);
    Task RemoveVariableFromEnvironmentAsync(RemoveVariableFromEnvironmentRequest request);
}