using dev.Application.Common.Models;
using dev.Application.DTOs.Request;
using dev.Application.DTOs.TestScript;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.TestScript.Commands;

public record CreateScriptCommand : IRequest<Result<Unit>>
{
    public required CreateTestScriptDto ScriptDto { get; init; }
}

public class CreateScriptCommandHandler : IRequestHandler<CreateScriptCommand, Result<Unit>>
{
    private readonly IRequestService _requestService;

    public CreateScriptCommandHandler(IRequestService requestService)
    {
        _requestService = requestService;
    }

    public async Task<Result<Unit>> Handle(CreateScriptCommand requestCommand, CancellationToken cancellationToken)
    {
        
        try
        {
            await _requestService.UpdateScriptAsync(requestCommand.ScriptDto);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to update script request: {ex.Message}");
        }
    }
}