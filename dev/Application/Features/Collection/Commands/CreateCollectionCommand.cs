using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Collection.Commands;

public record CreateCollectionCommand : IRequest<Result<CollectionDto>>
{
    public required CreateCollectionDto CreateCollectionRequest { get; init; }
}


public class CreateCollectionCommandHandler : IRequestHandler<CreateCollectionCommand, Result<CollectionDto>>
{
    
    private readonly ICollectionService _collectionService;

    public CreateCollectionCommandHandler(ICollectionService collectionService)
    {
        _collectionService = collectionService;
    }

    
    public async Task<Result<CollectionDto>> Handle(CreateCollectionCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var collection = await _collectionService.CreateCollectionAsync(request.CreateCollectionRequest);
            return Result<CollectionDto>.Success(collection);
        }
        catch (Exception ex)
        {
            return Result<CollectionDto>.Failure($"Failed to create collection: {ex.Message}");
        }
    }
}