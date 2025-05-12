using dev.Application.DTOs.Request;

namespace dev.Application.Interfaces;

public interface IRequestService
{
    Task<RequestDto> CreateRequestAsync(CreateRequestDto requestDto);
    Task<List<RequestDto>> GetAllRequestsAsync();
    Task<RequestDto> GetRequestByIdAsync(int id);
    Task<List<RequestDto>> GetRequestsByCollectionIdAsync(int collectionId);
    Task<List<RequestDto>> GetRequestsByFolderIdAsync(int folderId);
    Task UpdateRequestAsync(UpdateRequestDto requestDto);
    Task DeleteRequestAsync(int id);
}