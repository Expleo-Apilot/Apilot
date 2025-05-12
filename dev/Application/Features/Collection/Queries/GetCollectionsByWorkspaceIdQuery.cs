using dev.Application.Common.Models;
using dev.Application.DTOs.Collection;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Collection.Queries;


public record GetCollectionsByWorkspaceIdQuery : IRequest<Result<List<CollectionDto>>>
{
    public required int WorkspaceId { get; init; }
}



public class GetCollectionsByWorkspaceIdQueryHandler : IRequestHandler<GetCollectionsByWorkspaceIdQuery, Result<List<CollectionDto>>>
{

    private readonly ICollectionService _collectionService;

    public GetCollectionsByWorkspaceIdQueryHandler(ICollectionService collectionService)
    {
        _collectionService = collectionService;
    }

    public async Task<Result<List<CollectionDto>>> Handle(GetCollectionsByWorkspaceIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var collections = await _collectionService.GetCollectionsByWorkspaceIdAsync(request.WorkspaceId);
            return Result<List<CollectionDto>>.Success(collections);
        }
        catch (Exception ex)
        {
            return Result<List<CollectionDto>>.Failure($"Failed to get collections: {ex.Message}");
        }
    }
}