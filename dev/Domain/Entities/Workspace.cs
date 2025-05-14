using dev.Application.DTOs.Collection;
using dev.Application.DTOs.Environment;
using dev.Application.DTOs.History;
using dev.Domain.Common;

namespace dev.Domain.Entities;

public class Workspace : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public List<Collection> Collections { get; set; } = new List<Collection>();
    public List<Environment> Environments { get; set; } = new List<Environment>();
    public List<HistoryEntity> Histories { get; set; } =  new List<HistoryEntity>();
}