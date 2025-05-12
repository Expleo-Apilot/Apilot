using dev.Application.DTOs.Environment;

namespace dev.Application.Interfaces;

public interface IEnvironmentService
{
    Task<EnvironmentDto> CreateEnvironmentAsync(CreateEnvironmentDto environmentDto);
    Task<List<EnvironmentDto>> GetAllEnvironmentsAsync();
    Task<EnvironmentDto> GetEnvironmentByIdAsync(int id);
    Task<List<EnvironmentDto>> GetEnvironmentsByWorkspaceIdAsync(int workspaceId);
    
    Task UpdateEnvironmentAsync(int id, string name);
    Task<EnvironmentDto> AddVariablesToEnvironment(AddVariablesToEnvironmentDto addVariablesToEnvironmentDto);
    Task DeleteEnvironmentAsync(int id);
    
    
    Task AddVariableToEnvironmentAsync(AddVariableToEnvironmentDto addVariableToEnvironmentDto);
    Task UpdateVariableInEnvironmentAsync(UpdateVariableInEnvironmentDto updateVariableInEnvironmentDto);
    Task RemoveVariableFromEnvironmentAsync(int id, string key);
}