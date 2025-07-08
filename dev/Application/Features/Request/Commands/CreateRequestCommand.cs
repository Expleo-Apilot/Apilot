using dev.Application.Common.Models;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Request.Commands;


public record CreateRequestCommand : IRequest<Result<RequestDto>>
{
    public required CreateRequestDto CreateRequest { get; init; }
}


public class CreateCommandRequestHandler : IRequestHandler<CreateRequestCommand, Result<RequestDto>>
{
    private readonly IRequestService _requestService;

    public CreateCommandRequestHandler(IRequestService requestService)
    {
        _requestService = requestService;
    }

    public async Task<Result<RequestDto>> Handle(CreateRequestCommand requestCommand, CancellationToken cancellationToken)
    {
        try
        {
            var request = await _requestService.CreateRequestAsync(requestCommand.CreateRequest);
            return Result<RequestDto>.Success(request);
        }
        catch (Exception ex)
        {
            return Result<RequestDto>.Failure($"Failed to create request: {ex.Message}");
        }
    }
}