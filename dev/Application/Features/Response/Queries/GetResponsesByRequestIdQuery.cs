using dev.Application.Common.Models;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Response.Queries;


public record GetResponsesByRequestIdQuery : IRequest<Result<List<ResponseDto>>>
{
    public required int RequestId { get; init; }
}


public class GetResponsesByRequestIdQueryHandler : IRequestHandler<GetResponsesByRequestIdQuery, Result<List<ResponseDto>>>
{
    
    private readonly IResponseService _responseService;

    public GetResponsesByRequestIdQueryHandler(IResponseService responseService)
    {
        _responseService = responseService;
    }

    public async Task<Result<List<ResponseDto>>> Handle(GetResponsesByRequestIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var responses = await _responseService.GetResponsesByRequestIdAsync(request.RequestId);
            return Result<List<ResponseDto>>.Success(responses);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<List<ResponseDto>>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<List<ResponseDto>>.Failure($"Failed to get responses: {ex.Message}");
        }
    }
}