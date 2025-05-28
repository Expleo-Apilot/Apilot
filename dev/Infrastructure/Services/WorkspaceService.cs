using AutoMapper;
using dev.Application.Common.Models;
using dev.Application.DTOs.Workspace;
using dev.Application.Interfaces;
using dev.Domain.Entities;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace dev.Infrastructure.Services;

public class WorkspaceService : IWorkspaceService
{
    
    private readonly ILogger<WorkspaceService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public WorkspaceService(ApplicationDbContext context, ILogger<WorkspaceService> logger, IMapper mapper)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }
    
    
    public async Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceDto workspaceDto)
    {
        try
        {
            _logger.LogInformation("Creating workspace with name: {Name} for user: {UserId}", workspaceDto.Name, workspaceDto.UserId);
            
            var workspace = _mapper.Map<Workspace>(workspaceDto);
            
            workspace.CreatedAt = DateTime.Now;
            workspace.IsDeleted = false;
            workspace.IsSync = false;
            workspace.CreatedBy = workspaceDto.UserId;
            workspace.UpdatedBy = workspaceDto.UserId; // Set the updater to the current user ID
            workspace.SyncId = Guid.NewGuid();
            

            if (string.IsNullOrEmpty(workspace.UserId))
            {
                throw new ArgumentException("User ID is required to create a workspace");
            }
            
            await _context.Workspaces.AddAsync(workspace);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Workspace created successfully with ID: {Id} for user: {UserId}", workspace.Id, workspace.UserId);
            return _mapper.Map<WorkspaceDto>(workspace);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating workspace with name: {Name}", workspaceDto.Name);
            throw;
        }
    }
    
    

    public async Task<List<WorkspaceDto>> GetAllWorkspacesAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all workspaces");
            
            var workspaces = await _context.Workspaces
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} workspaces", workspaces.Count);
            return _mapper.Map<List<WorkspaceDto>>(workspaces);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all workspaces");
            throw;
        }
    }
    
    public async Task<Result<List<WorkspaceDto>>> GetWorkspacesByUserIdAsync(string userId)
    {
        try
        {
            _logger.LogInformation("Fetching workspaces for user: {UserId}", userId);
            
            var workspaces = await _context.Workspaces
                .Where(w => w.UserId == userId && !w.IsDeleted)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} workspaces for user {UserId}", workspaces.Count, userId);
            var workspaceDtos = _mapper.Map<List<WorkspaceDto>>(workspaces);
            return Result<List<WorkspaceDto>>.Success(workspaceDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching workspaces for user {UserId}", userId);
            return Result<List<WorkspaceDto>>.Failure($"Error retrieving workspaces: {ex.Message}");
        }
    }

    
    
    public async Task<WorkspaceDto> GetWorkspaceByIdAsync(int id)
    {
        _logger.LogInformation("Attempting to find workspace with ID: {Id}", id);

        try
        {
            var workspace = await _context.Workspaces
                .Include(w => w.Histories)
                .Include(w => w.Environments)
                .Include(w => w.Collections)
                .ThenInclude(c => c.Folders)
                .ThenInclude(f => f.Requests)
                .Include(w => w.Collections)
                .ThenInclude(c => c.Requests)
                .FirstOrDefaultAsync(w => w.Id == id);

            if (workspace == null)
            {
                _logger.LogWarning("Workspace with ID {Id} not found", id);
                throw new KeyNotFoundException($"Workspace with ID {id} not found");
            }

            _logger.LogInformation("Workspace with ID {Id} found", id);
            return _mapper.Map<WorkspaceDto>(workspace);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving the workspace with ID {Id}", id);
            throw;
        }
    }


    
    
    public async Task UpdateWorkspaceAsync(UpdateWorkspaceDto workspaceDto)
    {
        _logger.LogInformation("Updating workspace with ID: {Id} for user: {UserId}", workspaceDto.Id, workspaceDto.UserId);

        try
        {
            var workspace = await _context.Workspaces
                .FirstOrDefaultAsync(w => w.Id == workspaceDto.Id);
                
            if (workspace == null)
            {
                _logger.LogWarning("Workspace with ID {Id} not found for update", workspaceDto.Id);
                throw new KeyNotFoundException($"Workspace with ID {workspaceDto.Id} not found");
            }
            
            // Verify that the user owns this workspace
            if (workspace.UserId != workspaceDto.UserId)
            {
                _logger.LogWarning("User {UserId} attempted to update workspace {Id} owned by {OwnerId}", 
                    workspaceDto.UserId, workspaceDto.Id, workspace.UserId);
                throw new UnauthorizedAccessException("You do not have permission to update this workspace");
            }
            
            _mapper.Map(workspaceDto, workspace);
            workspace.UpdatedAt = DateTime.UtcNow;
            workspace.UpdatedBy = workspaceDto.UserId; // Set the updater to the current user ID
            workspace.IsSync = false;
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Workspace with ID {Id} updated successfully by user {UserId}", workspaceDto.Id, workspaceDto.UserId);
           
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
            _logger.LogError(ex, "An error occurred while updating the workspace with ID {Id}", workspaceDto.Id);
            throw;
        }
    }

    
    
   public async Task DeleteWorkspaceAsync(int id, string userId)
{
    _logger.LogInformation("Deleting workspace with ID: {Id} and all associated entities for user: {UserId}", id, userId);

    try
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var workspace = await _context.Workspaces
                .Include(w => w.Collections)
                    .ThenInclude(c => c.Folders)
                        .ThenInclude(f => f.Requests)
                            .ThenInclude(r => r.Responses)
                .Include(w => w.Collections)
                    .ThenInclude(c => c.Requests)
                        .ThenInclude(r => r.Responses)
                .Include(w => w.Environments)
                .Include(w => w.Histories)
                .FirstOrDefaultAsync(w => w.Id == id);
                
            if (workspace == null)
            {
                _logger.LogWarning("Workspace with ID {Id} not found for delete", id);
                throw new KeyNotFoundException($"Workspace with ID {id} not found");
            }
            
            // Verify that the user owns this workspace
            if (workspace.UserId != userId)
            {
                _logger.LogWarning("User {UserId} attempted to delete workspace {Id} owned by {OwnerId}", 
                    userId, id, workspace.UserId);
                throw new UnauthorizedAccessException("You do not have permission to delete this workspace");
            }
            
            
            if (workspace.Histories != null && workspace.Histories.Any())
            {
                _logger.LogInformation("Removing {Count} histories for workspace {Id}", workspace.Histories.Count, id);
                _context.Histories.RemoveRange(workspace.Histories);
            }
            
            
            if (workspace.Environments != null && workspace.Environments.Any())
            {
                _logger.LogInformation("Removing {Count} environments for workspace {Id}", workspace.Environments.Count, id);
                _context.Environments.RemoveRange(workspace.Environments);
            }
            
           
            if (workspace.Collections != null)
            {
                foreach (var collection in workspace.Collections)
                {
                    
                    if (collection.Requests != null && collection.Requests.Any())
                    {
                        foreach (var request in collection.Requests)
                        {
                            if (request.Responses != null && request.Responses.Any())
                            {
                                _logger.LogInformation("Removing {Count} responses for request {Id}", request.Responses.Count, request.Id);
                                _context.Responses.RemoveRange(request.Responses);
                            }
                        }
                        
                        _logger.LogInformation("Removing {Count} direct requests for collection {Id}", collection.Requests.Count, collection.Id);
                        _context.Requests.RemoveRange(collection.Requests);
                    }
                    
                    
                    if (collection.Folders != null && collection.Folders.Any())
                    {
                        foreach (var folder in collection.Folders)
                        {
                            if (folder.Requests != null && folder.Requests.Any())
                            {
                                foreach (var request in folder.Requests)
                                {
                                    if (request.Responses != null && request.Responses.Any())
                                    {
                                        _logger.LogInformation("Removing {Count} responses for request {Id} in folder {FolderId}", request.Responses.Count, request.Id, folder.Id);
                                        _context.Responses.RemoveRange(request.Responses);
                                    }
                                }
                                
                                _logger.LogInformation("Removing {Count} requests for folder {Id}", folder.Requests.Count, folder.Id);
                                _context.Requests.RemoveRange(folder.Requests);
                            }
                        }
                        
                        _logger.LogInformation("Removing {Count} folders for collection {Id}", collection.Folders.Count, collection.Id);
                        _context.Folders.RemoveRange(collection.Folders);
                    }
                }
                
                _logger.LogInformation("Removing {Count} collections for workspace {Id}", workspace.Collections.Count, id);
                _context.Collections.RemoveRange(workspace.Collections);
            }
            
            
            _logger.LogInformation("Removing workspace {Id}", id);
            _context.Workspaces.Remove(workspace);
            
            
            await _context.SaveChangesAsync();
            
            
            await transaction.CommitAsync();
            
            _logger.LogInformation("Workspace with ID {Id} and all associated entities deleted successfully", id);
        }
        catch (Exception ex)
        {
            
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Transaction rolled back. An error occurred while deleting the workspace {Id} and its associated entities", id);
            throw;
        }
    }
    catch (KeyNotFoundException)
    {
        throw;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "An error occurred while deleting the workspace with ID {Id}", id);
        throw;
    }
}
}