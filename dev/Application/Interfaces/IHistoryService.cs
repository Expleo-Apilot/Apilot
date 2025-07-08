using dev.Application.DTOs.History;

namespace dev.Application.Interfaces;

public interface IHistoryService
{
    Task<HistoryDto> CreateHistoryAsync(CreateHistoryDto historyDto);
    Task<List<HistoryDto>> GetHistoriesAsync();
    Task<HistoryDto> GetHistoryByIdAsync(int id);
    Task<List<HistoryDto>> GetHistoryByWorkspaceIdAsync(int id);
    Task DeleteHistoryAsync(int id);
}