using AutoMapper;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using dev.Application.Interfaces.Services;
using dev.Domain.Entities;
using dev.Domain.Enums;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace dev.Infrastructure.Services;

public class RequestService : IRequestService
{
    
    private readonly ILogger<RequestService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICollaborationService _collaborationService;

    public RequestService(
        ApplicationDbContext context, 
        ILogger<RequestService> logger, 
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
    
    
    public async Task<RequestDto> CreateRequestAsync(CreateRequestDto requestDto)
    {
        try
        {
            _logger.LogInformation("Creating request with name: {Name}", requestDto.Name);
            
            // Check if user has permission to create a request in this collection
            if (requestDto.CollectionId.HasValue)
            {
                var collection = await _context.Collections
                    .Include(c => c.WorkSpace)
                    .FirstOrDefaultAsync(c => c.Id == requestDto.CollectionId);
                    
                if (collection == null)
                {
                    _logger.LogWarning("Collection with ID {Id} not found", requestDto.CollectionId);
                    throw new KeyNotFoundException($"Collection with ID {requestDto.CollectionId} not found");
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
                    _logger.LogWarning("User {UserId} attempted to create request in collection {Id} without permission", 
                        _currentUserService.UserId, collection.Id);
                    throw new UnauthorizedAccessException("You don't have permission to create requests in this collection");
                }
            }
            else if (requestDto.FolderId.HasValue)
            {
                // If request is being added to a folder, check folder permissions
                var folder = await _context.Folders
                    .Include(f => f.Collection)
                    .ThenInclude(c => c.WorkSpace)
                    .FirstOrDefaultAsync(f => f.Id == requestDto.FolderId);
                    
                if (folder == null)
                {
                    _logger.LogWarning("Folder with ID {Id} not found", requestDto.FolderId);
                    throw new KeyNotFoundException($"Folder with ID {requestDto.FolderId} not found");
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
                    _logger.LogWarning("User {UserId} attempted to create request in folder {Id} without permission", 
                        _currentUserService.UserId, folder.Id);
                    throw new UnauthorizedAccessException("You don't have permission to create requests in this folder");
                }
            }
            
            var request = _mapper.Map<RequestEntity>(requestDto);
            
            request.CreatedAt = DateTime.Now;
            request.CreatedBy = _currentUserService.UserName ?? "unknown";
            request.SyncId = Guid.NewGuid();
            request.IsSync = false;
            request.IsDeleted = false;
            
            await _context.Requests.AddAsync(request);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Request created successfully with ID: {Id}", request.Id);
            return _mapper.Map<RequestDto>(request);
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
            _logger.LogError(ex, "Error creating request with name: {Name}", requestDto.Name);
            throw;
        }
    }

    
    public async Task<List<RequestDto>> GetAllRequestsAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all requests");
            
            var requests = await _context.Requests
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} requests", requests.Count);
            return _mapper.Map<List<RequestDto>>(requests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all requests");
            throw;
        }
    }

    
    
    public async Task<RequestDto> GetRequestByIdAsync(int id)
    {
        _logger.LogInformation("Attempting to find request with ID: {Id}", id);

        try
        {
            var request = await _context.Requests
                .Include(req => req.Responses)
                .Include(r => r.Collection)
                .ThenInclude(c => c.WorkSpace)
                .Include(r => r.Folder)
                .ThenInclude(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                _logger.LogWarning("Request with ID {Id} not found", id);
                throw new KeyNotFoundException($"Request with ID {id} not found");
            }
            
            // Check if user has permission to view this request
            bool isOwner = false;
            int collectionId = 0;
            
            if (request.Collection != null)
            {
                isOwner = request.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = (int)request.CollectionId;
            }
            else if (request.Folder != null && request.Folder.Collection != null)
            {
                isOwner = request.Folder.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = request.Folder.CollectionId;
            }
            
            bool hasViewPermission = false;
            
            if (!isOwner && collectionId > 0)
            {
                hasViewPermission = await _collaborationService.HasCollectionAccessAsync(
                    collectionId, CollaborationPermission.View);
            }
            
            if (!isOwner && !hasViewPermission)
            {
                _logger.LogWarning("User {UserId} attempted to view request {Id} without permission", 
                    _currentUserService.UserId, request.Id);
                throw new UnauthorizedAccessException("You don't have permission to view this request");
            }

            _logger.LogInformation("Request with ID {Id} found", id);
            return _mapper.Map<RequestDto>(request);
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
            _logger.LogError(ex, "An error occurred while retrieving the request with ID {Id}", id);
            throw;
        }
    }

    
    
    public async Task<List<RequestDto>> GetRequestsByCollectionIdAsync(int collectionId)
    {
        try
        {
            _logger.LogInformation("Fetching requests for collection ID: {CollectionId}", collectionId);
            
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
                _logger.LogWarning("User {UserId} attempted to access requests in collection {Id} without permission", 
                    _currentUserService.UserId, collection.Id);
                throw new UnauthorizedAccessException("You don't have permission to access requests in this collection");
            }
            
            var requests = await _context.Requests
                .Include(req => req.Responses)
                .Where(r => r.CollectionId == collectionId)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} requests for collection ID: {CollectionId}", 
                requests.Count, collectionId);
            return _mapper.Map<List<RequestDto>>(requests);
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
            _logger.LogError(ex, "Error fetching requests for collection ID: {CollectionId}", collectionId);
            throw;
        }
    }

    
    
    public async Task<List<RequestDto>> GetRequestsByFolderIdAsync(int folderId)
    {
        try
        {
            _logger.LogInformation("Fetching requests for folder ID: {FolderId}", folderId);
            
            // Check if user has access to the folder's collection
            var folder = await _context.Folders
                .Include(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(f => f.Id == folderId);
                
            if (folder == null)
            {
                _logger.LogWarning("Folder with ID {Id} not found", folderId);
                throw new KeyNotFoundException($"Folder with ID {folderId} not found");
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
                _logger.LogWarning("User {UserId} attempted to access requests in folder {Id} without permission", 
                    _currentUserService.UserId, folder.Id);
                throw new UnauthorizedAccessException("You don't have permission to access requests in this folder");
            }
            
            var requests = await _context.Requests
                .Include(req => req.Responses)
                .Where(r => r.FolderId == folderId)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} requests for folder ID: {FolderId}", 
                requests.Count, folderId);
            return _mapper.Map<List<RequestDto>>(requests);
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
            _logger.LogError(ex, "Error fetching requests for folder ID: {FolderId}", folderId);
            throw;
        }
    }

    
    
    public async Task UpdateRequestAsync(UpdateRequestDto requestDto)
    {
        try
        {
            _logger.LogInformation("Updating request with ID: {Id}", requestDto.Id);
            
            var request = await _context.Requests
                .Include(r => r.Collection)
                .ThenInclude(c => c.WorkSpace)
                .Include(r => r.Folder)
                .ThenInclude(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(r => r.Id == requestDto.Id);
            
            if (request == null)
            {
                _logger.LogWarning("Request with ID {Id} not found for update", requestDto.Id);
                throw new KeyNotFoundException($"Request with ID {requestDto.Id} not found");
            }
            
            // Check if user has permission to update this request
            bool isOwner = false;
            int? collectionId = null;
            
            if (request.Collection != null)
            {
                isOwner = request.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = request.CollectionId;
            }
            else if (request.Folder != null && request.Folder.Collection != null)
            {
                isOwner = request.Folder.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = request.Folder.CollectionId;
            }
            
            bool hasEditPermission = false;
            
            if (!isOwner && collectionId.HasValue)
            {
                hasEditPermission = await _collaborationService.HasCollectionAccessAsync(
                    collectionId.Value, CollaborationPermission.Edit);
            }
            
            if (!isOwner && !hasEditPermission)
            {
                _logger.LogWarning("User {UserId} attempted to update request {Id} without permission", 
                    _currentUserService.UserId, request.Id);
                throw new UnauthorizedAccessException("You don't have permission to update this request");
            }
            
            _mapper.Map(requestDto, request);
            
            request.UpdatedAt = DateTime.UtcNow;
            request.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            request.IsSync = false; 
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Request with ID: {Id} updated successfully", request.Id);
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
            _logger.LogError(ex, "Error updating request with ID: {Id}", requestDto.Id);
            throw;
        }
    }

    
    
   public async Task DeleteRequestAsync(int id)
{
    _logger.LogInformation("Deleting request with ID: {Id} and all associated responses", id);

    try
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        
        try
        {
            var request = await _context.Requests
                .Include(r => r.Responses)
                .Include(r => r.Collection)
                .ThenInclude(c => c.WorkSpace)
                .Include(r => r.Folder)
                .ThenInclude(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                _logger.LogWarning("Request with ID {Id} not found for deletion", id);
                throw new KeyNotFoundException($"Request with ID {id} not found");
            }
            
            // Check if user has permission to delete this request
            bool isOwner = false;
            int? collectionId = null;
            
            if (request.Collection != null)
            {
                isOwner = request.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = request.CollectionId;
            }
            else if (request.Folder != null && request.Folder.Collection != null)
            {
                isOwner = request.Folder.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = request.Folder.CollectionId;
            }
            
            bool hasEditPermission = false;
            
            if (!isOwner && collectionId.HasValue)
            {
                hasEditPermission = await _collaborationService.HasCollectionAccessAsync(
                    collectionId.Value, CollaborationPermission.Edit);
            }
            
            if (!isOwner && !hasEditPermission)
            {
                _logger.LogWarning("User {UserId} attempted to delete request {Id} without permission", 
                    _currentUserService.UserId, request.Id);
                throw new UnauthorizedAccessException("You don't have permission to delete this request");
            }
            
            if (request.Responses != null && request.Responses.Any())
            {
                _logger.LogInformation("Removing {Count} responses for request {Id}", request.Responses.Count, request.Id);
                _context.Responses.RemoveRange(request.Responses);
            }
            
            _logger.LogInformation("Removing request {Id}", id);
            _context.Requests.Remove(request);
            
            await _context.SaveChangesAsync();
            
            await transaction.CommitAsync();
            
            _logger.LogInformation("Request with ID {Id} and all associated responses deleted successfully", id);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (UnauthorizedAccessException)
        {
            await transaction.RollbackAsync();
            throw;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Transaction rolled back. An error occurred while deleting the request {Id} and its associated responses", id);
            throw;
        }
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
        _logger.LogError(ex, "An error occurred while deleting the request with ID {Id}", id);
        throw;
    }
}
}