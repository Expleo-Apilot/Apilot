using dev.Application.Common.Models;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Request.Queries;



public record GetRequestByIdQuery : IRequest<Result<RequestDto>>
{
    public required int RequestId { get; init; }
}

public class GetRequestByIdQueryHandler : IRequestHandler<GetRequestByIdQuery, Result<RequestDto>>
{
    private readonly IRequestService _requestService;

    public GetRequestByIdQueryHandler(IRequestService requestService)
    {
        _requestService = requestService;
    }

    public async Task<Result<RequestDto>> Handle(GetRequestByIdQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var request = await _requestService.GetRequestByIdAsync(query.RequestId);
            return Result<RequestDto>.Success(request);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<RequestDto>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<RequestDto>.Failure($"Failed to get request: {ex.Message}");
        }
    }
}