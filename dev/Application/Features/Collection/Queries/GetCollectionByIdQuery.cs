using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Collection.Queries;



public record GetCollectionByIdQuery : IRequest<Result<CollectionDto>>
{
    public required int Id { get; init; }
}



public class GetCollectionByIdQueryHandler : IRequestHandler<GetCollectionByIdQuery, Result<CollectionDto>>
{

    private readonly ICollectionService _collectionService;

    public GetCollectionByIdQueryHandler(ICollectionService collectionService)
    {
        _collectionService = collectionService;
    }

    public async Task<Result<CollectionDto>> Handle(GetCollectionByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var collection = await _collectionService.GetCollectionByIdAsync(request.Id);
            return Result<CollectionDto>.Success(collection);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<CollectionDto>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<CollectionDto>.Failure($"Failed to get collection: {ex.Message}");
        }
    }
}