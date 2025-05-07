using dev.Application.DTOs.Request;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.HttpRequests.Commands;

public record DeleteRequestCommand : IRequest<HttpResponseDto>
{
    public required PerformRequestDto RequestDto { get; init; }
}


public class DeleteRequestCommandHandler : IRequestHandler<DeleteRequestCommand, HttpResponseDto>
{
    
    private readonly IPerformRequestService _performRequestService;

    public DeleteRequestCommandHandler(IPerformRequestService performRequestService)
    {
        _performRequestService = performRequestService;
    }

    public async Task<HttpResponseDto> Handle(DeleteRequestCommand request, CancellationToken cancellationToken)
    {
        return await _performRequestService.DeleteAsync(request.RequestDto);
    }
}