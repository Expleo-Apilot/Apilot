using dev.Application.DTOs.Collaboration;
using dev.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace dev.Api.Hubs;

[Authorize]
public class CollaborationHub : Hub
{
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<CollaborationHub> _logger;

    public CollaborationHub(
        ICurrentUserService currentUserService,
        ILogger<CollaborationHub> logger)
    {
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    public override async Task OnConnectedAsync()
    {
        string userId = _currentUserService.UserId;
        
        if (!string.IsNullOrEmpty(userId))
        {
            // Add user to a group with their user ID
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            _logger.LogInformation("User {UserId} connected to CollaborationHub", userId);
        }
        
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        string userId = _currentUserService.UserId;
        
        if (!string.IsNullOrEmpty(userId))
        {
            // Remove user from their user ID group
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, userId);
            _logger.LogInformation("User {UserId} disconnected from CollaborationHub", userId);
        }
        
        await base.OnDisconnectedAsync(exception);
    }

    // Methods that can be called from the client
    public async Task JoinCollectionGroup(int collectionId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"collection_{collectionId}");
        _logger.LogInformation("User {UserId} joined collection group {CollectionId}", 
            _currentUserService.UserId, collectionId);
    }

    public async Task LeaveCollectionGroup(int collectionId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"collection_{collectionId}");
        _logger.LogInformation("User {UserId} left collection group {CollectionId}", 
            _currentUserService.UserId, collectionId);
    }
}
