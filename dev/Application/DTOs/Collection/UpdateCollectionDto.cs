namespace dev.Application.DTOs.Collection;

public class UpdateCollectionDto
{
    public int Id { get; set; }
    public required string Name { get; set; } 
    public required string Description { get; set; } 
    public int WorkSpaceId { get; set; }
}