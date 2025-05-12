using dev.Application.DTOs.Response;

namespace dev.Application.Interfaces;

public interface IResponseService
{
    Task<ResponseDto> CreateResponseAsync(CreateResponseDto responseDto);
    Task<List<ResponseDto>> GetAllResponsesAsync();
    Task<ResponseDto> GetResponseByIdAsync(int id);
    Task<List<ResponseDto>> GetResponsesByRequestIdAsync(int requestId);
    Task DeleteResponseAsync(int id);
}