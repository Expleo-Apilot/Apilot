using dev.Application.Common.Models;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Collection.Commands;



public record DeleteCollectionCommand : IRequest<Result<Unit>>
{
    public required int Id { get; init; }
}



public class DeleteCollectionCommandHandler : IRequestHandler<DeleteCollectionCommand, Result<Unit>>
{
    
    private readonly ICollectionService _collectionService;

    
    public DeleteCollectionCommandHandler(ICollectionService collectionService)
    {
        _collectionService = collectionService;
    }

    
    public async Task<Result<Unit>> Handle(DeleteCollectionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _collectionService.DeleteCollectionAsync(request.Id);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to delete collection: {ex.Message}");
        }
    }
}