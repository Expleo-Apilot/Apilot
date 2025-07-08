using AutoMapper;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using dev.Application.Interfaces.Services;
using dev.Domain.Entities;
using dev.Domain.Enums;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace dev.Infrastructure.Services;

public class ResponseService : IResponseService
{
    
    private readonly ILogger<ResponseService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;
    private readonly ICurrentUserService _currentUserService;
    private readonly ICollaborationService _collaborationService;

    public ResponseService(
        ApplicationDbContext context, 
        ILogger<ResponseService> logger, 
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
    
    public async Task<ResponseDto> CreateResponseAsync(CreateResponseDto responseDto)
    {
        try
        {
            _logger.LogInformation("Creating response for request ID: {RequestId}", responseDto.RequestId);
            
            // Check if user has permission to create a response for this request
            var request = await _context.Requests
                .Include(r => r.Collection)
                .ThenInclude(c => c.WorkSpace)
                .Include(r => r.Folder)
                .ThenInclude(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(r => r.Id == responseDto.RequestId);
                
            if (request == null)
            {
                _logger.LogWarning("Request with ID {Id} not found", responseDto.RequestId);
                throw new KeyNotFoundException($"Request with ID {responseDto.RequestId} not found");
            }
            
            // Check if user is the owner or has edit permission
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
            
            bool hasEditPermission = false;
            
            if (!isOwner && collectionId > 0)
            {
                hasEditPermission = await _collaborationService.HasCollectionAccessAsync(
                    collectionId, CollaborationPermission.Edit);
            }
            
            if (!isOwner && !hasEditPermission)
            {
                _logger.LogWarning("User {UserId} attempted to create response for request {Id} without permission", 
                    _currentUserService.UserId, request.Id);
                throw new UnauthorizedAccessException("You don't have permission to create responses for this request");
            }
            
            var response = _mapper.Map<ResponseEntity>(responseDto);
            response.CreatedAt = DateTime.Now;
            response.CreatedBy = _currentUserService.UserName ?? "unknown";
            response.SyncId = Guid.NewGuid();
            response.IsSync = false;
            response.IsDeleted = false;
            
            await _context.Responses.AddAsync(response);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Response created successfully with ID: {Id}", response.Id);
            return _mapper.Map<ResponseDto>(response);
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
            _logger.LogError(ex, "Error creating response for request ID: {RequestId}", responseDto.RequestId);
            throw;
        }
    }

    
    public async Task<List<ResponseDto>> GetAllResponsesAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all responses");
            
            var responses = await _context.Responses
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} responses", responses.Count);
            return _mapper.Map<List<ResponseDto>>(responses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all responses");
            throw;
        }
    }

    
    public async Task<ResponseDto> GetResponseByIdAsync(int id)
    {
        _logger.LogInformation("Attempting to find response with ID: {Id}", id);

        try
        {
            var response = await _context.Responses
                .Include(r => r.Request)
                .ThenInclude(req => req.Collection)
                .ThenInclude(c => c.WorkSpace)
                .Include(r => r.Request)
                .ThenInclude(req => req.Folder)
                .ThenInclude(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (response == null)
            {
                _logger.LogWarning("Response with ID {Id} not found", id);
                throw new KeyNotFoundException($"Response with ID {id} not found");
            }
            
            // Check if user has permission to view this response
            bool isOwner = false;
            int collectionId = 0;
            
            if (response.Request.Collection != null)
            {
                isOwner = response.Request.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = (int)response.Request.CollectionId;
            }
            else if (response.Request.Folder != null && response.Request.Folder.Collection != null)
            {
                isOwner = response.Request.Folder.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = response.Request.Folder.CollectionId;
            }
            
            bool hasViewPermission = false;
            
            if (!isOwner && collectionId > 0)
            {
                hasViewPermission = await _collaborationService.HasCollectionAccessAsync(
                    collectionId, CollaborationPermission.View);
            }
            
            if (!isOwner && !hasViewPermission)
            {
                _logger.LogWarning("User {UserId} attempted to view response {Id} without permission", 
                    _currentUserService.UserId, response.Id);
                throw new UnauthorizedAccessException("You don't have permission to view this response");
            }

            _logger.LogInformation("Response with ID {Id} found", id);
            return _mapper.Map<ResponseDto>(response);
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
            _logger.LogError(ex, "An error occurred while retrieving the response with ID {Id}", id);
            throw;
        }
    }

    
    public async Task<List<ResponseDto>> GetResponsesByRequestIdAsync(int requestId)
    {
        try
        {
            _logger.LogInformation("Fetching responses for request ID: {RequestId}", requestId);
            
            // Check if user has permission to view responses for this request
            var request = await _context.Requests
                .Include(r => r.Collection)
                .ThenInclude(c => c.WorkSpace)
                .Include(r => r.Folder)
                .ThenInclude(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(r => r.Id == requestId);
                
            if (request == null)
            {
                _logger.LogWarning("Request with ID {Id} not found", requestId);
                throw new KeyNotFoundException($"Request with ID {requestId} not found");
            }
            
            // Check if user is the owner or has view permission
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
                _logger.LogWarning("User {UserId} attempted to view responses for request {Id} without permission", 
                    _currentUserService.UserId, request.Id);
                throw new UnauthorizedAccessException("You don't have permission to view responses for this request");
            }
            
            var responses = await _context.Responses
                .Where(r => r.RequestId == requestId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} responses for request ID: {RequestId}", 
                responses.Count, requestId);
            return _mapper.Map<List<ResponseDto>>(responses);
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
            _logger.LogError(ex, "Error fetching responses for request ID: {RequestId}", requestId);
            throw;
        }
    }

    
    public async Task DeleteResponseAsync(int id)
    {
        try
        {
            _logger.LogInformation("Attempting to delete response with ID: {Id}", id);
            
            var response = await _context.Responses
                .Include(r => r.Request)
                .ThenInclude(req => req.Collection)
                .ThenInclude(c => c.WorkSpace)
                .Include(r => r.Request)
                .ThenInclude(req => req.Folder)
                .ThenInclude(f => f.Collection)
                .ThenInclude(c => c.WorkSpace)
                .FirstOrDefaultAsync(r => r.Id == id);
            
            if (response == null)
            {
                _logger.LogWarning("Response with ID {Id} not found for deletion", id);
                throw new KeyNotFoundException($"Response with ID {id} not found");
            }
            
            // Check if user has permission to delete this response
            bool isOwner = false;
            int collectionId = 0;
            
            if (response.Request.Collection != null)
            {
                isOwner = response.Request.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = (int)response.Request.CollectionId;
            }
            else if (response.Request.Folder != null && response.Request.Folder.Collection != null)
            {
                isOwner = response.Request.Folder.Collection.WorkSpace.UserId == _currentUserService.UserId;
                collectionId = response.Request.Folder.CollectionId;
            }
            
            bool hasEditPermission = false;
            
            if (!isOwner && collectionId > 0)
            {
                hasEditPermission = await _collaborationService.HasCollectionAccessAsync(
                    collectionId, CollaborationPermission.Edit);
            }
            
            if (!isOwner && !hasEditPermission)
            {
                _logger.LogWarning("User {UserId} attempted to delete response {Id} without permission", 
                    _currentUserService.UserId, response.Id);
                throw new UnauthorizedAccessException("You don't have permission to delete this response");
            }
            
            response.IsDeleted = true;
            response.UpdatedAt = DateTime.UtcNow;
            response.UpdatedBy = _currentUserService.UserName ?? "unknown"; 
            response.IsSync = false;
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Response with ID: {Id} deleted successfully", id);
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
            _logger.LogError(ex, "Error deleting response with ID: {Id}", id);
            throw;
        }
    }
}