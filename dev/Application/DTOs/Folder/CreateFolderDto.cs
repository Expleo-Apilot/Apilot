namespace dev.Application.DTOs.Folder;

public class CreateFolderDto
{
    public required string Name { get; set; } 
    public int CollectionId { get; set; }
}