using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.History;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.History.Queries;

public record GetHistoryByIdQuery : IRequest<Result<HistoryDto>>
{
    public required int Id { get; init; }
}


public class GetHistoryByIdQueryHandler : IRequestHandler<GetHistoryByIdQuery, Result<HistoryDto>>
{
    
    private readonly IHistoryService _historyService;

    public GetHistoryByIdQueryHandler(IHistoryService historyService)
    {
        _historyService = historyService;
    }

    public async Task<Result<HistoryDto>> Handle(GetHistoryByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var history = await _historyService.GetHistoryByIdAsync(request.Id);
            return Result<HistoryDto>.Success(history);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<HistoryDto>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<HistoryDto>.Failure($"Failed to get history: {ex.Message}");
        }
    }
}