using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.History;
using dev.Application.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore.Migrations;

namespace dev.Application.Features.History.Commands;

public record CreateHistoryCommand : IRequest<Result<HistoryDto>>
{
    public required CreateHistoryDto HistoryDto { get; init; }
}


public class CreateHistoryCommandHandler : IRequestHandler<CreateHistoryCommand, Result<HistoryDto>>
{
    private readonly IHistoryService _historyService;

    public CreateHistoryCommandHandler(IHistoryService historyService)
    {
        _historyService = historyService;
    }

    public async Task<Result<HistoryDto>> Handle(CreateHistoryCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var history = await _historyService.CreateHistoryAsync(request.HistoryDto);
            return Result<HistoryDto>.Success(history);
        }
        catch (Exception ex)
        {
            return Result<HistoryDto>.Failure($"Failed to create history: {ex.Message}");
        }
    }
}