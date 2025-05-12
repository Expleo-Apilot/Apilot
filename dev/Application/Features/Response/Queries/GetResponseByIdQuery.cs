using dev.Application.Common.Models;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Response.Queries;


public record GetResponseByIdQuery :IRequest<Result<ResponseDto>>
{
    public required int Id { get; init; }
}


public class GetResponseByIdQueryHandler : IRequestHandler<GetResponseByIdQuery, Result<ResponseDto>>
{
    
    private readonly IResponseService _responseService;

    public GetResponseByIdQueryHandler(IResponseService responseService)
    {
        _responseService = responseService;
    }

    public async Task<Result<ResponseDto>> Handle(GetResponseByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var response = await _responseService.GetResponseByIdAsync(request.Id);
            return Result<ResponseDto>.Success(response);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<ResponseDto>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<ResponseDto>.Failure($"Failed to get response: {ex.Message}");
        }
    }
}