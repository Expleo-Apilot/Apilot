using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.History;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.History.Queries;

public record GetHistoryByWorkspaceIdQuery : IRequest<Result<List<HistoryDto>>>
{
    public required int WorkspaceId { get; init; }
}


public class GetHistoryByWorkspaceIdQueryHandler : IRequestHandler<GetHistoryByWorkspaceIdQuery, Result<List<HistoryDto>>>
{
    
    private readonly IHistoryService _historyService;

    public GetHistoryByWorkspaceIdQueryHandler(IHistoryService historyService)
    {
        _historyService = historyService;
    }

    public async Task<Result<List<HistoryDto>>> Handle(GetHistoryByWorkspaceIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var histories = await _historyService.GetHistoryByWorkspaceIdAsync(request.WorkspaceId);
            return Result<List<HistoryDto>>.Success(histories);
        }
        catch (Exception ex)
        {
            return Result<List<HistoryDto>>.Failure($"Failed to get histories: {ex.Message}");
        }
    }
}