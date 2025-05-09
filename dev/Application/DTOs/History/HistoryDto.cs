using dev.Application.DTOs.Request;

namespace dev.Application.DTOs.History;

public class HistoryDto
{
    public int Id { get; set; }
    public DateTime TimeStamp { get; set; }
    public List<PerformRequestDto>? Requests { get; set; } = new List<PerformRequestDto>();

    public int WorkSpaceId { get; set; }
    public bool IsDeleted { get; set; }
    
   

   
}