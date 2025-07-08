namespace dev.Application.DTOs.Common;

/// <summary>
/// Generic API response wrapper for consistent response format
/// </summary>
/// <typeparam name="T">Type of data being returned</typeparam>
public class ApiResponse<T>
{
    /// <summary>
    /// Indicates if the operation was successful
    /// </summary>
    public bool Success { get; set; }
    
    /// <summary>
    /// The data payload of the response
    /// </summary>
    public T? Data { get; set; }
    
    /// <summary>
    /// A message describing the result of the operation
    /// </summary>
    public string Message { get; set; } = string.Empty;
}
