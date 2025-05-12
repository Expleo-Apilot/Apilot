using dev.Application.Common.Models;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.History.Commands;

public record DeleteHistoryCommand : IRequest<Result<Unit>>
{
    public required int Id { get; init; }
}


public class DeleteHistoryCommandHandler : IRequestHandler<DeleteHistoryCommand, Result<Unit>>
{
    
    private readonly IHistoryService _historyService;

    public DeleteHistoryCommandHandler(IHistoryService historyService)
    {
        _historyService = historyService;
    }

    public async Task<Result<Unit>> Handle(DeleteHistoryCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _historyService.DeleteHistoryAsync(request.Id);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to delete history: {ex.Message}");
        }
    }
}