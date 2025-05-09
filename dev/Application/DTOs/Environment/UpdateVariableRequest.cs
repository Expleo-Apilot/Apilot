using System.ComponentModel.DataAnnotations;

namespace dev.Application.DTOs.Environment;

public class UpdateVariableRequest
{
    [Required]
    public int EnvironmentId { get; set; }
    public required string Key { get; set; } 
    public required string Value { get; set; }
}