using dev.Application.DTOs.Collection;

namespace dev.Application.Interfaces;

public interface ICollectionService
{
    Task<CollectionDto> CreateCollectionAsync(CreateCollectionDto collectionDto);
    Task<List<CollectionDto>> GetAllCollectionsAsync();
    Task<CollectionDto> GetCollectionByIdAsync(int id);
    Task<List<CollectionDto>> GetCollectionsByWorkspaceIdAsync(int workspaceId);
    Task UpdateCollectionAsync(UpdateCollectionDto collectionDto);
    Task DeleteCollectionAsync(int id);
}