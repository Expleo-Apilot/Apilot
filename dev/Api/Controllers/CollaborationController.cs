using dev.Api.Hubs;
using dev.Application.DTOs.Collaboration;
using dev.Application.DTOs.Common;
using dev.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;


namespace dev.Api.Controllers;

[ApiController]
[Route("/api/collaboration")]
[Authorize]
public class CollaborationController : ControllerBase
{
    private readonly ICollaborationService _collaborationService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IHubContext<CollaborationHub> _hubContext;
    private readonly ILogger<CollaborationController> _logger;

    public CollaborationController(
        ICollaborationService collaborationService,
        ICurrentUserService currentUserService,
        IHubContext<CollaborationHub> hubContext,
        ILogger<CollaborationController> logger)
    {
        _collaborationService = collaborationService ?? throw new ArgumentNullException(nameof(collaborationService));
        _currentUserService = currentUserService ?? throw new ArgumentNullException(nameof(currentUserService));
        _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }
    
    [HttpPost]
    public async Task<ActionResult<ApiResponse<CollaborationDto>>> CreateCollaboration([FromBody] CreateCollaborationRequest request)
    {
        try
        {
            _logger.LogInformation("Creating collaboration for collection {CollectionId} with user {Email}", 
                request.CollectionId, request.Email);
                
            var collaboration = await _collaborationService.CreateCollaborationAsync(request);
            
            // Send real-time notification to the invited user
            await _hubContext.Clients.User(collaboration.InvitedUserId)
                .SendAsync("ReceiveInvitation", collaboration);
                
            _logger.LogInformation("Collaboration created successfully for collection {CollectionId} with user {UserId}", 
                collaboration.CollectionId, collaboration.InvitedUserId);
                
            return Ok(new ApiResponse<CollaborationDto>
            {
                Success = true,
                Data = collaboration,
                Message = "Collaboration invitation sent successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt to create collaboration");
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Resource not found when creating collaboration");
            return NotFound(new ApiResponse<CollaborationDto>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid operation when creating collaboration");
            return BadRequest(new ApiResponse<CollaborationDto>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating collaboration");
            return StatusCode(500, new ApiResponse<CollaborationDto>
            {
                Success = false,
                Message = "An error occurred while creating the collaboration"
            });
        }
    }

    /// <summary>
    /// Updates the status of a collaboration (accept/decline)
    /// </summary>
    [HttpPut("status")]
    public async Task<ActionResult<ApiResponse<CollaborationDto>>> UpdateCollaborationStatus([FromBody] UpdateCollaborationStatusRequest request)
    {
        try
        {
            _logger.LogInformation("Updating collaboration status for collaboration {CollaborationId} to {Status}", 
                request.CollaborationId, request.Status);
                
            var collaboration = await _collaborationService.UpdateCollaborationStatusAsync(request);
            
            // Send real-time notification to the user who sent the invitation
            await _hubContext.Clients.User(collaboration.InvitedByUserId)
                .SendAsync("ReceiveInvitationResponse", collaboration);
                
            _logger.LogInformation("Collaboration status updated successfully for collaboration {CollaborationId} to {Status}", 
                collaboration.Id, collaboration.Status);
                
            return Ok(new ApiResponse<CollaborationDto>
            {
                Success = true,
                Data = collaboration,
                Message = $"Collaboration status updated to {collaboration.Status}"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt to update collaboration status");
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Collaboration not found when updating status");
            return NotFound(new ApiResponse<CollaborationDto>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating collaboration status");
            return StatusCode(500, new ApiResponse<CollaborationDto>
            {
                Success = false,
                Message = "An error occurred while updating the collaboration status"
            });
        }
    }

    /// <summary>
    /// Gets all collaborations for a collection
    /// </summary>
    [HttpGet("collection/{collectionId}")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CollaborationDto>>>> GetCollaborationsByCollection(int collectionId)
    {
        try
        {
            _logger.LogInformation("Getting collaborations for collection {CollectionId}", collectionId);
                
            var collaborations = await _collaborationService.GetCollaborationsByCollectionIdAsync(collectionId);
            
            _logger.LogInformation("Retrieved {Count} collaborations for collection {CollectionId}", 
                collaborations.Count(), collectionId);
                
            return Ok(new ApiResponse<IEnumerable<CollaborationDto>>
            {
                Success = true,
                Data = collaborations,
                Message = "Collaborations retrieved successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt to get collaborations for collection {CollectionId}", collectionId);
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Collection not found when retrieving collaborations for collection {CollectionId}", collectionId);
            return NotFound(new ApiResponse<IEnumerable<CollaborationDto>>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving collaborations for collection {CollectionId}", collectionId);
            return StatusCode(500, new ApiResponse<IEnumerable<CollaborationDto>>
            {
                Success = false,
                Message = "An error occurred while retrieving collaborations"
            });
        }
    }

    /// <summary>
    /// Gets all collaborations for the current user
    /// </summary>
    [HttpGet("user")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CollaborationDto>>>> GetCollaborationsForUser()
    {
        try
        {
            _logger.LogInformation("Getting all collaborations for user {UserId}", _currentUserService.UserId);
                
            var collaborations = await _collaborationService.GetCollaborationsForUserAsync();
            
            _logger.LogInformation("Retrieved {Count} collaborations for user {UserId}", 
                collaborations.Count(), _currentUserService.UserId);
                
            return Ok(new ApiResponse<IEnumerable<CollaborationDto>>
            {
                Success = true,
                Data = collaborations,
                Message = "User collaborations retrieved successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt to get collaborations for user {UserId}", 
                _currentUserService.UserId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving collaborations for user {UserId}", 
                _currentUserService.UserId);
            return StatusCode(500, new ApiResponse<IEnumerable<CollaborationDto>>
            {
                Success = false,
                Message = "An error occurred while retrieving user collaborations"
            });
        }
    }

    /// <summary>
    /// Gets all pending invitations for the current user
    /// </summary>
    [HttpGet("pending")]
    public async Task<ActionResult<ApiResponse<IEnumerable<CollaborationDto>>>> GetPendingInvitations()
    {
        try
        {
            _logger.LogInformation("Getting pending invitations for user {UserId}", _currentUserService.UserId);
                
            var invitations = await _collaborationService.GetPendingInvitationsAsync();
            
            _logger.LogInformation("Retrieved {Count} pending invitations for user {UserId}", 
                invitations.Count(), _currentUserService.UserId);
                
            return Ok(new ApiResponse<IEnumerable<CollaborationDto>>
            {
                Success = true,
                Data = invitations,
                Message = "Pending invitations retrieved successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt to get pending invitations for user {UserId}", 
                _currentUserService.UserId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving pending invitations for user {UserId}", 
                _currentUserService.UserId);
            return StatusCode(500, new ApiResponse<IEnumerable<CollaborationDto>>
            {
                Success = false,
                Message = "An error occurred while retrieving pending invitations"
            });
        }
    }

    /// <summary>
    /// Deletes a collaboration
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<object>>> DeleteCollaboration(int id)
    {
        try
        {
            _logger.LogInformation("Deleting collaboration {CollaborationId}", id);
                
            await _collaborationService.DeleteCollaborationAsync(id);
            
            _logger.LogInformation("Collaboration {CollaborationId} deleted successfully", id);
                
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Message = "Collaboration deleted successfully"
            });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access attempt to delete collaboration {CollaborationId}", id);
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            _logger.LogWarning(ex, "Collaboration {CollaborationId} not found when attempting to delete", id);
            return NotFound(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting collaboration {CollaborationId}", id);
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while deleting the collaboration"
            });
        }
    }
}
