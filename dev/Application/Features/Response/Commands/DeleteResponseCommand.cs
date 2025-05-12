using dev.Application.Common.Models;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Response.Commands;



public record DeleteResponseCommand : IRequest<Result<Unit>>
{
    public required int ResponseId { get; init; }
}


public class DeleteResponseCommandHandler : IRequestHandler<DeleteResponseCommand, Result<Unit>>
{
    
    private readonly IResponseService _responseService;

    public DeleteResponseCommandHandler(IResponseService responseService)
    {
        _responseService = responseService;
    }

    public async Task<Result<Unit>> Handle(DeleteResponseCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _responseService.DeleteResponseAsync(request.ResponseId);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to delete response: {ex.Message}");
        }
    }
}