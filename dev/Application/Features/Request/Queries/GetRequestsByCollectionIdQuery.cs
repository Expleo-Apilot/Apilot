using dev.Application.Common.Models;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Request.Queries;



public record GetRequestsByCollectionIdQuery : IRequest<Result<List<RequestDto>>>
{
    public required int CollectionId { get; init; }
}

public class GetRequestsByCollectionIdQueryHandler : IRequestHandler<GetRequestsByCollectionIdQuery, Result<List<RequestDto>>>
{
    private readonly IRequestService _requestService;

    public GetRequestsByCollectionIdQueryHandler(IRequestService requestService)
    {
        _requestService = requestService;
    }

    public async Task<Result<List<RequestDto>>> Handle(GetRequestsByCollectionIdQuery query, CancellationToken cancellationToken)
    {
        try
        {
            var requests = await _requestService.GetRequestsByCollectionIdAsync(query.CollectionId);
            return Result<List<RequestDto>>.Success(requests);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<List<RequestDto>>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<List<RequestDto>>.Failure($"Failed to get requests: {ex.Message}");
        }
    }
}