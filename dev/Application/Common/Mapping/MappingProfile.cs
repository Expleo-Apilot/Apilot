using AutoMapper;
using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Environment;
using dev.Application.DTOs.Folder;
using dev.Application.DTOs.History;
using dev.Application.DTOs.Request;
using dev.Application.DTOs.Response;
using dev.Application.DTOs.Workspace;
using dev.Domain.Entities;
using Environment = dev.Domain.Entities.Environment;

namespace dev.Application.Common.Mapping;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        
        CreateMap<Workspace , WorkspaceDto>().ReverseMap();
        CreateMap<CreateWorkspaceDto , Workspace>().ReverseMap();
        CreateMap<UpdateWorkspaceDto, Workspace>().ReverseMap();
        
        CreateMap<Environment , EnvironmentDto>().ReverseMap();
        CreateMap<CreateEnvironmentRequest , Environment>().ReverseMap();
        CreateMap<UpdateEnvironmentRequest, Environment>().ReverseMap();
        
        CreateMap<Collection , CollectionDto>().ReverseMap();
        CreateMap<CreateCollectionDto , Collection>().ReverseMap();
        CreateMap<UpdateCollectionDto, Collection>().ReverseMap();
        
        CreateMap<Folder , FolderDto>().ReverseMap();
        CreateMap<CreateFolderDto , Folder>().ReverseMap();
        CreateMap<UpdateFolderDto, Folder>().ReverseMap();
        
        CreateMap<RequestEntity, RequestDto>().ReverseMap();
        CreateMap<CreateRequestDto, RequestEntity>().ReverseMap();
        CreateMap<UpdateRequestDto, RequestEntity>().ReverseMap();
        
        CreateMap<ResponseEntity, ResponseDto>().ReverseMap();
        CreateMap<CreateResponseDto, ResponseEntity>().ReverseMap();
        CreateMap<UpdateResponseDto, ResponseEntity>().ReverseMap();
        
        CreateMap<HistoryEntity, HistoryDto>().ReverseMap();
        CreateMap<CreateHistoryDto, HistoryEntity>().ReverseMap();
    }
}