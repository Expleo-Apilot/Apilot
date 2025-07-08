using dev.Application.Common.Models;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Folder.Commands;


public record DeleteFolderCommand : IRequest<Result<Unit>>
{
    public required int Id { get; init; }
}



public class DeleteFolderCommandHandler : IRequestHandler<DeleteFolderCommand, Result<Unit>>
{
    private readonly IFolderService _folderService;

    public DeleteFolderCommandHandler(IFolderService folderService)
    {
        _folderService = folderService;
    }

    public async Task<Result<Unit>> Handle(DeleteFolderCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _folderService.DeleteFolderAsync(request.Id);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to delete folder: {ex.Message}");
        }
    }
}