using dev.Application.Common.Models;
using dev.Application.DTOs.Folder;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Folder.Commands;


public record CreateFolderCommand : IRequest<Result<FolderDto>>
{
    public required CreateFolderDto CreateFolder { get; init; }
}


public class CreateFolderCommandHandler : IRequestHandler<CreateFolderCommand, Result<FolderDto>>
{
    private readonly IFolderService _folderService;

    public CreateFolderCommandHandler(IFolderService folderService)
    {
        _folderService = folderService;
    }


    public async Task<Result<FolderDto>> Handle(CreateFolderCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var folder = await _folderService.CreateFolderAsync(request.CreateFolder);
            return Result<FolderDto>.Success(folder);
        }
        catch (Exception ex)
        {
            return Result<FolderDto>.Failure($"Failed to create folder: {ex.Message}");
        }
    }
}