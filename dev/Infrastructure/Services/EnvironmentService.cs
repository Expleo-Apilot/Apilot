using AutoMapper;
using dev.Application.DTOs.Environment;
using dev.Application.Interfaces;
using dev.Application.Interfaces.Services;
using dev.Domain.Entities;
using dev.Domain.Enums;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Environment = dev.Domain.Entities.Environment;

namespace dev.Infrastructure.Services;

public class EnvironmentService : IEnvironmentService
{
    
    private readonly ILogger<EnvironmentService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICollaborationService _collaborationService;

    public EnvironmentService(
        ApplicationDbContext context, 
        ILogger<EnvironmentService> logger, 
        IMapper mapper,
        ICurrentUserService currentUserService,
        ICollaborationService collaborationService)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _collaborationService = collaborationService ?? throw new ArgumentNullException(nameof(collaborationService));
    }
    
    
    public async Task<EnvironmentDto> CreateEnvironmentAsync(CreateEnvironmentRequest environmentRequest)
    {
        try
        {
            _logger.LogInformation("Creating environment with name: {Name}", environmentRequest.Name);
            
            // Check if user has permission to create an environment in this workspace
            var workspace = await _context.Workspaces
                .FirstOrDefaultAsync(w => w.Id == environmentRequest.WorkSpaceId);
                
            if (workspace == null)
            {
                _logger.LogWarning("Workspace with ID {Id} not found", environmentRequest.WorkSpaceId);
                throw new KeyNotFoundException($"Workspace with ID {environmentRequest.WorkSpaceId} not found");
            }
            
            // Only workspace owner can create environments
            bool isOwner = workspace.UserId == _currentUserService.UserId;
            
            if (!isOwner)
            {
                _logger.LogWarning("User {UserId} attempted to create environment in workspace {Id} without permission", 
                    _currentUserService.UserId, workspace.Id);
                throw new UnauthorizedAccessException("You don't have permission to create environments in this workspace");
            }
            
            var env = _mapper.Map<Environment>(environmentRequest);
           
            env.IsDeleted = false;
            env.IsSync = false;
            env.CreatedAt = DateTime.Now;
            env.CreatedBy = _currentUserService.UserName ?? "unknown";
            env.SyncId = Guid.NewGuid();
            
            await _context.Environments.AddAsync(env);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Environment created successfully with ID: {Id}", env.Id);
            return _mapper.Map<EnvironmentDto>(env);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating environment with name: {Name}", environmentRequest.Name);
            throw;
        }
    }

    
    
    public async Task<List<EnvironmentDto>> GetAllEnvironmentsAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all environments");
            
            var environments = await _context.Environments
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} environments", environments.Count);
            return _mapper.Map<List<EnvironmentDto>>(environments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all environments");
            throw;
        }
    }

    
    
    public async Task<EnvironmentDto> GetEnvironmentByIdAsync(int id)
    {
        _logger.LogInformation("Attempting to find environment with ID: {Id}", id);

        try
        {
            var environment = await _context.Environments
                .Include(e => e.Workspace)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (environment == null)
            {
                _logger.LogWarning("Environment with ID {Id} not found", id);
                throw new KeyNotFoundException($"Environment with ID {id} not found");
            }
            
            // Check if user is the workspace owner
            bool isOwner = environment.Workspace.UserId == _currentUserService.UserId;
            
            // Check if user has access to any collections in this workspace through collaborations
            bool hasCollaborationAccess = false;
            
            if (!isOwner)
            {
                // Get all collections in this workspace
                var collections = await _context.Collections
                    .Where(c => c.WorkSpaceId == environment.WorkSpaceId)
                    .ToListAsync();
                
                // Check if user has access to any of these collections
                foreach (var collection in collections)
                {
                    if (await _collaborationService.HasCollectionAccessAsync(collection.Id, CollaborationPermission.View))
                    {
                        hasCollaborationAccess = true;
                        break;
                    }
                }
                
                if (!hasCollaborationAccess)
                {
                    _logger.LogWarning("User {UserId} attempted to access environment {Id} without permission", 
                        _currentUserService.UserId, environment.Id);
                    throw new UnauthorizedAccessException("You don't have permission to access this environment");
                }
            }

            _logger.LogInformation("Environment with ID {Id} found", id);
            return _mapper.Map<EnvironmentDto>(environment);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving the environment with ID {Id}", id);
            throw;
        }
    }

    
    
    public async Task<List<EnvironmentDto>> GetEnvironmentsByWorkspaceIdAsync(int workspaceId)
    {
        try
        {
            _logger.LogInformation("Fetching environments for workspace ID: {WorkspaceId}", workspaceId);
            
            // Check if workspace exists
            var workspace = await _context.Workspaces
                .FirstOrDefaultAsync(w => w.Id == workspaceId);
                
            if (workspace == null)
            {
                _logger.LogWarning("Workspace with ID {Id} not found", workspaceId);
                throw new KeyNotFoundException($"Workspace with ID {workspaceId} not found");
            }
            
            // Check if user is the workspace owner
            bool isOwner = workspace.UserId == _currentUserService.UserId;
            
            // Check if user has access to any collections in this workspace through collaborations
            bool hasCollaborationAccess = false;
            
            if (!isOwner)
            {
                // Get all collections in this workspace
                var collections = await _context.Collections
                    .Where(c => c.WorkSpaceId == workspaceId)
                    .ToListAsync();
                
                // Check if user has access to any of these collections
                foreach (var collection in collections)
                {
                    if (await _collaborationService.HasCollectionAccessAsync(collection.Id, CollaborationPermission.View))
                    {
                        hasCollaborationAccess = true;
                        break;
                    }
                }
                
                if (!hasCollaborationAccess)
                {
                    _logger.LogWarning("User {UserId} attempted to access environments in workspace {Id} without permission", 
                        _currentUserService.UserId, workspaceId);
                    throw new UnauthorizedAccessException("You don't have permission to access environments in this workspace");
                }
            }
            
            var environments = await _context.Environments
                .Where(e => e.WorkSpaceId == workspaceId)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} environments for workspace ID: {WorkspaceId}", 
                environments.Count, workspaceId);
            return _mapper.Map<List<EnvironmentDto>>(environments);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching environments for workspace ID: {WorkspaceId}", workspaceId);
            throw;
        }
    }

    
    
    public async Task UpdateEnvironmentAsync(UpdateEnvironmentRequest request)
    {
        try
        {
            _logger.LogInformation("Updating environment with ID: {Id}", request.Id);
            
            var environment = await _context.Environments
                .Include(e => e.Workspace)
                .FirstOrDefaultAsync(e => e.Id == request.Id);
            
            if (environment == null)
            {
                _logger.LogWarning("Environment with ID {Id} not found for update", request.Id);
                throw new KeyNotFoundException($"Environment with ID {request.Id} not found");
            }
            
            // Only workspace owner can update environments
            bool isOwner = environment.Workspace.UserId == _currentUserService.UserId;
            
            if (!isOwner)
            {
                _logger.LogWarning("User {UserId} attempted to update environment {Id} without permission", 
                    _currentUserService.UserId, environment.Id);
                throw new UnauthorizedAccessException("You don't have permission to update this environment");
            }
            
            environment.Name = request.Name;
            environment.UpdatedAt = DateTime.UtcNow;
            environment.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            environment.IsSync = false; 
            
            _context.Environments.Update(environment);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Environment with ID: {Id} updated successfully", environment.Id);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating environment with ID: {Id}", request.Id);
            throw;
        }
    }

    
    
    public async Task<EnvironmentDto> AddVariablesToEnvironment(AddVariablesToEnvironmentRequest addVariablesToEnvironmentRequest)
    {
        try
        {
            _logger.LogInformation("Adding variables to environment with ID: {Id}", addVariablesToEnvironmentRequest.EnvironmentId);
            
            var environment = await _context.Environments
                .Include(e => e.Workspace)
                .FirstOrDefaultAsync(e => e.Id == addVariablesToEnvironmentRequest.EnvironmentId);
            
            if (environment == null)
            {
                _logger.LogWarning("Environment with ID {Id} not found for adding variables", addVariablesToEnvironmentRequest.EnvironmentId);
                throw new KeyNotFoundException($"Environment with ID {addVariablesToEnvironmentRequest.EnvironmentId} not found");
            }
            
            // Only workspace owner can modify environments
            bool isOwner = environment.Workspace.UserId == _currentUserService.UserId;
            
            if (!isOwner)
            {
                _logger.LogWarning("User {UserId} attempted to add variables to environment {Id} without permission", 
                    _currentUserService.UserId, environment.Id);
                throw new UnauthorizedAccessException("You don't have permission to modify this environment");
            }
           
            foreach (var variable in addVariablesToEnvironmentRequest.Variables)
            {
                environment.Variables[variable.Key] = variable.Value;
            }
            
            environment.UpdatedAt = DateTime.UtcNow;
            environment.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            environment.IsSync = false; 
            
            _context.Environments.Update(environment);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Variables added to environment with ID: {Id} successfully", environment.Id);
            return _mapper.Map<EnvironmentDto>(environment);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding variables to environment with ID: {Id}", addVariablesToEnvironmentRequest.EnvironmentId);
            throw;
        }
    }

    
    
    public async Task DeleteEnvironmentAsync(int id)
    {
        try
        {
            _logger.LogInformation("Attempting to delete environment with ID: {Id}", id);
            
            var environment = await _context.Environments
                .Include(e => e.Workspace)
                .FirstOrDefaultAsync(e => e.Id == id);
            
            if (environment == null)
            {
                _logger.LogWarning("Environment with ID {Id} not found for deletion", id);
                throw new KeyNotFoundException($"Environment with ID {id} not found");
            }
            
            // Only workspace owner can delete environments
            bool isOwner = environment.Workspace.UserId == _currentUserService.UserId;
            
            if (!isOwner)
            {
                _logger.LogWarning("User {UserId} attempted to delete environment {Id} without permission", 
                    _currentUserService.UserId, environment.Id);
                throw new UnauthorizedAccessException("You don't have permission to delete this environment");
            }
            
            environment.IsDeleted = true;
            environment.UpdatedAt = DateTime.UtcNow;
            environment.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Environment with ID: {Id} deleted successfully", id);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting environment with ID: {Id}", id);
            throw;
        }
    }

    
    
    public async Task AddVariableToEnvironmentAsync(AddVariableToEnvironmentRequest addVariableToEnvironmentRequest)
    {
        try
        {
            _logger.LogInformation("Adding variable '{Key}' to environment with ID: {Id}", addVariableToEnvironmentRequest.Key, addVariableToEnvironmentRequest.EnvironmentId);
            
            var environment = await _context.Environments
                .Include(e => e.Workspace)
                .FirstOrDefaultAsync(e => e.Id == addVariableToEnvironmentRequest.EnvironmentId);
            
            if (environment == null)
            {
                _logger.LogWarning("Environment with ID {Id} not found for adding variable", addVariableToEnvironmentRequest.EnvironmentId);
                throw new KeyNotFoundException($"Environment with ID {addVariableToEnvironmentRequest.EnvironmentId} not found");
            }
            
            // Only workspace owner can modify environments
            bool isOwner = environment.Workspace.UserId == _currentUserService.UserId;
            
            if (!isOwner)
            {
                _logger.LogWarning("User {UserId} attempted to add variable to environment {Id} without permission", 
                    _currentUserService.UserId, environment.Id);
                throw new UnauthorizedAccessException("You don't have permission to modify this environment");
            }
           
            environment.Variables[addVariableToEnvironmentRequest.Key] = addVariableToEnvironmentRequest.Value;
            
            environment.UpdatedAt = DateTime.UtcNow;
            environment.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            environment.IsSync = false; 
            
            _context.Environments.Update(environment);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Variable '{Key}' added to environment with ID: {Id} successfully", addVariableToEnvironmentRequest.Key, environment.Id);
           
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding variable '{Key}' to environment with ID: {Id}", addVariableToEnvironmentRequest.Key, addVariableToEnvironmentRequest.EnvironmentId);
            throw;
        }
    }

    
    
    public async Task UpdateVariableInEnvironmentAsync(UpdateVariableInEnvironmentRequest updateVariableInEnvironmentRequest)
    {
        try
        {
            _logger.LogInformation("Updating variable '{Key}' in environment with ID: {Id}", updateVariableInEnvironmentRequest.Key, updateVariableInEnvironmentRequest.EnvironmentId);
            
            var environment = await _context.Environments
                .Include(e => e.Workspace)
                .FirstOrDefaultAsync(e => e.Id == updateVariableInEnvironmentRequest.EnvironmentId);
            
            if (environment == null)
            {
                _logger.LogWarning("Environment with ID {Id} not found for updating variable", updateVariableInEnvironmentRequest.EnvironmentId);
                throw new KeyNotFoundException($"Environment with ID {updateVariableInEnvironmentRequest.EnvironmentId} not found");
            }
            
            // Only workspace owner can modify environments
            bool isOwner = environment.Workspace.UserId == _currentUserService.UserId;
            
            if (!isOwner)
            {
                _logger.LogWarning("User {UserId} attempted to update variable in environment {Id} without permission", 
                    _currentUserService.UserId, environment.Id);
                throw new UnauthorizedAccessException("You don't have permission to modify this environment");
            }
            
            if (!environment.Variables.ContainsKey(updateVariableInEnvironmentRequest.Key))
            {
                _logger.LogWarning("Variable '{Key}' not found in environment with ID: {Id}", updateVariableInEnvironmentRequest.Key, updateVariableInEnvironmentRequest.EnvironmentId);
                throw new KeyNotFoundException($"Variable '{updateVariableInEnvironmentRequest.Key}' not found in environment with ID {updateVariableInEnvironmentRequest.EnvironmentId}");
            }
            
            
            environment.Variables[updateVariableInEnvironmentRequest.Key] = updateVariableInEnvironmentRequest.Value;
            
            environment.UpdatedAt = DateTime.UtcNow;
            environment.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            environment.IsSync = false; 
            
            _context.Environments.Update(environment);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Variable '{Key}' updated in environment with ID: {Id} successfully", updateVariableInEnvironmentRequest.Key, environment.Id);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating variable '{Key}' in environment with ID: {Id}", updateVariableInEnvironmentRequest.Key, updateVariableInEnvironmentRequest.EnvironmentId);
            throw;
        }
    }
    
    

    public async Task RemoveVariableFromEnvironmentAsync(RemoveVariableFromEnvironmentRequest request)
    {
        try
        {
            _logger.LogInformation("Removing variable '{Key}' from environment with ID: {Id}", request.Key, request.EnvironmentId);
            
            var environment = await _context.Environments
                .Include(e => e.Workspace)
                .FirstOrDefaultAsync(e => e.Id == request.EnvironmentId);
            
            if (environment == null)
            {
                _logger.LogWarning("Environment with ID {Id} not found for removing variable", request.EnvironmentId);
                throw new KeyNotFoundException($"Environment with ID {request.EnvironmentId} not found");
            }
            
            // Only workspace owner can modify environments
            bool isOwner = environment.Workspace.UserId == _currentUserService.UserId;
            
            if (!isOwner)
            {
                _logger.LogWarning("User {UserId} attempted to remove variable from environment {Id} without permission", 
                    _currentUserService.UserId, environment.Id);
                throw new UnauthorizedAccessException("You don't have permission to modify this environment");
            }
            
            if (!environment.Variables.ContainsKey(request.Key))
            {
                _logger.LogWarning("Variable '{Key}' not found in environment with ID: {Id}", request.Key, request.EnvironmentId);
                throw new KeyNotFoundException($"Variable '{request.Key}' not found in environment with ID {request.EnvironmentId}");
            }
            
            environment.Variables.Remove(request.Key);
            
            environment.UpdatedAt = DateTime.UtcNow;
            environment.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            environment.IsSync = false;
            
            _context.Environments.Update(environment);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Variable '{Key}' removed from environment with ID: {Id} successfully", request.Key, environment.Id);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing variable '{Key}' from environment with ID: {Id}", request.Key, request.EnvironmentId);
            throw;
        }
    }
}