using dev.Application.DTOs.Request;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.HttpRequests.Queries;

public record GetRequestQuery : IRequest<HttpResponseDto>
{
    public required PerformRequestDto RequestDto { get; init; }
}


public class GetRequestQueryHandler : IRequestHandler<GetRequestQuery, HttpResponseDto>
{
    private readonly IPerformRequestService _performRequestService;

    public GetRequestQueryHandler(IPerformRequestService performRequestService)
    {
        _performRequestService = performRequestService;
    }

    
    public async Task<HttpResponseDto> Handle(GetRequestQuery request, CancellationToken cancellationToken)
    {
        return await _performRequestService.GetAsync(request.RequestDto);
    }
}