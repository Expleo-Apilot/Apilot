using AutoMapper;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using dev.Domain.Entities;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace dev.Infrastructure.Services;

public class ResponseService : IResponseService
{
    
    private readonly ILogger<ResponseService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public ResponseService(ApplicationDbContext context, ILogger<ResponseService> logger, IMapper mapper)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }
    
    public async Task<ResponseDto> CreateResponseAsync(CreateResponseDto responseDto)
    {
        try
        {
            _logger.LogInformation("Creating response for request ID: {RequestId}", responseDto.RequestId);
            
            var response = _mapper.Map<ResponseEntity>(responseDto);
            response.CreatedAt = DateTime.Now;
            response.CreatedBy = "Admin";
            response.SyncId = Guid.NewGuid();
            response.IsSync = false;
            response.IsDeleted = false;
            
            await _context.Responses.AddAsync(response);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Response created successfully with ID: {Id}", response.Id);
            return _mapper.Map<ResponseDto>(response);
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
                .FirstOrDefaultAsync(r => r.Id == id);

            if (response == null)
            {
                _logger.LogWarning("Response with ID {Id} not found", id);
                throw new KeyNotFoundException($"Response with ID {id} not found");
            }

            _logger.LogInformation("Response with ID {Id} found", id);
            return _mapper.Map<ResponseDto>(response);
        }
        catch (KeyNotFoundException)
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
            
            var responses = await _context.Responses
                .Where(r => r.RequestId == requestId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} responses for request ID: {RequestId}", 
                responses.Count, requestId);
            return _mapper.Map<List<ResponseDto>>(responses);
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
            
            var response = await _context.Responses.FindAsync(id);
            
            if (response == null)
            {
                _logger.LogWarning("Response with ID {Id} not found for deletion", id);
                throw new KeyNotFoundException($"Response with ID {id} not found");
            }
            
            response.IsDeleted = true;
            response.UpdatedAt = DateTime.UtcNow;
            response.UpdatedBy = "admin"; 
            response.IsSync = false;
            
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Response with ID: {Id} deleted successfully", id);
        }
        catch (KeyNotFoundException)
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