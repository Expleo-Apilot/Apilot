using dev.Application.DTOs.Request;

namespace dev.Domain.Entities;

public class HistoryEntity 
{
    public int Id { get; set; }
    public DateTime TimeStamp { get; set; }
    public PerformRequestDto Requests { get; set; } = null!;
    public int WorkSpaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;
    public bool IsDeleted { get; set; }
}