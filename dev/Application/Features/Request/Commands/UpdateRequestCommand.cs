using dev.Application.Common.Models;
using dev.Application.DTOs.Request;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Request.Commands;


public record UpdateRequestCommand : IRequest<Result<Unit>>
{
    public required UpdateRequestDto Request { get; init; }
}


public class UpdateRequestCommandHandler : IRequestHandler<UpdateRequestCommand, Result<Unit>>
{
    
    private readonly IRequestService _requestService;

    public UpdateRequestCommandHandler(IRequestService requestService)
    {
        _requestService = requestService;
    }

    public async Task<Result<Unit>> Handle(UpdateRequestCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _requestService.UpdateRequestAsync(request.Request);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to update request: {ex.Message}");
        }
    }
}