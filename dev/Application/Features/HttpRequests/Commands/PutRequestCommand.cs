using dev.Application.DTOs.Request;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.HttpRequests.Commands;

public record PutRequestCommand : IRequest<HttpResponseDto>
{
    public required PerformRequestDto RequestDto { get; init; }
}


public class PutRequestCommandHandler : IRequestHandler<PutRequestCommand, HttpResponseDto>
{
    
    private readonly IPerformRequestService _performRequestService;

    public PutRequestCommandHandler(IPerformRequestService performRequestService)
    {
        _performRequestService = performRequestService;
    }

    public async Task<HttpResponseDto> Handle(PutRequestCommand request, CancellationToken cancellationToken)
    {
        return await _performRequestService.PutAsync(request.RequestDto);
    }
}