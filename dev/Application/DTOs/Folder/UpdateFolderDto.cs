namespace dev.Application.DTOs.Folder;

public class UpdateFolderDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 
    public int CollectionId { get; set; }
}