using dev.Application.Common.Models;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Request.Queries;


public record GetRequestsQuery : IRequest<Result<List<RequestDto>>>;

public class GetRequestsQueryHandler : IRequestHandler<GetRequestsQuery, Result<List<RequestDto>>>
{
    private readonly IRequestService _requestService;

    public GetRequestsQueryHandler(IRequestService requestService)
    {
        _requestService = requestService;
    }

    public async Task<Result<List<RequestDto>>> Handle(GetRequestsQuery requestsQuery, CancellationToken cancellationToken)
    {
        try
        {
            var requests = await _requestService.GetAllRequestsAsync();
            return Result<List<RequestDto>>.Success(requests);
        }
        catch (Exception ex)
        {
            return Result<List<RequestDto>>.Failure($"Failed to get requests: {ex.Message}");
        }
    }
}