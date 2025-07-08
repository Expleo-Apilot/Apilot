using dev.Application.Common.Models;
using dev.Application.DTOs.History;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.History.Queries;

public record GetHistoriesQuery : IRequest<Result<List<HistoryDto>>>;


public class GetHistoriesQueryHandler : IRequestHandler<GetHistoriesQuery, Result<List<HistoryDto>>>
{
    
    private readonly IHistoryService _historyService;

    public GetHistoriesQueryHandler(IHistoryService historyService)
    {
        _historyService = historyService;
    }

    public async Task<Result<List<HistoryDto>>> Handle(GetHistoriesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var histories = await _historyService.GetHistoriesAsync();
            return Result<List<HistoryDto>>.Success(histories);
        }
        catch (Exception ex)
        {
            return Result<List<HistoryDto>>.Failure($"Failed to get histories: {ex.Message}");
        }
    }
}