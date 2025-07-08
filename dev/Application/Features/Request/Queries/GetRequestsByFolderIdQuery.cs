using dev.Application.Common.Models;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Request.Queries;



public record GetRequestsByFolderIdQuery : IRequest<Result<List<RequestDto>>>
{
    public required int FolderId { get; init; }
}


public class GetRequestsByFolderIdQueryHandler : IRequestHandler<GetRequestsByFolderIdQuery, Result<List<RequestDto>>>
{
    
    private readonly IRequestService _requestService;

    public GetRequestsByFolderIdQueryHandler(IRequestService requestService)
    {
        _requestService = requestService;
    }

    public async Task<Result<List<RequestDto>>> Handle(GetRequestsByFolderIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var requests = await _requestService.GetRequestsByFolderIdAsync(request.FolderId);
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