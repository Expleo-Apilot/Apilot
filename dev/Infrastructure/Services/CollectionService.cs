using AutoMapper;
using dev.Application.DTOs.Collection;
using dev.Application.Interfaces;
using dev.Application.Interfaces.Services;
using dev.Domain.Entities;
using dev.Domain.Enums;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace dev.Infrastructure.Services;

public class CollectionService : ICollectionService
{
    
    private readonly ILogger<CollectionService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICollaborationService _collaborationService;

    public CollectionService(
        ApplicationDbContext context, 
        ILogger<CollectionService> logger, 
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
    
    
    public async Task<CollectionDto> CreateCollectionAsync(CreateCollectionDto collectionDto)
    {
        try
        {
            _logger.LogInformation("Creating collection with name: {Name}", collectionDto.Name);
            
            var collection = _mapper.Map<Collection>(collectionDto);
            
            collection.IsDeleted = false;
            collection.IsSync = false;
            collection.CreatedAt = DateTime.Now;
            collection.CreatedBy = _currentUserService.UserName ?? "unknown";
            collection.SyncId = Guid.NewGuid();
            
            await _context.Collections.AddAsync(collection);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Collection created successfully with ID: {Id}", collection.Id);
            return _mapper.Map<CollectionDto>(collection);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating collection with name: {Name}", collectionDto.Name);
            throw;
        }
    }

    
    
    public async Task<List<CollectionDto>> GetAllCollectionsAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all collections");
            
            var collections = await _context.Collections
                .Include(c => c.Requests)
                .Include(w => w.Folders).ThenInclude(f => f.Requests)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} collections", collections.Count);
            return _mapper.Map<List<CollectionDto>>(collections);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all collections");
            throw;
        }
    }

    
    
    public async Task<CollectionDto> GetCollectionByIdAsync(int id)
    {
        _logger.LogInformation("Attempting to find collection with ID: {Id}", id);

        try
        {
            var collection = await _context.Collections
                .Include(c => c.WorkSpace)
                .Include(c => c.Requests)
                .Include(w => w.Folders).ThenInclude(f => f.Requests).ThenInclude(res => res.Responses)
                .FirstOrDefaultAsync(w => w.Id == id );

            if (collection == null)
            {
                _logger.LogWarning("Collection with ID {Id} not found ", id);
                throw new KeyNotFoundException($"Collection with ID {id} not found");
            }
            
            // Check if user is the owner or has access
            bool isOwner = collection.WorkSpace.UserId == _currentUserService.UserId;
            bool hasAccess = false;
            
            if (!isOwner)
            {
                hasAccess = await _collaborationService.HasCollectionAccessAsync(
                    collection.Id, CollaborationPermission.View);
            }
            
            if (!isOwner && !hasAccess)
            {
                _logger.LogWarning("User {UserId} attempted to access collection {Id} without permission", 
                    _currentUserService.UserId, collection.Id);
                throw new UnauthorizedAccessException("You don't have permission to access this collection");
            }

            _logger.LogInformation("Collection with ID {Id} found", id);
            return _mapper.Map<CollectionDto>(collection);
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
            _logger.LogError(ex, "An error occurred while retrieving the collection with ID {Id}", id);
            throw;
        }
    }

    
    
    public async Task<List<CollectionDto>> GetCollectionsByWorkspaceIdAsync(int workspaceId)
    {
        try
        {
            _logger.LogInformation("Fetching collections for workspace ID: {WorkspaceId}", workspaceId);
            
            // Get the workspace to check ownership
            var workspace = await _context.Workspaces
                .FirstOrDefaultAsync(w => w.Id == workspaceId);
                
            if (workspace == null)
            {
                _logger.LogWarning("Workspace with ID {Id} not found", workspaceId);
                throw new KeyNotFoundException($"Workspace with ID {workspaceId} not found");
            }
            
            // Check if the current user is the owner of the workspace
            bool isWorkspaceOwner = workspace.UserId == _currentUserService.UserId;
            
            // Get all collections in the workspace
            var workspaceCollections = await _context.Collections
                .Include(c => c.Requests)
                .Include(w => w.Folders).ThenInclude(f => f.Requests).ThenInclude(req => req.Responses)
                .Where(c => c.WorkSpaceId == workspaceId)
                .ToListAsync();
                
            // If user is workspace owner, return all collections
            if (isWorkspaceOwner)
            {
                _logger.LogInformation("User is workspace owner. Retrieved {Count} collections for workspace ID: {WorkspaceId}", 
                    workspaceCollections.Count, workspaceId);
                return _mapper.Map<List<CollectionDto>>(workspaceCollections);
            }
            
            // If not the workspace owner, get collections user has access to via collaborations
            var collaborationCollectionIds = await _context.Collaborations
                .Where(c => c.InvitedUserId == _currentUserService.UserId && 
                           c.Status == CollaborationStatus.Accepted)
                .Select(c => c.CollectionId)
                .ToListAsync();
                
            // Filter collections to only include those the user has access to
            var accessibleCollections = workspaceCollections
                .Where(c => collaborationCollectionIds.Contains(c.Id))
                .ToList();
                
            _logger.LogInformation("User has access to {Count} collections in workspace ID: {WorkspaceId} via collaborations", 
                accessibleCollections.Count, workspaceId);
                
            return _mapper.Map<List<CollectionDto>>(accessibleCollections);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching collections for workspace ID: {WorkspaceId}", workspaceId);
            throw;
        }
    }

    
    
    public async Task UpdateCollectionAsync(UpdateCollectionDto collectionDto)
    {
        try
        {
            _logger.LogInformation("Updating collection with ID: {Id}", collectionDto.Id);
        
            var collection = await _context.Collections
                .Include(c => c.WorkSpace)
                .FirstOrDefaultAsync(c => c.Id == collectionDto.Id);
        
            if (collection == null)
            {
                _logger.LogWarning("Collection with ID {Id} not found for update", collectionDto.Id);
                throw new KeyNotFoundException($"Collection with ID {collectionDto.Id} not found");
            }
            
            // Check if user is the owner or has edit permission
            bool isOwner = collection.WorkSpace.UserId == _currentUserService.UserId;
            bool hasEditPermission = false;
            
            if (!isOwner)
            {
                hasEditPermission = await _collaborationService.HasCollectionAccessAsync(
                    collection.Id, CollaborationPermission.Edit);
            }
            
            if (!isOwner && !hasEditPermission)
            {
                _logger.LogWarning("User {UserId} attempted to update collection {Id} without permission", 
                    _currentUserService.UserId, collection.Id);
                throw new UnauthorizedAccessException("You don't have permission to update this collection");
            }
            
            _mapper.Map(collectionDto, collection);
            collection.UpdatedAt = DateTime.UtcNow;
            collection.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            collection.IsSync = false; 
            
            await _context.SaveChangesAsync();
        
            _logger.LogInformation("Collection with ID: {Id} updated successfully", collection.Id);
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
            _logger.LogError(ex, "Error updating collection with ID: {Id}", collectionDto.Id);
            throw;
        }
    }

    
    
   public async Task DeleteCollectionAsync(int id)
{
    _logger.LogInformation("Deleting collection with ID: {Id} and all associated entities", id);

    try
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var collection = await _context.Collections
                .Include(c => c.WorkSpace)
                .Include(c => c.Folders)
                    .ThenInclude(f => f.Requests)
                        .ThenInclude(r => r.Responses)
                .Include(c => c.Requests)
                    .ThenInclude(r => r.Responses)
                .Include(c => c.Collaborations)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (collection == null)
            {
                _logger.LogWarning("Collection with ID {Id} not found for deletion", id);
                throw new KeyNotFoundException($"Collection with ID {id} not found");
            }
            
            // Check if user is the owner (only owners can delete collections)
            bool isOwner = collection.WorkSpace.UserId == _currentUserService.UserId;
            
            if (!isOwner)
            {
                _logger.LogWarning("User {UserId} attempted to delete collection {Id} without permission", 
                    _currentUserService.UserId, collection.Id);
                throw new UnauthorizedAccessException("You don't have permission to delete this collection");
            }
            
            
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
            
           
            _logger.LogInformation("Removing collection {Id}", id);
            _context.Collections.Remove(collection);
            
            
            await _context.SaveChangesAsync();
            
            
            await transaction.CommitAsync();
            
            _logger.LogInformation("Collection with ID {Id} and all associated entities deleted successfully", id);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Transaction rolled back. An error occurred while deleting the collection {Id} and its associated entities", id);
            throw;
        }
    }
    catch (KeyNotFoundException)
    {
        throw;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "An error occurred while deleting the collection with ID {Id}", id);
        throw;
    }
}
}