using dev.Application.DTOs.Request;
using dev.Application.DTOs.TestScript;

namespace dev.Application.Interfaces;

public interface IRequestService
{
    Task<RequestDto> CreateRequestAsync(CreateRequestDto requestDto);
    Task<List<RequestDto>> GetAllRequestsAsync();
    Task<RequestDto> GetRequestByIdAsync(int id);
    Task<List<RequestDto>> GetRequestsByCollectionIdAsync(int collectionId);
    Task<List<RequestDto>> GetRequestsByFolderIdAsync(int folderId);
    Task UpdateRequestAsync(UpdateRequestDto requestDto);
    Task UpdateScriptAsync(CreateTestScriptDto requestDto);
    Task DeleteRequestAsync(int id);
}