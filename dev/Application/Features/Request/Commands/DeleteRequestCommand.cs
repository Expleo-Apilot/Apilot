using dev.Application.Common.Models;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Request.Commands;



public record DeleteRequestCommand : IRequest<Result<Unit>>
{
    public int RequestId { get; set; }
}



public class DeleteRequestCommandHandler : IRequestHandler<DeleteRequestCommand, Result<Unit>>
{
    
    private readonly IRequestService _requestService;

    public DeleteRequestCommandHandler(IRequestService requestService)
    {
        _requestService = requestService;
    }

    public async Task<Result<Unit>> Handle(DeleteRequestCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _requestService.DeleteRequestAsync(request.RequestId);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to delete request: {ex.Message}");
        }
    }
}