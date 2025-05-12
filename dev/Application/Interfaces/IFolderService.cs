using dev.Application.DTOs.Folder;

namespace dev.Application.Interfaces;

public interface IFolderService
{
    Task<FolderDto> CreateFolderAsync(CreateFolderDto folderDto);
    Task<List<FolderDto>> GetAllFoldersAsync();
    Task<FolderDto> GetFolderByIdAsync(int id);
    Task<List<FolderDto>> GetFoldersByCollectionIdAsync(int collectionId);
    Task UpdateFolderAsync(UpdateFolderDto folderDto);
    Task DeleteFolderAsync(int id);
}