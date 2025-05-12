using dev.Application.Common.Models;
using dev.Application.DTOs.Folder;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Folder.Commands;



public record UpdateFolderCommand : IRequest<Result<Unit>>
{
    public required UpdateFolderDto UpdateFolderDto { get; init; }
}



public class UpdateFolderCommandHandler : IRequestHandler<UpdateFolderCommand, Result<Unit>>
{
    
    private readonly IFolderService _folderService;

    public UpdateFolderCommandHandler(IFolderService folderService)
    {
        _folderService = folderService;
    }


    public async Task<Result<Unit>> Handle(UpdateFolderCommand request, CancellationToken cancellationToken)
    {
        try
        {
            await _folderService.UpdateFolderAsync(request.UpdateFolderDto);
            return Result<Unit>.Success(Unit.Value);
        }
        catch (KeyNotFoundException ex)
        {
            return Result<Unit>.Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Result<Unit>.Failure($"Failed to update folder: {ex.Message}");
        }
    }
}