using AutoMapper;
using dev.Application.DTOs.Folder;
using dev.Application.Interfaces;
using dev.Application.Interfaces.Services;
using dev.Domain.Entities;
using dev.Domain.Enums;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace dev.Infrastructure.Services;

public class FolderService : IFolderService
{
    
    private readonly ILogger<FolderService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICollaborationService _collaborationService;

    public FolderService(
        ApplicationDbContext context, 
        ILogger<FolderService> logger, 
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
    
    
    
    public async Task<FolderDto> CreateFolderAsync(CreateFolderDto folderDto)
    {
        try
        {
            _logger.LogInformation("Creating folder with name: {Name}", folderDto.Name);
            
            // Check if user has edit permission on the collection
            var collection = await _context.Collections
                .Include(c => c.WorkSpace)
                .FirstOrDefaultAsync(c => c.Id == folderDto.CollectionId);
                
            if (collection == null)
            {
                _logger.LogWarning("Collection with ID {Id} not found", folderDto.CollectionId);
                throw new KeyNotFoundException($"Collection with ID {folderDto.CollectionId} not found");
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
                _logger.LogWarning("User {UserId} attempted to create folder in collection {Id} without permission", 
                    _currentUserService.UserId, collection.Id);
                throw new UnauthorizedAccessException("You don't have permission to create folders in this collection");
            }
            
            var folder = _mapper.Map<Folder>(folderDto);
            
            folder.IsDeleted = false;
            folder.IsSync = false;
            folder.CreatedAt = DateTime.Now;
            folder.CreatedBy = _currentUserService.UserName ?? "unknown";
            folder.SyncId = Guid.NewGuid();
            
            await _context.Folders.AddAsync(folder);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Folder created successfully with ID: {Id}", folder.Id);
            return _mapper.Map<FolderDto>(folder);
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
            _logger.LogError(ex, "Error creating folder with name: {Name}", folderDto.Name);
            throw;
        }
    }

    
    
    public async Task<List<FolderDto>> GetAllFoldersAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all folders");
            
            var folders = await _context.Folders
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} folders", folders.Count);
            return _mapper.Map<List<FolderDto>>(folders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all folders");
            throw;
        }
    }

    
    
    public async Task<FolderDto> GetFolderByIdAsync(int id)
    {
        _logger.LogInformation("Attempting to find folder with ID: {Id}", id);

        try
        {
            var folder = await _context.Folders
                .Include(f => f.Requests).ThenInclude(r => r.Responses)
                .Include(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(f => f.Id == id );

            if (folder == null)
            {
                _logger.LogWarning("Folder with ID {Id} not found", id);
                throw new KeyNotFoundException($"Folder with ID {id} not found");
            }
            
            // Check if user is the owner or has access
            bool isOwner = folder.Collection.WorkSpace.UserId == _currentUserService.UserId;
            bool hasAccess = false;
            
            if (!isOwner)
            {
                hasAccess = await _collaborationService.HasCollectionAccessAsync(
                    folder.CollectionId, CollaborationPermission.View);
            }
            
            if (!isOwner && !hasAccess)
            {
                _logger.LogWarning("User {UserId} attempted to access folder {Id} without permission", 
                    _currentUserService.UserId, folder.Id);
                throw new UnauthorizedAccessException("You don't have permission to access this folder");
            }

            _logger.LogInformation("Folder with ID {Id} found", id);
            return _mapper.Map<FolderDto>(folder);
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
            _logger.LogError(ex, "An error occurred while retrieving the folder with ID {Id}", id);
            throw;
        }
    }

    
    
    public async Task<List<FolderDto>> GetFoldersByCollectionIdAsync(int collectionId)
    {
        try
        {
            _logger.LogInformation("Fetching folders for collection ID: {CollectionId}", collectionId);
            
            // Check if user has access to the collection
            var collection = await _context.Collections
                .Include(c => c.WorkSpace)
                .FirstOrDefaultAsync(c => c.Id == collectionId);
                
            if (collection == null)
            {
                _logger.LogWarning("Collection with ID {Id} not found", collectionId);
                throw new KeyNotFoundException($"Collection with ID {collectionId} not found");
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
                _logger.LogWarning("User {UserId} attempted to access folders in collection {Id} without permission", 
                    _currentUserService.UserId, collection.Id);
                throw new UnauthorizedAccessException("You don't have permission to access folders in this collection");
            }
            
            var folders = await _context.Folders
                .Include(f => f.Requests).ThenInclude(r => r.Responses)
                .Where(f => f.CollectionId == collectionId)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} folders for collection ID: {CollectionId}", 
                folders.Count, collectionId);
            return _mapper.Map<List<FolderDto>>(folders);
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
            _logger.LogError(ex, "Error fetching folders for collection ID: {CollectionId}", collectionId);
            throw;
        }
    }

    
    
    public async Task UpdateFolderAsync(UpdateFolderDto folderDto)
    {
        try
        {
            _logger.LogInformation("Updating folder with ID: {Id}", folderDto.Id);
            
            var folder = await _context.Folders
                .Include(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(f => f.Id == folderDto.Id && !f.IsDeleted);
            
            if (folder == null)
            {
                _logger.LogWarning("Folder with ID {Id} not found for update", folderDto.Id);
                throw new KeyNotFoundException($"Folder with ID {folderDto.Id} not found");
            }
            
            // Check if user is the owner or has edit permission
            bool isOwner = folder.Collection.WorkSpace.UserId == _currentUserService.UserId;
            bool hasEditPermission = false;
            
            if (!isOwner)
            {
                hasEditPermission = await _collaborationService.HasCollectionAccessAsync(
                    folder.CollectionId, CollaborationPermission.Edit);
            }
            
            if (!isOwner && !hasEditPermission)
            {
                _logger.LogWarning("User {UserId} attempted to update folder {Id} without permission", 
                    _currentUserService.UserId, folder.Id);
                throw new UnauthorizedAccessException("You don't have permission to update this folder");
            }
            
            _mapper.Map(folderDto, folder);
            folder.UpdatedAt = DateTime.UtcNow;
            folder.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            folder.IsSync = false; 
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Folder with ID: {Id} updated successfully", folder.Id);
            
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
            _logger.LogError(ex, "Error updating folder with ID: {Id}", folderDto.Id);
            throw;
        }
    }

    
    
    public async Task DeleteFolderAsync(int id)
    {
        try
        {
            _logger.LogInformation("Attempting to delete folder with ID: {Id}", id);
            
            var folder = await _context.Folders
                .Include(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(f => f.Id == id);
            
            if (folder == null)
            {
                _logger.LogWarning("Folder with ID {Id} not found for deletion", id);
                throw new KeyNotFoundException($"Folder with ID {id} not found");
            }
            
            // Check if user is the owner or has edit permission
            bool isOwner = folder.Collection.WorkSpace.UserId == _currentUserService.UserId;
            bool hasEditPermission = false;
            
            if (!isOwner)
            {
                hasEditPermission = await _collaborationService.HasCollectionAccessAsync(
                    folder.CollectionId, CollaborationPermission.Edit);
            }
            
            if (!isOwner && !hasEditPermission)
            {
                _logger.LogWarning("User {UserId} attempted to delete folder {Id} without permission", 
                    _currentUserService.UserId, folder.Id);
                throw new UnauthorizedAccessException("You don't have permission to delete this folder");
            }
            
            folder.IsDeleted = true;
            folder.UpdatedAt = DateTime.UtcNow;
            folder.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            folder.IsSync = false;
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Folder with ID: {Id} deleted successfully", id);
            
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
            _logger.LogError(ex, "Error deleting folder with ID: {Id}", id);
            throw;
        }
    }
    
}