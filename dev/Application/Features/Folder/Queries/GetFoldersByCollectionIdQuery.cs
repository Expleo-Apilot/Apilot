using dev.Application.Common.Models;
using dev.Application.DTOs.Folder;
using dev.Application.Interfaces;
using MediatR;

namespace dev.Application.Features.Folder.Queries;



public record GetFoldersByCollectionIdQuery : IRequest<Result<List<FolderDto>>>
{
    public required int Id { get; init; }
}



public class GetFoldersByCollectionIdQueryHandler : IRequestHandler<GetFoldersByCollectionIdQuery, Result<List<FolderDto>>>
{

    private readonly IFolderService _folderService;

    public GetFoldersByCollectionIdQueryHandler(IFolderService folderService)
    {
        _folderService = folderService;
    }

    public async Task<Result<List<FolderDto>>> Handle(GetFoldersByCollectionIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var folders = await _folderService.GetFoldersByCollectionIdAsync(request.Id);
            return Result<List<FolderDto>>.Success(folders);
        }
        catch (Exception ex)
        {
            return Result<List<FolderDto>>.Failure($"Failed to get folders: {ex.Message}");
        }
    }
}