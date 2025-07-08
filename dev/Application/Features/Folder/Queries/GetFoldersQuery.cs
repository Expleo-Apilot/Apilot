using dev.Application.Common.Models;
using dev.Application.DTOs.Folder;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Folder.Queries;


public record GetFoldersQuery : IRequest<Result<List<FolderDto>>>;


public class GetFoldersQueryHandler : IRequestHandler<GetFoldersQuery, Result<List<FolderDto>>>
{

    private readonly IFolderService _folderService;

    public GetFoldersQueryHandler(IFolderService folderService)
    {
        _folderService = folderService;
    }

    public async Task<Result<List<FolderDto>>> Handle(GetFoldersQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var folders = await _folderService.GetAllFoldersAsync();
            return Result<List<FolderDto>>.Success(folders);
        }
        catch (Exception ex)
        {
            return Result<List<FolderDto>>.Failure($"Failed to get folders: {ex.Message}");
        }
    }
}