using dev.Application.DTOs.Request;
using dev.Application.DTOs.Response;

namespace dev.Application.Interfaces;

public interface IPerformRequestService
{
    
    Task<HttpResponseDto> GetAsync(PerformRequestDto request);
    Task<HttpResponseDto> PostAsync(PerformRequestDto request);
    Task<HttpResponseDto> PutAsync(PerformRequestDto request);
    Task<HttpResponseDto> DeleteAsync(PerformRequestDto request);
    Task<HttpResponseDto> PatchAsync(PerformRequestDto request);
}