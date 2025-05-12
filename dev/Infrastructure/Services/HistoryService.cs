using AutoMapper;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.History;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using dev.Domain.Entities;
using dev.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace dev.Infrastructure.Services;

public class HistoryService : IHistoryService
{
    
    private readonly ILogger<HistoryService> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public HistoryService(ApplicationDbContext context, ILogger<HistoryService> logger, IMapper mapper)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
    }
    
    
    public async Task<HistoryDto> CreateHistoryAsync(CreateHistoryDto historyDto)
    {
        try
        {
            _logger.LogInformation("Creating history ");
            
            var history = new HistoryEntity
            {
                WorkSpaceId = historyDto.WorkSpaceId,
                IsDeleted = false,
                TimeStamp = historyDto.TimeStamp,
                Requests =  historyDto.Requests ,
            };
            
            
            await _context.Histories.AddAsync(history);
            await _context.SaveChangesAsync();
            
            _logger.LogInformation("Collection created successfully with ID: {Id}", history.Id);
            return _mapper.Map<HistoryDto>(history);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating history ");
            throw;
        }
    }

    
    
    public async Task<List<HistoryDto>> GetHistoriesAsync()
    {
        try
        {
            _logger.LogInformation("Fetching all histories");
            
            var histories = await _context.Histories
                .ToListAsync();
            
            _logger.LogInformation("Retrieved {Count} histories", histories.Count);
            return _mapper.Map<List<HistoryDto>>(histories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching all histories");
            throw;
        }
    }

    
    
    public async Task<HistoryDto> GetHistoryByIdAsync(int id)
    {
        _logger.LogInformation("Attempting to find history with ID: {Id}", id);

        try
        {
            var history = await _context.Histories
                .FirstOrDefaultAsync(w => w.Id == id );

            if (history == null)
            {
                _logger.LogWarning("History with ID {Id} not found ", id);
                throw new KeyNotFoundException($"History with ID {id} not found");
            }

            _logger.LogInformation("Collection with ID {Id} found", id);
            return _mapper.Map<HistoryDto>(history);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while retrieving the history with ID {Id}", id);
            throw;
        }
    }

    
    
    public async Task<List<HistoryDto>> GetHistoryByWorkspaceIdAsync(int id)
    {
        try
        {
            _logger.LogInformation("Fetching histories for workspace ID: {WorkspaceId}", id);
        
            var histories = await _context.Histories
                .Where(c => c.WorkSpaceId == id)
                .ToListAsync();
        
            _logger.LogInformation("Retrieved {Count} Histories for workspace ID: {WorkspaceId}", 
                histories.Count, id);
            return _mapper.Map<List<HistoryDto>>(histories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching histories for workspace ID: {WorkspaceId}", id);
            throw;
        }
    }

    
    
    public async Task DeleteHistoryAsync(int id)
    {
        try
        {
            _logger.LogInformation("Attempting to delete history with ID: {Id}", id);

            var history = await _context.Histories.FindAsync(id);

            if (history == null)
            {
                _logger.LogWarning("History with ID {Id} not found for deletion", id);
                throw new KeyNotFoundException($"History with ID {id} not found");
            }

            
            history.IsDeleted = true;
            
            await _context.SaveChangesAsync();

            _logger.LogInformation("History with ID: {Id} deleted successfully", id);
        }
        catch (KeyNotFoundException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting history with ID: {Id}", id);
            throw;
        }
    }
}