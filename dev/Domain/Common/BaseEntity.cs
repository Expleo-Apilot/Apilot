namespace dev.Domain.Common;

public class BaseEntity
{
    public int Id { get; set; }
    public bool IsDeleted { get; set; }
    public bool IsSync { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? LastSyncDate { get; set; }
    public Guid SyncId { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
   
}