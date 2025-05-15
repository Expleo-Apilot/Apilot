using AutoMapper;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using dev.Domain.Entities;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace dev.Infrastructure.Services;

public class RequestService : IRequestService
{
    
    private readonly ILogger<RequestService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public RequestService(ApplicationDbContext context, ILogger<RequestService> logger, IMapper mapper)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }
    
    
    public async Task<RequestDto> CreateRequestAsync(CreateRequestDto requestDto)
    {
        try
        {
            _logger.LogInformation("Creating request with name: {Name}", requestDto.Name);
            
            var request = _mapper.Map<RequestEntity>(requestDto);
            
            request.CreatedAt = DateTime.Now;
            request.CreatedBy = "Admin";
            request.SyncId = Guid.NewGuid();
            request.IsSync = false;
            request.IsDeleted = false;
            
            await _context.Requests.AddAsync(request);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Request created successfully with ID: {Id}", request.Id);
            return _mapper.Map<RequestDto>(request);
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
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                _logger.LogWarning("Request with ID {Id} not found", id);
                throw new KeyNotFoundException($"Request with ID {id} not found");
            }

            _logger.LogInformation("Request with ID {Id} found", id);
            return _mapper.Map<RequestDto>(request);
        }
        catch (KeyNotFoundException)
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
            
            var requests = await _context.Requests
                .Include(req => req.Responses)
                .Where(r => r.CollectionId == collectionId)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} requests for collection ID: {CollectionId}", 
                requests.Count, collectionId);
            return _mapper.Map<List<RequestDto>>(requests);
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
            
            var requests = await _context.Requests
                .Include(req => req.Responses)
                .Where(r => r.FolderId == folderId)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} requests for folder ID: {FolderId}", 
                requests.Count, folderId);
            return _mapper.Map<List<RequestDto>>(requests);
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
                .FirstOrDefaultAsync(r => r.Id == requestDto.Id);
            
            if (request == null)
            {
                _logger.LogWarning("Request with ID {Id} not found for update", requestDto.Id);
                throw new KeyNotFoundException($"Request with ID {requestDto.Id} not found");
            }
            _mapper.Map(requestDto, request);
            
            request.UpdatedAt = DateTime.UtcNow;
            request.UpdatedBy = "admin"; 
            request.IsSync = false; 
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Request with ID: {Id} updated successfully", request.Id);
        }
        catch (KeyNotFoundException)
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
                .FirstOrDefaultAsync(r => r.Id == id);

            if (request == null)
            {
                _logger.LogWarning("Request with ID {Id} not found for deletion", id);
                throw new KeyNotFoundException($"Request with ID {id} not found");
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
    catch (Exception ex)
    {
        _logger.LogError(ex, "An error occurred while deleting the request with ID {Id}", id);
        throw;
    }
}
}