using dev.Application.DTOs.Request;

namespace dev.Application.DTOs.History;

public class CreateHistoryDto
{
    public DateTime TimeStamp { get; set; }
    public PerformRequestDto Requests { get; set; }

    public int WorkSpaceId { get; set; }
}