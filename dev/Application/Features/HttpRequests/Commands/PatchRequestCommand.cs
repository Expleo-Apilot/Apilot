using dev.Application.DTOs.Request;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.HttpRequests.Commands;

public record PatchRequestCommand : IRequest<HttpResponseDto>
{
    public required PerformRequestDto RequestDto { get; init; }
}


public class PatchRequestCommandHandler : IRequestHandler<PatchRequestCommand, HttpResponseDto>
{
    
    private readonly IPerformRequestService _performRequestService;

    public PatchRequestCommandHandler(IPerformRequestService performRequestService)
    {
        _performRequestService = performRequestService;
    }

    public async Task<HttpResponseDto> Handle(PatchRequestCommand request, CancellationToken cancellationToken)
    {
        return await _performRequestService.PatchAsync(request.RequestDto);
    }
}