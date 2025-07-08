using dev.Application.DTOs.Request;
using dev.Application.DTOs.Response;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.HttpRequests.Commands;

public record PostRequestCommand : IRequest<HttpResponseDto>
{
    public required PerformRequestDto RequestDto { get; init; }
}


public class PostRequestCommandHandler : IRequestHandler<PostRequestCommand, HttpResponseDto>
{
    private readonly IPerformRequestService _performRequestService;

    public PostRequestCommandHandler(IPerformRequestService performRequestService)
    {
        _performRequestService = performRequestService;
    }

    public async Task<HttpResponseDto> Handle(PostRequestCommand request, CancellationToken cancellationToken)
    {
        return await _performRequestService.PostAsync(request.RequestDto);
    }
}