namespace dev.Application.Services.CurrentUser;

public interface ICurrentUserServiceSecond
{
    string? UserId { get; }
    string? UserName { get; }
    bool IsAuthenticated { get; }
    bool IsInRole(string role);
}
