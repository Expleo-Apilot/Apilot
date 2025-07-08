using dev.Application.Common.Models;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Response.Queries;

public record GetResponsesQuery : IRequest<Result<List<ResponseDto>>>;


public class GetResponsesQueryHandler : IRequestHandler<GetResponsesQuery, Result<List<ResponseDto>>>
{
    
    private readonly IResponseService _responseService;

    public GetResponsesQueryHandler(IResponseService responseService)
    {
        _responseService = responseService;
    }

    public async Task<Result<List<ResponseDto>>> Handle(GetResponsesQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var responses = await _responseService.GetAllResponsesAsync();
            return Result<List<ResponseDto>>.Success(responses);
        }
        catch (Exception ex)
        {
            return Result<List<ResponseDto>>.Failure($"Failed to get responses: {ex.Message}");
        }
    }
}